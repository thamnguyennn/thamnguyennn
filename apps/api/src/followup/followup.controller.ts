import { BadRequestException, Body, Controller, Get, Module, Param, Put, Post, Query } from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { AuthUser, Roles } from '../common/auth.guard';
import { ClientIp, CurrentUser } from '../common/current-user';
import { dayRange, vnDay } from '../clinic/util';

const CLINIC = process.env.CLINIC_NAME ?? 'Phòng khám Y học cổ truyền Khởi Phúc Việt Movia';
const DAY = 86400000;
export const KINDS = ['APPT_TOMORROW', 'NO_SHOW', 'NEXT_SESSION', 'LOST', 'AFTERCARE', 'LEAD'] as const;
type Kind = (typeof KINDS)[number];

// "3 buổi/tuần" → cách nhau ~2 ngày; "mỗi ngày" → 1; mặc định 3 ngày
export function intervalDays(freq?: string | null): number {
  const f = (freq ?? '').toLowerCase();
  const m = f.match(/(\d+)\s*(?:buổi|lần)\s*\/\s*tuần/);
  if (m) return Math.min(14, Math.max(1, Math.round(7 / Number(m[1]))));
  if (/hàng ngày|mỗi ngày|hằng ngày|1 buổi\/ngày/.test(f)) return 1;
  const w = f.match(/(\d+)\s*(?:tuần)\s*\/\s*(?:1|một)\s*(?:buổi|lần)/);
  if (w) return Number(w[1]) * 7;
  return 3;
}

export function render(tpl: string, v: Record<string, string | number | undefined>) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (v[k] === undefined || v[k] === '' ? '…' : String(v[k]))).replace(/\s+/g, ' ').trim();
}

const SNOOZE: Record<string, number> = { SENT: 2, REACHED: 3, NO_ANSWER: 1, BOOKED: 7, DECLINED: 30 };
const FOREVER: Kind[] = ['AFTERCARE', 'APPT_TOMORROW', 'NO_SHOW', 'LEAD'];

class LogDto {
  @IsIn(KINDS as unknown as string[]) kind: Kind;
  @IsString() key: string;
  @IsOptional() @IsString() patientId?: string;
  @IsIn(['ZALO', 'CALL', 'SMS', 'OTHER']) channel: string;
  @IsIn(['SENT', 'REACHED', 'NO_ANSWER', 'BOOKED', 'DECLINED']) outcome: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsInt() @Min(0) @Max(365) snoozeDays?: number;
}
class TplDto { @IsString() @MinLength(5) body: string }

