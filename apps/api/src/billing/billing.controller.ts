import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Module, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { AuthUser, Roles } from '../common/auth.guard';
import { ClientIp, CurrentUser } from '../common/current-user';
import { dayRange, vnDay } from '../clinic/util';
import { stockOf } from '../pharmacy/pharmacy.controller';

class LineDto {
  @IsIn(['SERVICE', 'PRODUCT', 'PACKAGE_SALE', 'PACKAGE_USE']) kind: 'SERVICE' | 'PRODUCT' | 'PACKAGE_SALE' | 'PACKAGE_USE';
  @IsOptional() @IsString() serviceCode?: string;
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() @IsString() patientPackageId?: string;
  @IsOptional() @IsInt() @Min(1) qty?: number;
}
class PayDto { @IsIn(['CASH', 'TRANSFER', 'CARD']) method: 'CASH' | 'TRANSFER' | 'CARD'; @IsInt() @Min(1) amount: number; @IsOptional() @IsString() ref?: string }
class InvoiceDto {
  @IsOptional() @IsString() encounterId?: string;
  @IsOptional() @IsString() patientId?: string;
  @IsOptional() @IsString() customerName?: string;
  @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => LineDto) lines: LineDto[];
  @IsOptional() @IsInt() @Min(0) discount?: number;
  @IsOptional() @IsString() discountReason?: string;
  @IsOptional() @IsString() note?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PayDto) payments: PayDto[];
}
class VoidDto { @IsString() @MinLength(5) reason: string }

