import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { AppointmentStatus, EncounterStatus, Gender, LeadStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { AuthUser, Roles } from '../common/auth.guard';
import { ClientIp, CurrentUser } from '../common/current-user';
import { ClinicService } from './clinic.service';
import { dayRange, normPhone, vnDay } from './util';

// ───────── DTO ─────────
class LeadDto { @IsString() @MinLength(2) fullName: string; @IsString() phone: string; @IsOptional() @IsString() sourceId?: string; @IsOptional() @IsString() saleId?: string; @IsOptional() @IsString() note?: string }
class LeadUpdateDto { @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus; @IsOptional() @IsString() sourceId?: string; @IsOptional() @IsString() saleId?: string; @IsOptional() @IsString() note?: string }
class ApptDto {
  @IsOptional() @IsString() leadId?: string; @IsOptional() @IsString() patientId?: string;
  @IsString() @MinLength(2) fullName: string; @IsString() phone: string;
  @IsDateString() startAt: string;
  @IsOptional() @IsInt() @Min(10) @Max(240) durationMin?: number;
  @IsOptional() @IsString() doctorId?: string; @IsOptional() @IsString() therapistId?: string; @IsOptional() @IsString() saleId?: string;
  @IsOptional() @IsString() note?: string;
}
class ApptUpdateDto {
  @IsOptional() @IsDateString() startAt?: string; @IsOptional() @IsInt() durationMin?: number;
  @IsOptional() @IsString() doctorId?: string; @IsOptional() @IsString() therapistId?: string;
  @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus; @IsOptional() @IsString() note?: string;
}
class PatientDto {
  @IsString() @MinLength(2) fullName: string;
  @IsInt() @Min(1900) @Max(2100) @Type(() => Number) birthYear: number;
  @IsEnum(Gender) gender: Gender;
  @IsString() phone: string;
  @IsOptional() @IsString() address?: string; @IsOptional() @IsString() occupation?: string; @IsOptional() @IsString() note?: string;
  @IsBoolean() consent: boolean; // đã được giải thích & đồng ý xử lý dữ liệu
  @IsOptional() @IsString() consentMethod?: string;
  @IsOptional() @IsBoolean() force?: boolean; // bỏ qua cảnh báo trùng
}
class CheckInDto { @IsString() patientId: string; @IsOptional() @IsString() appointmentId?: string; @IsOptional() @IsString() doctorId?: string; @IsOptional() @IsString() therapistId?: string }
class EncStatusDto { @IsEnum(EncounterStatus) status: EncounterStatus }

const CONSENT_VERSION = 'v1-2026';

// ───────── Lead / nguồn khách ─────────
@Controller('leads')
export class LeadsController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Get('sources') sources() { return this.prisma.leadSource.findMany({ where: { active: true }, orderBy: { name: 'asc' } }); }

  @Roles('SALE', 'RECEPTION', 'MANAGER')
  @Get()
  list(@Query('status') status?: LeadStatus, @Query('q') q?: string, @CurrentUser() u?: AuthUser) {
    return this.prisma.lead.findMany({
      where: { status, ...(u!.role === 'SALE' ? { saleId: u!.id } : {}), ...(q ? { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { phone: { contains: normPhone(q) } }] } : {}) },
      include: { source: true }, orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  @Roles('SALE', 'MANAGER')
  @Post()
  async create(@Body() b: LeadDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const lead = await this.prisma.lead.create({ data: { ...b, phone: normPhone(b.phone), saleId: b.saleId ?? (u.role === 'SALE' ? u.id : undefined) } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'CREATE', entity: 'Lead', entityId: lead.id, ip });
    return lead;
  }

  @Roles('SALE', 'MANAGER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() b: LeadUpdateDto) { return this.prisma.lead.update({ where: { id }, data: b }); }
}

// ───────── Lịch hẹn ─────────
@Controller('appointments')
export class AppointmentsController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Roles('SALE', 'RECEPTION', 'DOCTOR', 'THERAPIST', 'MANAGER')
  @Get()
  list(@Query('day') day = vnDay(), @Query('doctorId') doctorId?: string, @Query('therapistId') therapistId?: string) {
    return this.prisma.appointment.findMany({ where: { startAt: dayRange(day), doctorId, therapistId }, include: { patient: { select: { code: true } } }, orderBy: { startAt: 'asc' } });
  }

  @Roles('SALE', 'RECEPTION', 'MANAGER')
  @Post()
  async create(@Body() b: ApptDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const startAt = new Date(b.startAt);
    if (startAt.getTime() < Date.now() - 3600_000) throw new BadRequestException('Không thể đặt lịch trong quá khứ');
    const a = await this.prisma.appointment.create({ data: { ...b, startAt, phone: normPhone(b.phone), saleId: b.saleId ?? (u.role === 'SALE' ? u.id : undefined), createdById: u.id } });
    if (a.leadId) await this.prisma.lead.update({ where: { id: a.leadId }, data: { status: 'BOOKED' } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'CREATE', entity: 'Appointment', entityId: a.id, ip });
    return a;
  }

  @Roles('SALE', 'RECEPTION', 'MANAGER')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() b: ApptUpdateDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const a = await this.prisma.appointment.update({ where: { id }, data: { ...b, startAt: b.startAt ? new Date(b.startAt) : undefined } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'UPDATE', entity: 'Appointment', entityId: id, ip, meta: b });
    return a;
  }
}

// ───────── Bệnh nhân ─────────
@Controller('patients')
export class PatientsController {
  constructor(private prisma: PrismaService, private audit: AuditService, private clinic: ClinicService) {}

  // Tìm nhanh theo SĐT / tên / mã hồ sơ
  @Roles('RECEPTION', 'DOCTOR', 'THERAPIST', 'MANAGER')
  @Get()
  search(@Query('q') q = '') {
    const s = q.trim();
    if (s.length < 2) return [];
    return this.prisma.patient.findMany({
      where: { OR: [{ code: { contains: s, mode: 'insensitive' } }, { phone: { contains: normPhone(s) } }, { fullName: { contains: s, mode: 'insensitive' } }] },
      select: { id: true, code: true, fullName: true, birthYear: true, gender: true, phone: true, address: true },
      orderBy: { createdAt: 'desc' }, take: 30,
    });
  }

  @Roles('RECEPTION', 'DOCTOR', 'THERAPIST', 'MANAGER')
  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const p = await this.prisma.patient.findUnique({ where: { id }, include: { encounters: { orderBy: { visitDate: 'desc' }, take: 20 }, consents: true } });
    if (!p) throw new NotFoundException();
    await this.audit.log({ userId: u.id, username: u.username, action: 'VIEW', entity: 'Patient', entityId: id, ip });
    return p;
  }

  @Roles('RECEPTION', 'MANAGER')
  @Post()
  async create(@Body() b: PatientDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    if (!b.consent) throw new BadRequestException('Cần ghi nhận sự đồng ý của bệnh nhân về xử lý dữ liệu cá nhân');
    const phone = normPhone(b.phone);
    if (!b.force) {
      const dup = await this.prisma.patient.findMany({ where: { phone, birthYear: b.birthYear }, select: { id: true, code: true, fullName: true, birthYear: true, phone: true } });
      if (dup.length) throw new ConflictException({ message: 'Có thể đã tồn tại hồ sơ trùng SĐT và năm sinh', code: 'POSSIBLE_DUPLICATE', duplicates: dup });
    }
    const { consent, consentMethod, force, ...data } = b;
    const p = await this.prisma.$transaction(async (tx) => {
      const code = await this.clinic.newPatientCode(tx);
      return tx.patient.create({ data: { ...data, phone, code, createdById: u.id, consents: { create: { version: CONSENT_VERSION, purpose: 'Xử lý dữ liệu cá nhân và dữ liệu sức khỏe phục vụ khám chữa bệnh', method: consentMethod ?? 'PAPER', recordedById: u.id } } } });
    });
    await this.audit.log({ userId: u.id, username: u.username, action: 'CREATE', entity: 'Patient', entityId: p.id, ip });
    return p;
  }

  @Roles('RECEPTION', 'MANAGER')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() b: Partial<PatientDto>, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const { fullName, birthYear, gender, phone, address, occupation, note } = b;
    const p = await this.prisma.patient.update({ where: { id }, data: { fullName, birthYear, gender, phone: phone ? normPhone(phone) : undefined, address, occupation, note } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'UPDATE', entity: 'Patient', entityId: id, ip });
    return p;
  }
}

