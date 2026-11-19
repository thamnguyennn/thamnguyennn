import { BadRequestException, Controller, Get, Module, Query } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Roles } from '../common/auth.guard';
import { vnDay } from '../clinic/util';

const DAY = 86400000;
const at0 = (d: string) => new Date(`${d}T00:00:00+07:00`);
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const group = <T,>(rows: T[], key: (r: T) => string) => { const m = new Map<string, T[]>(); for (const r of rows) { const k = key(r); (m.get(k) ?? m.set(k, []).get(k)!).push(r); } return m; };

@Controller('reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Roles('MANAGER')
  @Get('summary')
  async summary(@Query('from') from = vnDay(), @Query('to') to = from) {
    const valid = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(at0(d).getTime()) && vnDay(at0(d)) === d;
    if (!valid(from) || !valid(to) || to < from) throw new BadRequestException('Khoảng ngày không hợp lệ');
    const gte = at0(from), lt = new Date(at0(to).getTime() + DAY);
    if (lt.getTime() - gte.getTime() > 366 * DAY) throw new BadRequestException('Chỉ xem tối đa 366 ngày');
    const range = { gte, lt };

    const staff = Object.fromEntries((await this.prisma.user.findMany({ select: { id: true, fullName: true } })).map((u) => [u.id, u.fullName]));
    const nameOf = (id?: string | null) => (id && staff[id]) || 'Không rõ';

    // ── Lượt khám ──
    const enc = await this.prisma.encounter.findMany({ where: { visitDate: range, status: { not: 'CANCELLED' } }, select: { patientId: true, visitNo: true, visitDate: true } });
    const patients = new Set(enc.map((e) => e.patientId));
    const newPatients = new Set(enc.filter((e) => e.visitNo === 1).map((e) => e.patientId));
    const returning = new Set(enc.filter((e) => e.visitNo > 1).map((e) => e.patientId));

    // ── Nguồn khách của từng bệnh nhân (lead sớm nhất có nguồn) ──
    const leadsAll = await this.prisma.lead.findMany({ where: { patientId: { not: null } }, include: { source: true }, orderBy: { createdAt: 'asc' } });
    const srcOf = new Map<string, { source: string; saleId: string | null }>();
    for (const l of leadsAll) if (l.patientId && !srcOf.has(l.patientId)) srcOf.set(l.patientId, { source: l.source?.name ?? 'Không rõ', saleId: l.saleId });

    // ── Doanh thu ──
    const invoices = await this.prisma.invoice.findMany({ where: { createdAt: range, status: { not: 'VOID' } }, include: { lines: true } });
    const payments = await this.prisma.payment.findMany({ where: { at: range, invoice: { status: { not: 'VOID' } } } });
    const net = (i: (typeof invoices)[number]) => (i.subtotal > 0 ? 1 - i.discount / i.subtotal : 1);
    const byService = new Map<string, { name: string; kind: string; qty: number; revenue: number }>();
    for (const i of invoices) for (const l of i.lines) {
      const k = `${l.kind}:${l.serviceCode ?? l.productId ?? l.name}`; const cur = byService.get(k) ?? { name: l.name, kind: l.kind, qty: 0, revenue: 0 };
      cur.qty += l.qty; cur.revenue += Math.round(l.amount * net(i)); byService.set(k, cur);
    }
    const revenueNet = sum(invoices.map((i) => i.total));
    const bySource = new Map<string, { visits: number; patients: Set<string>; revenue: number }>();
    const touch = (name: string) => bySource.get(name) ?? bySource.set(name, { visits: 0, patients: new Set(), revenue: 0 }).get(name)!;
    for (const e of enc) { const s = touch(srcOf.get(e.patientId)?.source ?? 'Không rõ'); s.visits++; s.patients.add(e.patientId); }
    for (const i of invoices) touch((i.patientId && srcOf.get(i.patientId)?.source) || 'Không rõ').revenue += i.total;
    const byCashier = [...group(invoices, (i) => i.createdById)].map(([id, rows]) => ({ name: nameOf(id), invoices: rows.length, total: sum(rows.map((r) => r.total)) })).sort((a, b) => b.total - a.total);
    const bySale = new Map<string, { patients: Set<string>; revenue: number }>();
    for (const i of invoices) { const sid = i.patientId ? srcOf.get(i.patientId)?.saleId : null; if (!sid) continue; const s = bySale.get(sid) ?? bySale.set(sid, { patients: new Set(), revenue: 0 }).get(sid)!; s.revenue += i.total; if (i.patientId) s.patients.add(i.patientId); }

    // ── Theo ngày ──
    const days: Record<string, { day: string; visits: number; revenue: number }> = {};
    for (let t = gte.getTime(); t < lt.getTime(); t += DAY) { const d = vnDay(new Date(t)); days[d] = { day: d, visits: 0, revenue: 0 }; }
    for (const e of enc) { const d = days[vnDay(e.visitDate)]; if (d) d.visits++; }
    for (const p of payments) { const d = days[vnDay(p.at)]; if (d) d.revenue += p.amount; }

    // ── Trị liệu viên & bác sĩ ──
    const sessions = await this.prisma.treatmentSession.findMany({ where: { date: range }, include: { lines: true } });
    const byTherapist = [...group(sessions, (s) => s.performedById)].map(([id, rows]) => ({ name: nameOf(id), sessions: rows.length, minutes: sum(rows.flatMap((r) => r.lines.map((l) => l.minutes ?? 0))), patients: new Set(rows.map((r) => r.planId)).size, adverse: rows.filter((r) => r.adverse).length })).sort((a, b) => b.sessions - a.sessions);
    const exams = await this.prisma.examForm.findMany({ where: { signedAt: range }, select: { signedById: true } });
    const plansNew = await this.prisma.treatmentPlan.findMany({ where: { createdAt: range }, select: { doctorId: true } });
    const doctorIds = new Set([...exams.map((e) => e.signedById!), ...plansNew.map((p) => p.doctorId)]);
    const byDoctor = [...doctorIds].map((id) => ({ name: nameOf(id), exams: exams.filter((e) => e.signedById === id).length, plans: plansNew.filter((p) => p.doctorId === id).length })).sort((a, b) => b.exams - a.exams);

    // ── Liệu trình ──
    const plans = await this.prisma.treatmentPlan.findMany({ where: { createdAt: range }, include: { sessions: { select: { date: true }, orderBy: { date: 'desc' }, take: 1 }, _count: { select: { sessions: true } } } });
    const now = Date.now();
    const abandoned = plans.filter((p) => p.status === 'ACTIVE' && now - (p.sessions[0]?.date ?? p.createdAt).getTime() > 14 * DAY).length;
    const planStats = { created: plans.length, completed: plans.filter((p) => p.status === 'COMPLETED').length, cancelled: plans.filter((p) => p.status === 'CANCELLED').length, active: plans.filter((p) => p.status === 'ACTIVE').length, abandoned, avgCompletion: plans.length ? Math.round((sum(plans.map((p) => p._count.sessions / p.totalSessions)) / plans.length) * 100) : 0 };

    // ── Phễu khách theo nguồn ──
    const leads = await this.prisma.lead.findMany({ where: { createdAt: range }, include: { source: true, appointments: { select: { status: true } } } });
    const funnel = [...group(leads, (l) => l.source?.name ?? 'Không rõ')].map(([name, rows]) => ({ name, leads: rows.length, booked: rows.filter((l) => l.appointments.some((a) => a.status !== 'CANCELLED')).length, visited: rows.filter((l) => l.status === 'VISITED').length, lost: rows.filter((l) => l.status === 'LOST').length })).sort((a, b) => b.leads - a.leads);

    // ── Công nợ (toàn thời gian) ──
    const debts = await this.prisma.invoice.findMany({ where: { status: { in: ['PARTIAL', 'UNPAID'] } }, include: { patient: { select: { fullName: true, code: true, phone: true } } }, orderBy: { createdAt: 'asc' }, take: 100 });

    return {
      range: { from, to },
      kpi: {
        visits: enc.length, patients: patients.size, newPatients: newPatients.size, returningPatients: returning.size,
        returningShare: patients.size ? Math.round((returning.size / patients.size) * 100) : 0,
        revenueNet: revenueNet, collected: sum(payments.map((p) => p.amount)), invoices: invoices.length, discount: sum(invoices.map((i) => i.discount)),
        sessions: sessions.length, avgTicket: invoices.length ? Math.round(revenueNet / invoices.length) : 0,
        outstanding: sum(debts.map((d) => d.total - d.paid)),
      },
      byDay: Object.values(days),
      byService: [...byService.values()].sort((a, b) => b.revenue - a.revenue),
      byMethod: ['CASH', 'TRANSFER', 'CARD'].map((m) => ({ method: m, amount: sum(payments.filter((p) => p.method === m).map((p) => p.amount)) })),
      bySource: [...bySource].map(([name, v]) => ({ name, visits: v.visits, patients: v.patients.size, revenue: v.revenue })).sort((a, b) => b.revenue - a.revenue),
      bySale: [...bySale].map(([id, v]) => ({ name: nameOf(id), patients: v.patients.size, revenue: v.revenue })).sort((a, b) => b.revenue - a.revenue),
      byCashier, byTherapist, byDoctor, plans: planStats, funnel,
      debts: debts.map((d) => ({ id: d.id, code: d.code, name: d.patient?.fullName ?? d.customerName, phone: d.patient?.phone, total: d.total, paid: d.paid, at: d.createdAt })),
    };
  }
}

@Module({ controllers: [ReportsController] })
export class ReportsModule {}