const statusOf = (total: number, paid: number) => (paid >= total ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID');
const inv = { lines: { orderBy: { sort: 'asc' as const } }, payments: { orderBy: { at: 'asc' as const } }, patient: { select: { id: true, code: true, fullName: true, phone: true } } };

@Controller('invoices')
export class BillingController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // Gợi ý phiếu thu cho một lượt khám: dịch vụ đã làm hôm nay, thuốc theo đơn, gói còn buổi
  @Roles('RECEPTION', 'MANAGER')
  @Get('checkout/:encId')
  async checkout(@Param('encId') encId: string) {
    const enc = await this.prisma.encounter.findUnique({ where: { id: encId }, include: { patient: { select: { id: true, code: true, fullName: true, phone: true } } } });
    if (!enc) throw new NotFoundException('Không tìm thấy lượt khám');
    const existing = await this.prisma.invoice.findFirst({ where: { encounterId: encId, status: { not: 'VOID' } }, select: { id: true, code: true, status: true } });
    const sessions = await this.prisma.treatmentSession.findMany({ where: { encounterId: encId }, include: { lines: true } });
    const codes = [...new Set(sessions.flatMap((s) => s.lines.map((l) => l.serviceCode)))];
    const services = await this.prisma.service.findMany({ where: { code: { in: codes } } });
    const rx = await this.prisma.prescription.findUnique({ where: { encounterId: encId }, include: { lines: { include: { product: true }, orderBy: { sort: 'asc' } } } });
    const stock = await stockOf(this.prisma, (rx?.lines ?? []).map((l) => l.productId).filter(Boolean) as string[]);
    await this.prisma.patientPackage.updateMany({ where: { patientId: enc.patientId, status: 'ACTIVE', expiresAt: { lt: new Date() } }, data: { status: 'EXPIRED' } });
    const packages = await this.prisma.patientPackage.findMany({ where: { patientId: enc.patientId, status: 'ACTIVE' } });
    return {
      encounter: { id: enc.id, status: enc.status, visitNo: enc.visitNo }, patient: enc.patient, existingInvoice: existing,
      suggestedServices: services.map((s) => ({ code: s.code, name: s.name, price: s.price })),
      suggestedProducts: (rx?.lines ?? []).filter((l) => l.productId).map((l) => ({ productId: l.productId, name: l.name, qty: l.qty, price: l.product!.price, stock: stock[l.productId!] ?? 0 })),
      packages: packages.filter((p) => p.usedSessions < p.totalSessions).map((p) => ({ id: p.id, name: p.name, remaining: p.totalSessions - p.usedSessions, expiresAt: p.expiresAt })),
    };
  }

  @Roles('RECEPTION', 'MANAGER')
  @Post()
  async create(@Body() b: InvoiceDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    if (!b.lines.length) throw new BadRequestException('Phiếu thu chưa có mục nào');
    if (!b.encounterId && !b.patientId && !b.customerName?.trim()) throw new BadRequestException('Nhập tên khách hoặc chọn bệnh nhân');
    if (b.discount && u.role !== 'MANAGER') throw new ForbiddenException('Giảm giá cần quản lý thực hiện hoặc duyệt');
    if (b.discount && !(b.discountReason ?? '').trim()) throw new BadRequestException('Giảm giá cần ghi lý do');

    const enc = b.encounterId ? await this.prisma.encounter.findUnique({ where: { id: b.encounterId } }) : null;
    if (b.encounterId && !enc) throw new NotFoundException('Không tìm thấy lượt khám');
    const patientId = enc?.patientId ?? b.patientId ?? null;
    if (enc && (await this.prisma.invoice.findFirst({ where: { encounterId: enc.id, status: { not: 'VOID' } } }))) throw new ConflictException('Lượt khám này đã có phiếu thu');

    try {
      const out = await this.prisma.$transaction(async (tx) => {
        const lines: Prisma.InvoiceLineCreateManyInvoiceInput[] = [];
        const moves: { productId: string; qty: number }[] = [];
        const useIds: string[] = [];
        const newPkgs: { name: string; sessions: number; price: number; validDays: number }[] = [];
        for (const l of b.lines) {
          const qty = l.qty ?? 1;
          if (l.kind === 'SERVICE') {
            const s = await tx.service.findFirst({ where: { code: l.serviceCode, active: true } });
            if (!s) throw new BadRequestException(`Dịch vụ không hợp lệ: ${l.serviceCode}`);
            lines.push({ kind: 'SERVICE', name: s.name, serviceCode: s.code, qty, unitPrice: s.price, amount: s.price * qty });
          } else if (l.kind === 'PRODUCT') {
            await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${l.productId} FOR UPDATE`; // chặn bán trùng khi 2 quầy cùng bấm
            const p = await tx.product.findFirst({ where: { id: l.productId, active: true } });
            if (!p) throw new BadRequestException('Thuốc không hợp lệ');
            const have = (await tx.stockMovement.aggregate({ where: { productId: p.id }, _sum: { qty: true } }))._sum.qty ?? 0;
            const already = moves.filter((m) => m.productId === p.id).reduce((a, m) => a + m.qty, 0);
            if (have - already < qty) throw new ConflictException(`Không đủ tồn kho "${p.name}": còn ${have - already}, cần ${qty}`);
            moves.push({ productId: p.id, qty });
            lines.push({ kind: 'PRODUCT', name: `${p.name} (${p.unit})`, productId: p.id, qty, unitPrice: p.price, amount: p.price * qty });
          } else if (l.kind === 'PACKAGE_SALE') {
            if (!patientId) throw new BadRequestException('Bán gói cần chọn bệnh nhân có hồ sơ');
            const t = await tx.packageTemplate.findFirst({ where: { id: l.templateId, active: true } });
            if (!t) throw new BadRequestException('Gói không hợp lệ');
            for (let i = 0; i < qty; i++) newPkgs.push({ name: t.name, sessions: t.sessions, price: t.price, validDays: t.validDays });
            lines.push({ kind: 'PACKAGE_SALE', name: `Gói: ${t.name}`, qty, unitPrice: t.price, amount: t.price * qty });
          } else {
            if (!patientId) throw new BadRequestException('Trừ buổi gói cần có bệnh nhân');
            const pk = await tx.patientPackage.findFirst({ where: { id: l.patientPackageId, patientId } });
            if (!pk || pk.status !== 'ACTIVE' || pk.expiresAt < new Date() || pk.usedSessions >= pk.totalSessions) throw new ConflictException('Gói không còn hiệu lực hoặc đã hết buổi');
            if (useIds.includes(pk.id)) throw new BadRequestException('Mỗi lượt chỉ trừ 1 buổi từ một gói');
            useIds.push(pk.id);
            lines.push({ kind: 'PACKAGE_USE', name: `Trừ 1 buổi – ${pk.name}`, patientPackageId: pk.id, qty: 1, unitPrice: 0, amount: 0 });
          }
        }
        const subtotal = lines.reduce((a, l) => a + l.amount, 0);
        const discount = Math.min(b.discount ?? 0, subtotal);
        const total = subtotal - discount;
        const paid = b.payments.reduce((a, p) => a + p.amount, 0);
        if (paid > total) throw new BadRequestException(`Số tiền thu (${paid}) lớn hơn tổng phải thu (${total})`);

        const yy = vnDay().slice(2, 4);
        const c = await tx.counter.upsert({ where: { key: `invoice:${yy}` }, create: { key: `invoice:${yy}`, value: 1 }, update: { value: { increment: 1 } } });
        const invoice = await tx.invoice.create({
          data: {
            code: `PT-${yy}-${String(c.value).padStart(6, '0')}`, encounterId: enc?.id, patientId, customerName: patientId ? null : b.customerName?.trim(),
            subtotal, discount, discountReason: b.discountReason, total, paid, status: statusOf(total, paid), note: b.note, createdById: u.id,
            lines: { create: lines.map((l, i) => ({ ...l, sort: i })) },
            payments: { create: b.payments.map((p) => ({ method: p.method, amount: p.amount, ref: p.ref, byId: u.id })) },
          },
          include: inv,
        });
        for (const m of moves) await tx.stockMovement.create({ data: { productId: m.productId, qty: -m.qty, type: 'SALE', invoiceId: invoice.id, byId: u.id } });
        for (const id of useIds) {
          const pk = await tx.patientPackage.update({ where: { id }, data: { usedSessions: { increment: 1 } } });
          if (pk.usedSessions >= pk.totalSessions) await tx.patientPackage.update({ where: { id }, data: { status: 'EXHAUSTED' } });
        }
        for (const n of newPkgs) await tx.patientPackage.create({ data: { patientId: patientId!, name: n.name, totalSessions: n.sessions, pricePaid: n.price, expiresAt: new Date(Date.now() + n.validDays * 86400000), invoiceId: invoice.id } });
        if (enc) await tx.encounter.update({ where: { id: enc.id }, data: { status: 'DONE' } });
        return invoice;
      });
      await this.audit.log({ userId: u.id, username: u.username, action: 'CREATE', entity: 'Invoice', entityId: out.id, ip, meta: { code: out.code, total: out.total, discount: out.discount } });
      return out;
    } catch (e: any) {
      if (e.code === 'P2002') throw new ConflictException('Lượt khám này vừa được lập phiếu thu, hãy tải lại');
      throw e;
    }
  }

  @Roles('RECEPTION', 'MANAGER')
  @Get()
  list(@Query('day') day = vnDay()) { return this.prisma.invoice.findMany({ where: { createdAt: dayRange(day) }, include: inv, orderBy: { createdAt: 'desc' } }); }

  @Roles('RECEPTION', 'MANAGER')
  @Get(':id')
  async get(@Param('id') id: string) {
    const i = await this.prisma.invoice.findUnique({ where: { id }, include: inv });
    if (!i) throw new NotFoundException();
    return i;
  }

  // Thu thêm (khách trả nợ / thanh toán đợt sau)
  @Roles('RECEPTION', 'MANAGER')
  @Post(':id/payments')
  async pay(@Param('id') id: string, @Body() b: PayDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const out = await this.prisma.$transaction(async (tx) => {
      const i = await tx.invoice.findUnique({ where: { id } });
      if (!i) throw new NotFoundException();
      if (i.status === 'VOID') throw new ConflictException('Phiếu đã hủy');
      if (i.paid + b.amount > i.total) throw new BadRequestException(`Chỉ còn phải thu ${i.total - i.paid}`);
      await tx.payment.create({ data: { invoiceId: id, method: b.method, amount: b.amount, ref: b.ref, byId: u.id } });
      return tx.invoice.update({ where: { id }, data: { paid: i.paid + b.amount, status: statusOf(i.total, i.paid + b.amount) }, include: inv });
    });
    await this.audit.log({ userId: u.id, username: u.username, action: 'PAYMENT', entity: 'Invoice', entityId: id, ip, meta: { amount: b.amount, method: b.method } });
    return out;
  }

  // Hủy phiếu (không xóa): hoàn kho, hoàn buổi gói, hủy gói đã bán nếu chưa dùng
  @Roles('MANAGER')
  @Post(':id/void')
  async voidInvoice(@Param('id') id: string, @Body() b: VoidDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const out = await this.prisma.$transaction(async (tx) => {
      const i = await tx.invoice.findUnique({ where: { id }, include: { lines: true } });
      if (!i) throw new NotFoundException();
      if (i.status === 'VOID') throw new ConflictException('Phiếu đã hủy trước đó');
      for (const l of i.lines) {
        if (l.kind === 'PRODUCT' && l.productId) await tx.stockMovement.create({ data: { productId: l.productId, qty: l.qty, type: 'VOID', invoiceId: id, note: `Hủy ${i.code}`, byId: u.id } });
        if (l.kind === 'PACKAGE_USE' && l.patientPackageId) await tx.patientPackage.update({ where: { id: l.patientPackageId }, data: { usedSessions: { decrement: 1 }, status: 'ACTIVE' } });
      }
      const sold = await tx.patientPackage.findMany({ where: { invoiceId: id } });
      if (sold.some((p) => p.usedSessions > 0)) throw new ConflictException('Gói đã bán trong phiếu này đã được sử dụng, không thể hủy. Hãy xử lý riêng.');
      await tx.patientPackage.updateMany({ where: { invoiceId: id }, data: { status: 'CANCELLED' } });
      return tx.invoice.update({ where: { id }, data: { status: 'VOID', voidedAt: new Date(), voidedById: u.id, voidReason: b.reason }, include: inv });
    });
    await this.audit.log({ userId: u.id, username: u.username, action: 'VOID', entity: 'Invoice', entityId: id, ip, meta: { reason: b.reason } });
    return out;
  }
}

@Module({ controllers: [BillingController] })
export class BillingModule {}
