import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Module, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { PlanStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { AuthUser, Roles } from '../common/auth.guard';
import { ClientIp, CurrentUser } from '../common/current-user';
import { vnDay } from '../clinic/util';

class ItemDto { @IsString() serviceCode: string; @IsOptional() @IsString() region?: string; @IsOptional() @IsString() note?: string }
class PlanDto {
  @IsString() encounterId: string;
  @IsInt() @Min(1) @Max(60) totalSessions: number;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsInt() @Min(1) reevalAfter?: number;
  @IsOptional() @IsString() therapistId?: string;
  @IsOptional() @IsString() note?: string;
  @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ItemDto) items: ItemDto[];
}
class PlanPatchDto {
  @IsOptional() @IsEnum(PlanStatus) status?: PlanStatus;
  @IsOptional() @IsInt() @Min(1) @Max(60) totalSessions?: number;
  @IsOptional() @IsString() frequency?: string;
  @IsOptional() @IsInt() @Min(1) reevalAfter?: number;
  @IsOptional() @IsString() therapistId?: string;
  @IsOptional() @IsString() note?: string;
}
class LineDto { @IsString() serviceCode: string; @IsOptional() @IsInt() @Min(1) @Max(240) minutes?: number; @IsOptional() @IsString() detail?: string }
class SessionDto {
  @IsOptional() @IsString() encounterId?: string;
  @IsOptional() @IsString() progress?: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsBoolean() adverse?: boolean;
  @IsOptional() @IsBoolean() acknowledgeRisk?: boolean; // xác nhận đã đọc cảnh báo "hoãn/chuyển tuyến"
  @IsArray() @ArrayMaxSize(15) @ValidateNested({ each: true }) @Type(() => LineDto) lines: LineDto[];
}

const sessionInclude = { lines: { orderBy: { sort: 'asc' as const } } };