@Controller('followups')
export class FollowUpController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private tpl = async () => Object.fromEntries((await this.prisma.messageTemplate.findMany()).map((t) => [t.key, t.body]));
  private fmtDay = (d: Date) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit' }).format(d);
  private fmtHour = (d: Date) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(d);

  // Danh sách việc cần liên hệ. Sale chỉ thấy khách mới (lead); các loại khác cần vai trò lễ tân/quản lý.
  @Roles('SALE', 'RECEPTION', 'MANAGER')
  @Get()
  async list(@CurrentUser() u: AuthUser) {
    const now = new Date(); const today = vnDay(now); const tomorrow = vnDay(new Date(now.getTime() + DAY));
    const T = await this.tpl(); const items: any[] = [];
    const want = (k: Kind) => u.role !== 'SALE' || k === 'LEAD';

    const logs = await this.prisma.followUpLog.findMany({ where: { snoozeUntil: { gt: now } }, select: { kind: true, key: true } });
    const hidden = new Set(logs.map((l) => `${l.kind}:${l.key}`));
    const push = (it: any) => { if (!hidden.has(`${it.kind}:${it.key}`)) items.push(it); };

    if (want('APPT_TOMORROW')) {
      const rows = await this.prisma.appointment.findMany({ where: { startAt: dayRange(tomorrow), status: { in: ['BOOKED', 'CONFIRMED'] } }, orderBy: { startAt: 'asc' } });
      for (const a of rows) push({ kind: 'APPT_TOMORROW', key: a.id, patientId: a.patientId, name: a.fullName, phone: a.phone, dueAt: a.startAt, info: `Hẹn ${this.fmtHour(a.startAt)} ngày ${this.fmtDay(a.startAt)}`, message: render(T.appt_tomorrow ?? '', { ten: a.fullName, phongkham: CLINIC, gio: this.fmtHour(a.startAt), ngay: this.fmtDay(a.startAt) }) });
    }
    if (want('NO_SHOW')) {
      const rows = await this.prisma.appointment.findMany({ where: { startAt: { gte: new Date(now.getTime() - 2 * DAY), lt: new Date(now.getTime() - 60 * 60000) }, status: { in: ['BOOKED', 'CONFIRMED'] } }, orderBy: { startAt: 'desc' } });
      for (const a of rows) push({ kind: 'NO_SHOW', key: a.id, patientId: a.patientId, name: a.fullName, phone: a.phone, dueAt: a.startAt, info: `Chưa đến – hẹn ${this.fmtHour(a.startAt)} ngày ${this.fmtDay(a.startAt)}`, message: render(T.no_show ?? '', { ten: a.fullName, gio: this.fmtHour(a.startAt), ngay: this.fmtDay(a.startAt) }) });
    }
    if (want('NEXT_SESSION') || want('LOST')) {
      const plans = await this.prisma.treatmentPlan.findMany({ where: { status: 'ACTIVE' }, include: { patient: { select: { id: true, fullName: true, phone: true } }, sessions: { select: { date: true }, orderBy: { date: 'desc' }, take: 1 }, _count: { select: { sessions: true } } } });
      const future = await this.prisma.appointment.findMany({ where: { startAt: { gte: now }, status: { in: ['BOOKED', 'CONFIRMED'] }, patientId: { in: plans.map((p) => p.patientId) } }, select: { patientId: true, startAt: true } });
      const hasFuture = new Set(future.map((f) => f.patientId));
      const openToday = await this.prisma.encounter.findMany({ where: { visitDate: dayRange(today), status: { notIn: ['DONE', 'CANCELLED'] } }, select: { patientId: true } });
      const inClinic = new Set(openToday.map((e) => e.patientId));
      for (const p of plans) {
        const used = p._count.sessions; if (used >= p.totalSessions || hasFuture.has(p.patientId) || inClinic.has(p.patientId)) continue;
        const last = p.sessions[0]?.date ?? p.createdAt; const gap = Math.floor((now.getTime() - last.getTime()) / DAY); const iv = intervalDays(p.frequency);
        const due = new Date(last.getTime() + iv * DAY); const overdue = gap - iv;
        const vars = { ten: p.patient.fullName, da_dung: used, tong: p.totalSessions, con_lai: p.totalSessions - used, so_ngay: gap, phongkham: CLINIC };
        const ctx = { patientId: p.patientId, name: p.patient.fullName, phone: p.patient.phone, dueAt: due, planId: p.id, used, total: p.totalSessions };
        if (gap >= 14 && want('LOST')) push({ ...ctx, kind: 'LOST', key: p.id, info: `${gap} ngày chưa quay lại · đã ${used}/${p.totalSessions} buổi`, message: render(T.lost ?? '', vars) });
        else if (gap < 14 && overdue >= -1 && want('NEXT_SESSION')) push({ ...ctx, kind: 'NEXT_SESSION', key: p.id, info: `Đã ${used}/${p.totalSessions} buổi · buổi gần nhất ${this.fmtDay(last)} · ${overdue > 0 ? `trễ ${overdue} ngày` : 'đến hạn'} (${p.frequency ?? 'tần suất mặc định 3 ngày'})`, message: render(T.next_session ?? '', vars) });
      }
    }
    if (want('AFTERCARE')) {
      const ss = await this.prisma.treatmentSession.findMany({ where: { createdAt: { gte: new Date(now.getTime() - DAY) } }, include: { lines: true, plan: { select: { totalSessions: true, patient: { select: { id: true, fullName: true, phone: true } } } } }, orderBy: { createdAt: 'desc' } });
      for (const s of ss) {
        const notes = [...new Set(s.lines.map((l) => l.serviceCode))].map((c) => T[`aftercare_${c}`]).filter(Boolean).join('');
        push({ kind: 'AFTERCARE', key: s.id, patientId: s.plan.patient.id, name: s.plan.patient.fullName, phone: s.plan.patient.phone, dueAt: s.createdAt, info: `Buổi ${s.sessionNo}/${s.plan.totalSessions} hôm nay`, message: render(T.aftercare_general ?? '', { ten: s.plan.patient.fullName, da_dung: s.sessionNo, tong: s.plan.totalSessions, luu_y_dich_vu: notes }), planId: s.planId });
      }
    }
    if (want('LEAD')) {
      const leads = await this.prisma.lead.findMany({ where: { status: { in: ['NEW', 'CONTACTED'] }, createdAt: { lt: new Date(now.getTime() - DAY) }, ...(u.role === 'SALE' ? { saleId: u.id } : {}) }, include: { source: true }, orderBy: { createdAt: 'asc' }, take: 100 });
      const booked = new Set((await this.prisma.appointment.findMany({ where: { leadId: { in: leads.map((l) => l.id) }, status: { not: 'CANCELLED' } }, select: { leadId: true } })).map((a) => a.leadId));
      for (const l of leads) if (!booked.has(l.id)) push({ kind: 'LEAD', key: l.id, patientId: null, name: l.fullName, phone: l.phone, dueAt: l.createdAt, info: `Khách từ ${l.source?.name ?? 'không rõ nguồn'} · chưa có lịch hẹn`, message: render(T.lead ?? '', { ten: l.fullName, phongkham: CLINIC }) });
    }
    const order: Record<string, number> = { APPT_TOMORROW: 0, NO_SHOW: 1, AFTERCARE: 2, NEXT_SESSION: 3, LOST: 4, LEAD: 5 };
    return items.sort((a, b) => order[a.kind] - order[b.kind] || +new Date(a.dueAt) - +new Date(b.dueAt));
  }

  @Roles('SALE', 'RECEPTION', 'MANAGER')
  @Post('log')
  async log(@Body() b: LogDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    if (u.role === 'SALE' && b.kind !== 'LEAD') throw new BadRequestException('Không có quyền với loại nhắc này');
    const days = FOREVER.includes(b.kind) ? 365 : b.snoozeDays ?? SNOOZE[b.outcome] ?? 1;
    const row = await this.prisma.followUpLog.create({ data: { kind: b.kind, key: b.key, patientId: b.patientId, channel: b.channel, outcome: b.outcome, note: b.note, snoozeUntil: new Date(Date.now() + days * DAY), byId: u.id } });
    if (b.kind === 'LEAD') await this.prisma.lead.updateMany({ where: { id: b.key, status: 'NEW' }, data: { status: 'CONTACTED' } });
    if (b.outcome === 'DECLINED' && b.kind === 'LEAD') await this.prisma.lead.updateMany({ where: { id: b.key }, data: { status: 'LOST' } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'FOLLOWUP', entity: b.kind, entityId: b.key, ip, meta: { channel: b.channel, outcome: b.outcome } });
    return row;
  }

  @Roles('RECEPTION', 'MANAGER', 'SALE', 'DOCTOR')
  @Get('templates')
  templates() { return this.prisma.messageTemplate.findMany({ orderBy: { key: 'asc' } }); }

  @Roles('MANAGER')
  @Put('templates/:key')
  async saveTemplate(@Param('key') key: string, @Body() b: TplDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const t = await this.prisma.messageTemplate.update({ where: { key }, data: { body: b.body, updatedById: u.id } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'UPDATE', entity: 'MessageTemplate', entityId: key, ip });
    return t;
  }
}

@Module({ controllers: [FollowUpController] })
export class FollowUpModule {}
