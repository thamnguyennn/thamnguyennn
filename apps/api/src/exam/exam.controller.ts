import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Module, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { IsInt, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { AuthUser, Roles } from '../common/auth.guard';
import { ClientIp, CurrentUser } from '../common/current-user';

class SaveDto { @IsObject() data: Record<string, any>; @IsInt() rev: number }
class SignDto { @IsInt() rev: number }
class AmendDto { @IsString() @MinLength(5) reason: string; @IsObject() data: Record<string, any> }

const MAX_BYTES = 200_000;

// Làm sạch và tính lại các giá trị suy ra (BMI) ở phía máy chủ
function normalize(data: Record<string, any>) {
  if (JSON.stringify(data).length > MAX_BYTES) throw new BadRequestException('Nội dung phiếu quá lớn');
  const v = data.vitals;
  if (v && Number(v.height) > 0 && Number(v.weight) > 0) {
    const m = Number(v.height) / 100;
    v.bmi = Math.round((Number(v.weight) / (m * m)) * 10) / 10;
  } else if (v) v.bmi = '';
  return data;
}

// Nội dung hiệu lực = bản điều chỉnh mới nhất (nếu có), bản gốc luôn được giữ nguyên
const effective = (f: { data: any; amendments?: { data: any; version: number }[] }) =>
  f.amendments?.length ? f.amendments.reduce((a, b) => (b.version > a.version ? b : a)).data : f.data;

const CONCLUSIONS = ['ACCEPT', 'CAUTION', 'DEFER'];

@Controller('exams')
export class ExamController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // Mở phiếu khám của một lượt khám (nếu chưa có thì trả form rỗng, chưa lưu)
  @Roles('DOCTOR', 'THERAPIST', 'MANAGER')
  @Get('by-encounter/:encId')
  async get(@Param('encId') encId: string, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const enc = await this.prisma.encounter.findUnique({ where: { id: encId }, include: { patient: true } });
    if (!enc) throw new NotFoundException('Không tìm thấy lượt khám');
    const exam = await this.prisma.examForm.findUnique({ where: { encounterId: encId }, include: { amendments: { orderBy: { version: 'asc' } } } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'VIEW', entity: 'ExamForm', entityId: exam?.id ?? `enc:${encId}`, ip });
    const doctor = exam?.signedById ? await this.prisma.user.findUnique({ where: { id: exam.signedById }, select: { fullName: true, title: true } }) : null;
    const therapist = enc.therapistId ? await this.prisma.user.findUnique({ where: { id: enc.therapistId }, select: { fullName: true } }) : null;
    const assignedDoctor = enc.doctorId ? await this.prisma.user.findUnique({ where: { id: enc.doctorId }, select: { fullName: true } }) : null;
    return {
      encounter: { id: enc.id, visitNo: enc.visitNo, visitDate: enc.visitDate, status: enc.status },
      patient: { id: enc.patient.id, code: enc.patient.code, fullName: enc.patient.fullName, birthYear: enc.patient.birthYear, gender: enc.patient.gender, phone: enc.patient.phone, address: enc.patient.address, occupation: enc.patient.occupation },
      doctorName: assignedDoctor?.fullName ?? null, therapistName: therapist?.fullName ?? null,
      exam: exam && { id: exam.id, status: exam.status, rev: exam.rev, screening: exam.screening, signedAt: exam.signedAt, signedBy: doctor, data: exam.data, amendments: exam.amendments, effective: effective(exam) },
    };
  }

  // Lưu nháp (tự động lưu). Phiếu đã ký không được ghi đè.
  @Roles('DOCTOR')
  @Put('by-encounter/:encId')
  async save(@Param('encId') encId: string, @Body() b: SaveDto, @CurrentUser() u: AuthUser) {
    const enc = await this.prisma.encounter.findUnique({ where: { id: encId } });
    if (!enc) throw new NotFoundException();
    const data = normalize(b.data);
    const screening = CONCLUSIONS.includes(data.screening?.conclusion) ? data.screening.conclusion : null;
    const cur = await this.prisma.examForm.findUnique({ where: { encounterId: encId } });
    if (!cur) {
      const f = await this.prisma.examForm.create({ data: { encounterId: encId, patientId: enc.patientId, data, screening, createdById: u.id, updatedById: u.id } });
      if (enc.status === 'WAITING') await this.prisma.encounter.update({ where: { id: encId }, data: { status: 'IN_EXAM', doctorId: enc.doctorId ?? u.id } });
      return { rev: f.rev, id: f.id, data };
    }
    if (cur.status === 'SIGNED') throw new ConflictException('Phiếu đã ký, chỉ có thể thêm bản điều chỉnh');
    if (cur.rev !== b.rev) throw new ConflictException({ message: 'Phiếu vừa được người khác cập nhật. Hãy tải lại trang.', code: 'REV_MISMATCH' });
    const f = await this.prisma.examForm.update({ where: { id: cur.id }, data: { data, screening, rev: { increment: 1 }, updatedById: u.id } });
    return { rev: f.rev, id: f.id, data };
  }

  // Ký: khóa phiếu
  @Roles('DOCTOR')
  @Post('by-encounter/:encId/sign')
  async sign(@Param('encId') encId: string, @Body() b: SignDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const cur = await this.prisma.examForm.findUnique({ where: { encounterId: encId } });
    if (!cur) throw new BadRequestException('Chưa có nội dung phiếu');
    if (cur.status === 'SIGNED') throw new ConflictException('Phiếu đã được ký');
    if (cur.rev !== b.rev) throw new ConflictException({ message: 'Phiếu vừa được cập nhật, hãy tải lại trang.', code: 'REV_MISMATCH' });
    const d: any = cur.data;
    const missing: string[] = [];
    if (!String(d.reason ?? '').trim()) missing.push('Lý do đến khám');
    if (!CONCLUSIONS.includes(d.screening?.conclusion)) missing.push('Kết luận sàng lọc an toàn (mục V)');
    if (!String(d.diagnosis?.modernMain ?? '').trim() && !String(d.diagnosis?.tcmName ?? '').trim()) missing.push('Chẩn đoán (mục IX)');
    if (missing.length) throw new BadRequestException(`Còn thiếu: ${missing.join('; ')}`);
    const f = await this.prisma.examForm.update({ where: { id: cur.id }, data: { status: 'SIGNED', signedById: u.id, signedAt: new Date(), rev: { increment: 1 } } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'SIGN', entity: 'ExamForm', entityId: f.id, ip });
    return { ok: true, signedAt: f.signedAt, rev: f.rev };
  }

  // Điều chỉnh sau khi ký: thêm bản mới kèm lý do, không sửa bản gốc
  @Roles('DOCTOR')
  @Post('by-encounter/:encId/amend')
  async amend(@Param('encId') encId: string, @Body() b: AmendDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const cur = await this.prisma.examForm.findUnique({ where: { encounterId: encId }, include: { amendments: true } });
    if (!cur || cur.status !== 'SIGNED') throw new BadRequestException('Chỉ điều chỉnh được phiếu đã ký');
    const version = cur.amendments.length + 1;
    const data = normalize(b.data);
    const screening = CONCLUSIONS.includes(data.screening?.conclusion) ? data.screening.conclusion : cur.screening;
    const a = await this.prisma.$transaction(async (tx) => {
      await tx.examForm.update({ where: { id: cur.id }, data: { screening } });
      return tx.examAmendment.create({ data: { examFormId: cur.id, version, reason: b.reason.trim(), data, byId: u.id } });
    });
    await this.audit.log({ userId: u.id, username: u.username, action: 'AMEND', entity: 'ExamForm', entityId: cur.id, ip, meta: { version, reason: b.reason } });
    return a;
  }

  // Các lần khám trước của bệnh nhân (để bác sĩ tham khảo)
  @Roles('DOCTOR', 'MANAGER')
  @Get('history/:patientId')
  async history(@Param('patientId') patientId: string, @Query('exclude') exclude?: string) {
    const rows = await this.prisma.examForm.findMany({ where: { patientId, status: 'SIGNED', ...(exclude ? { encounterId: { not: exclude } } : {}) }, orderBy: { signedAt: 'desc' }, take: 10, include: { encounter: { select: { visitNo: true, visitDate: true } }, amendments: true } });
    return rows.map((r) => { const d: any = effective(r); return { id: r.id, encounterId: r.encounterId, visitNo: r.encounter.visitNo, visitDate: r.encounter.visitDate, reason: d.reason, diagnosis: d.diagnosis, screening: r.screening }; });
  }

  @Roles('DOCTOR', 'MANAGER')
  @Get('icd10')
  icd(@Query('q') q = '') {
    const s = q.trim();
    if (s.length < 2) return [];
    return this.prisma.icd10.findMany({ where: { OR: [{ code: { startsWith: s.toUpperCase() } }, { name: { contains: s, mode: 'insensitive' } }] }, take: 15, orderBy: { code: 'asc' } });
  }
}

@Controller('services')
export class ServicesController {
  constructor(private prisma: PrismaService) {}
  @Get() list() { return this.prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }); }
}

@Module({ controllers: [ExamController, ServicesController] })
export class ExamModule {}