@Controller('plans')
export class TreatmentController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async names(ids: (string | null | undefined)[]) {
    const uniq = [...new Set(ids.filter(Boolean))] as string[];
    const us = await this.prisma.user.findMany({ where: { id: { in: uniq } }, select: { id: true, fullName: true } });
    return Object.fromEntries(us.map((u) => [u.id, u.fullName]));
  }

  private async progressOf(planIds: string[]) {
    const rows = await this.prisma.treatmentSession.groupBy({ by: ['planId'], where: { planId: { in: planIds } }, _count: { _all: true }, _max: { date: true } });
    return Object.fromEntries(rows.map((r) => [r.planId, { used: r._count._all, last: r._max.date }]));
  }

  // Doctor: ra chỉ định liệu trình sau khi khám
  @Roles('DOCTOR')
  @Post()
  async create(@Body() b: PlanDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const enc = await this.prisma.encounter.findUnique({ where: { id: b.encounterId }, include: { exam: true } });
    if (!enc) throw new NotFoundException('Không tìm thấy lượt khám');
    if (!b.items.length) throw new BadRequestException('Chọn ít nhất một thủ thuật');
    const codes = [...new Set(b.items.map((i) => i.serviceCode))];
    const found = await this.prisma.service.count({ where: { code: { in: codes }, active: true } });
    if (found !== codes.length) throw new BadRequestException('Có thủ thuật không nằm trong bảng giá');
    const d: any = enc.exam?.data ?? {};
    const diagnosis = [d.diagnosis?.modernMain, d.diagnosis?.tcmName].filter(Boolean).join(' / ') || null;
    const plan = await this.prisma.treatmentPlan.create({
      data: {
        patientId: enc.patientId, encounterId: enc.id, examFormId: enc.exam?.id, doctorId: u.id, therapistId: b.therapistId ?? enc.therapistId,
        totalSessions: b.totalSessions, frequency: b.frequency, reevalAfter: b.reevalAfter, note: b.note, diagnosis,
        items: { create: b.items.map((i) => ({ serviceCode: i.serviceCode, region: i.region, note: i.note })) },
      },
      include: { items: true },
    });
    await this.audit.log({ userId: u.id, username: u.username, action: 'CREATE', entity: 'TreatmentPlan', entityId: plan.id, ip });
    return plan;
  }

  // Danh sách liệu trình. Lễ tân chỉ thấy tiến độ (không thấy chẩn đoán/chỉ định).
  @Roles('DOCTOR', 'THERAPIST', 'MANAGER', 'RECEPTION')
  @Get()
  async list(@CurrentUser() u: AuthUser, @Query('status') status: PlanStatus = 'ACTIVE', @Query('patientId') patientId?: string) {
    const plans = await this.prisma.treatmentPlan.findMany({ where: { status, patientId }, include: { patient: { select: { id: true, code: true, fullName: true, phone: true } } }, orderBy: { updatedAt: 'desc' }, take: 300 });
    const prog = await this.progressOf(plans.map((p) => p.id));
    const names = await this.names(plans.map((p) => p.therapistId));
    return plans.map((p) => ({
      id: p.id, patient: p.patient, status: p.status, totalSessions: p.totalSessions, used: prog[p.id]?.used ?? 0, lastSessionAt: prog[p.id]?.last ?? null,
      frequency: p.frequency, reevalAfter: p.reevalAfter, therapistName: p.therapistId ? names[p.therapistId] : null, createdAt: p.createdAt,
      ...(u.role === 'RECEPTION' ? {} : { diagnosis: p.diagnosis }),
    }));
  }

  @Roles('DOCTOR', 'THERAPIST', 'MANAGER')
  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const plan = await this.prisma.treatmentPlan.findUnique({ where: { id }, include: { items: true, patient: true, sessions: { orderBy: { sessionNo: 'asc' }, include: sessionInclude } } });
    if (!plan) throw new NotFoundException();
    const exam = plan.examFormId ? await this.prisma.examForm.findUnique({ where: { id: plan.examFormId }, include: { amendments: { orderBy: { version: 'desc' }, take: 1 } } }) : null;
    const ed: any = exam?.amendments[0]?.data ?? exam?.data ?? {};
    const names = await this.names([plan.doctorId, plan.therapistId, ...plan.sessions.map((s) => s.performedById)]);
    await this.audit.log({ userId: u.id, username: u.username, action: 'VIEW', entity: 'TreatmentPlan', entityId: id, ip });
    const { patient: p, sessions, ...rest } = plan;
    const used = sessions.length;
    return {
      ...rest,
      patient: { id: p.id, code: p.code, fullName: p.fullName, birthYear: p.birthYear, gender: p.gender, phone: p.phone },
      doctorName: names[plan.doctorId], therapistName: plan.therapistId ? names[plan.therapistId] : null,
      used, remaining: Math.max(plan.totalSessions - used, 0),
      reevalDue: !!plan.reevalAfter && used > 0 && used % plan.reevalAfter === 0 && plan.status === 'ACTIVE',
      safety: { conclusion: exam?.screening ?? null, cautions: ed.screening?.cautions ?? [], redFlags: ed.screening?.redFlags ?? [] },
      sessions: sessions.map((s) => ({ ...s, performedByName: names[s.performedById] })),
    };
  }

  @Roles('DOCTOR')
  @Patch(':id')
  async patch(@Param('id') id: string, @Body() b: PlanPatchDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const used = await this.prisma.treatmentSession.count({ where: { planId: id } });
    if (b.totalSessions !== undefined && b.totalSessions < used) throw new BadRequestException(`Đã thực hiện ${used} buổi, không thể đặt tổng số buổi thấp hơn`);
    const plan = await this.prisma.treatmentPlan.update({ where: { id }, data: b });
    await this.audit.log({ userId: u.id, username: u.username, action: 'UPDATE', entity: 'TreatmentPlan', entityId: id, ip, meta: b });
    return plan;
  }

  // Trị liệu viên ghi một buổi vào phiếu theo dõi
  @Roles('THERAPIST', 'DOCTOR')
  @Post(':id/sessions')
  async addSession(@Param('id') id: string, @Body() b: SessionDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const plan = await this.prisma.treatmentPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException();
    if (plan.status !== 'ACTIVE') throw new ConflictException('Liệu trình không còn hiệu lực');
    if (!b.lines.length) throw new BadRequestException('Ghi ít nhất một phương pháp đã thực hiện');

    const exam = plan.examFormId ? await this.prisma.examForm.findUnique({ where: { id: plan.examFormId } }) : null;
    if (exam?.screening === 'DEFER' && !b.acknowledgeRisk)
      throw new ConflictException({ message: 'Sàng lọc kết luận HOÃN/CHUYỂN TUYẾN. Cần xác nhận lại với bác sĩ trước khi điều trị.', code: 'SCREENING_DEFER' });

    const codes = [...new Set(b.lines.map((l) => l.serviceCode))];
    if ((await this.prisma.service.count({ where: { code: { in: codes } } })) !== codes.length) throw new BadRequestException('Có phương pháp không nằm trong bảng giá');

    let encId = b.encounterId;
    if (!encId) {
      const open = await this.prisma.encounter.findFirst({ where: { patientId: plan.patientId, status: { notIn: ['DONE', 'CANCELLED'] } }, orderBy: { visitDate: 'desc' } });
      encId = open?.id;
    }
    try {
      const session = await this.prisma.$transaction(async (tx) => {
        const used = await tx.treatmentSession.count({ where: { planId: id } });
        if (used >= plan.totalSessions) throw new ConflictException('Liệu trình đã đủ số buổi. Cần bác sĩ gia hạn.');
        if (encId && (await tx.treatmentSession.count({ where: { planId: id, encounterId: encId } })))
          throw new ConflictException('Lượt khám này đã có buổi điều trị được ghi');
        const s = await tx.treatmentSession.create({
          data: {
            planId: id, encounterId: encId, sessionNo: used + 1, progress: b.progress, note: b.note, adverse: !!b.adverse, performedById: u.id,
            lines: { create: b.lines.map((l, i) => ({ serviceCode: l.serviceCode, minutes: l.minutes, detail: l.detail, sort: i })) },
          },
          include: sessionInclude,
        });
        if (used + 1 >= plan.totalSessions) await tx.treatmentPlan.update({ where: { id }, data: { status: 'COMPLETED' } });
        if (encId) await tx.encounter.update({ where: { id: encId }, data: { status: 'CHECKOUT', therapistId: u.role === 'THERAPIST' ? u.id : undefined } });
        return s;
      });
      await this.audit.log({ userId: u.id, username: u.username, action: 'CREATE', entity: 'TreatmentSession', entityId: session.id, ip, meta: { planId: id, no: session.sessionNo, adverse: !!b.adverse } });
      return session;
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Buổi này vừa được người khác ghi, hãy tải lại');
      throw e;
    }
  }

  // Sửa buổi đã ghi: chỉ người thực hiện hoặc bác sĩ, trong cùng ngày
  @Roles('THERAPIST', 'DOCTOR')
  @Patch(':id/sessions/:sid')
  async editSession(@Param('id') id: string, @Param('sid') sid: string, @Body() b: SessionDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const s = await this.prisma.treatmentSession.findFirst({ where: { id: sid, planId: id } });
    if (!s) throw new NotFoundException();
    if (u.role !== 'DOCTOR' && s.performedById !== u.id) throw new ForbiddenException('Chỉ người thực hiện mới sửa được');
    if (vnDay(s.createdAt) !== vnDay()) throw new ForbiddenException('Đã qua ngày, không sửa được. Hãy báo quản lý/bác sĩ.');
    if (!b.lines.length) throw new BadRequestException('Ghi ít nhất một phương pháp');
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.treatmentLine.deleteMany({ where: { sessionId: sid } });
      return tx.treatmentSession.update({ where: { id: sid }, data: { progress: b.progress, note: b.note, adverse: !!b.adverse, lines: { create: b.lines.map((l, i) => ({ serviceCode: l.serviceCode, minutes: l.minutes, detail: l.detail, sort: i })) } }, include: sessionInclude });
    });
    await this.audit.log({ userId: u.id, username: u.username, action: 'UPDATE', entity: 'TreatmentSession', entityId: sid, ip });
    return updated;
  }
}

@Module({ controllers: [TreatmentController] })
export class TreatmentModule {}