// ───────── Tiếp đón & hàng đợi ─────────
@Controller('encounters')
export class EncountersController {
  constructor(private prisma: PrismaService, private audit: AuditService, private clinic: ClinicService) {}

  @Roles('RECEPTION', 'MANAGER')
  @Post('check-in')
  async checkIn(@Body() b: CheckInDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const e = await this.clinic.checkIn(b.patientId, u.id, b);
    await this.audit.log({ userId: u.id, username: u.username, action: 'CHECK_IN', entity: 'Encounter', entityId: e.id, ip });
    return e;
  }

  // Hàng đợi trong ngày. Bác sĩ chỉ thấy khách của mình (+ chưa phân công) nếu ?mine=1
  @Roles('RECEPTION', 'DOCTOR', 'THERAPIST', 'MANAGER')
  @Get('queue')
  queue(@Query('day') day = vnDay(), @Query('mine') mine?: string, @CurrentUser() u?: AuthUser) {
    const m = mine === '1' && u ? (u.role === 'DOCTOR' ? { OR: [{ doctorId: u.id }, { doctorId: null }] } : u.role === 'THERAPIST' ? { therapistId: u.id } : {}) : {};
    return this.prisma.encounter.findMany({
      where: { visitDate: dayRange(day), status: { not: 'CANCELLED' }, ...m },
      include: { patient: { select: { code: true, fullName: true, birthYear: true, gender: true, phone: true } } },
      orderBy: { queueNo: 'asc' },
    });
  }

  @Roles('RECEPTION', 'DOCTOR', 'THERAPIST', 'MANAGER')
  @Patch(':id/status')
  async status(@Param('id') id: string, @Body() b: EncStatusDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const e = await this.prisma.encounter.update({ where: { id }, data: { status: b.status } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'STATUS', entity: 'Encounter', entityId: id, ip, meta: { status: b.status } });
    return e;
  }
}
