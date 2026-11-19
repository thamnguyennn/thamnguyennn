import { BadRequestException, Body, ConflictException, Controller, Get, Module, NotFoundException, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { AuthUser, Roles } from '../common/auth.guard';
import { ClientIp, CurrentUser } from '../common/current-user';

class ProductDto { @IsString() @MinLength(1) code: string; @IsString() @MinLength(2) name: string; @IsString() unit: string; @IsInt() @Min(0) price: number; @IsOptional() @IsInt() @Min(0) costPrice?: number; @IsOptional() @IsInt() @Min(0) minStock?: number; @IsOptional() @IsString() note?: string }
class ProductPatchDto { @IsOptional() @IsString() name?: string; @IsOptional() @IsString() unit?: string; @IsOptional() @IsInt() @Min(0) price?: number; @IsOptional() @IsInt() @Min(0) minStock?: number; @IsOptional() @IsBoolean() active?: boolean; @IsOptional() @IsString() note?: string }
class StockInDto { @IsInt() @Min(1) qty: number; @IsOptional() @IsInt() @Min(0) unitCost?: number; @IsOptional() @IsString() lot?: string; @IsOptional() @IsDateString() expiryDate?: string; @IsOptional() @IsString() note?: string }
class AdjustDto { @IsInt() delta: number; @IsString() @MinLength(5) reason: string }
class RxLineDto { @IsOptional() @IsString() productId?: string; @IsString() @MinLength(1) name: string; @IsInt() @Min(1) qty: number; @IsOptional() @IsString() dosage?: string }
class RxDto { @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => RxLineDto) lines: RxLineDto[]; @IsOptional() @IsString() note?: string }
class TemplateDto { @IsString() @MinLength(2) name: string; @IsInt() @Min(1) sessions: number; @IsInt() @Min(0) price: number; @IsOptional() @IsInt() @Min(1) validDays?: number; @IsOptional() @IsString() description?: string; @IsOptional() @IsBoolean() active?: boolean }

export const stockOf = async (prisma: PrismaService, ids?: string[]) => {
  const rows = await prisma.stockMovement.groupBy({ by: ['productId'], where: ids ? { productId: { in: ids } } : {}, _sum: { qty: true } });
  return Object.fromEntries(rows.map((r) => [r.productId, r._sum.qty ?? 0]));
};

@Controller('products')
export class ProductsController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Roles('DOCTOR', 'RECEPTION', 'MANAGER')
  @Get()
  async list(@Query('all') all?: string) {
    const ps = await this.prisma.product.findMany({ where: all === '1' ? {} : { active: true }, orderBy: { name: 'asc' } });
    const stock = await stockOf(this.prisma);
    const soon = new Date(Date.now() + 90 * 86400000);
    const exp = await this.prisma.stockMovement.findMany({ where: { type: 'IN', expiryDate: { lte: soon } }, select: { productId: true, expiryDate: true, qty: true } });
    const nearest: Record<string, Date> = {};
    for (const e of exp) if (e.expiryDate && (!nearest[e.productId] || e.expiryDate < nearest[e.productId])) nearest[e.productId] = e.expiryDate;
    return ps.map((p) => ({ ...p, stock: stock[p.id] ?? 0, low: (stock[p.id] ?? 0) <= p.minStock, expiresSoon: nearest[p.id] ?? null }));
  }

  @Roles('MANAGER')
  @Post()
  async create(@Body() b: ProductDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    if (await this.prisma.product.findUnique({ where: { code: b.code } })) throw new ConflictException('Mã thuốc đã tồn tại');
    const p = await this.prisma.product.create({ data: b });
    await this.audit.log({ userId: u.id, username: u.username, action: 'CREATE', entity: 'Product', entityId: p.id, ip });
    return p;
  }

  @Roles('MANAGER')
  @Patch(':id')
  async patch(@Param('id') id: string, @Body() b: ProductPatchDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const p = await this.prisma.product.update({ where: { id }, data: b }).catch(() => { throw new NotFoundException(); });
    await this.audit.log({ userId: u.id, username: u.username, action: 'UPDATE', entity: 'Product', entityId: id, ip, meta: b });
    return p;
  }

  @Roles('MANAGER')
  @Post(':id/stock-in')
  async stockIn(@Param('id') id: string, @Body() b: StockInDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const m = await this.prisma.$transaction(async (tx) => {
      const mv = await tx.stockMovement.create({ data: { productId: id, qty: b.qty, type: 'IN', unitCost: b.unitCost, lot: b.lot, expiryDate: b.expiryDate ? new Date(b.expiryDate) : undefined, note: b.note, byId: u.id } });
      if (b.unitCost !== undefined) await tx.product.update({ where: { id }, data: { costPrice: b.unitCost } });
      return mv;
    }).catch(() => { throw new NotFoundException('Không tìm thấy thuốc'); });
    await this.audit.log({ userId: u.id, username: u.username, action: 'STOCK_IN', entity: 'Product', entityId: id, ip, meta: { qty: b.qty, lot: b.lot } });
    return m;
  }

  // Kiểm kê / điều chỉnh: bắt buộc có lý do, không cho tồn âm
  @Roles('MANAGER')
  @Post(':id/adjust')
  async adjust(@Param('id') id: string, @Body() b: AdjustDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    if (!b.delta) throw new BadRequestException('Số điều chỉnh phải khác 0');
    const cur = (await stockOf(this.prisma, [id]))[id] ?? 0;
    if (cur + b.delta < 0) throw new BadRequestException(`Tồn hiện tại ${cur}, không thể giảm ${-b.delta}`);
    const m = await this.prisma.stockMovement.create({ data: { productId: id, qty: b.delta, type: 'ADJUST', note: b.reason, byId: u.id } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'STOCK_ADJUST', entity: 'Product', entityId: id, ip, meta: b });
    return m;
  }

  @Roles('MANAGER')
  @Get(':id/movements')
  movements(@Param('id') id: string) { return this.prisma.stockMovement.findMany({ where: { productId: id }, orderBy: { at: 'desc' }, take: 100 }); }
}

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Roles('DOCTOR', 'RECEPTION', 'MANAGER')
  @Get('by-encounter/:encId')
  async get(@Param('encId') encId: string) {
    const rx = await this.prisma.prescription.findUnique({ where: { encounterId: encId }, include: { lines: { orderBy: { sort: 'asc' }, include: { product: { select: { unit: true, price: true } } } } } });
    const dispensed = !!(await this.prisma.invoice.findFirst({ where: { encounterId: encId, status: { not: 'VOID' }, lines: { some: { kind: 'PRODUCT' } } } }));
    const enc = await this.prisma.encounter.findUnique({ where: { id: encId }, include: { patient: { select: { code: true, fullName: true, birthYear: true, gender: true } }, exam: { include: { amendments: { orderBy: { version: 'desc' }, take: 1 } } } } });
    const ed: any = enc?.exam?.amendments[0]?.data ?? enc?.exam?.data ?? {};
    const doctor = rx ? await this.prisma.user.findUnique({ where: { id: rx.doctorId }, select: { fullName: true } }) : null;
    // Thông tin tối thiểu để in đầu đơn thuốc (lễ tân in đơn khi bán thuốc)
    return { rx, dispensed, header: enc && { patient: enc.patient, visitDate: enc.visitDate, doctorName: doctor?.fullName ?? null, diagnosis: [ed.diagnosis?.modernMain, ed.diagnosis?.tcmName].filter(Boolean).join(' / ') } };
  }

  // Kê/sửa đơn: ghi đè danh sách dòng; khóa khi đã bán thuốc theo đơn
  @Roles('DOCTOR')
  @Put('by-encounter/:encId')
  async save(@Param('encId') encId: string, @Body() b: RxDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const enc = await this.prisma.encounter.findUnique({ where: { id: encId } });
    if (!enc) throw new NotFoundException('Không tìm thấy lượt khám');
    if (await this.prisma.invoice.findFirst({ where: { encounterId: encId, status: { not: 'VOID' }, lines: { some: { kind: 'PRODUCT' } } } })) throw new ConflictException('Thuốc đã được bán theo đơn này, không sửa được');
    const ids = b.lines.map((l) => l.productId).filter(Boolean) as string[];
    if (ids.length && (await this.prisma.product.count({ where: { id: { in: ids }, active: true } })) !== new Set(ids).size) throw new BadRequestException('Có thuốc không còn trong danh mục');
    const rx = await this.prisma.$transaction(async (tx) => {
      const base = await tx.prescription.upsert({ where: { encounterId: encId }, create: { encounterId: encId, patientId: enc.patientId, doctorId: u.id, note: b.note }, update: { doctorId: u.id, note: b.note } });
      await tx.prescriptionLine.deleteMany({ where: { prescriptionId: base.id } });
      await tx.prescriptionLine.createMany({ data: b.lines.map((l, i) => ({ prescriptionId: base.id, productId: l.productId, name: l.name, qty: l.qty, dosage: l.dosage, sort: i })) });
      return base;
    });
    await this.audit.log({ userId: u.id, username: u.username, action: 'UPDATE', entity: 'Prescription', entityId: rx.id, ip });
    return this.get(encId);
  }
}

@Controller('packages')
export class PackagesController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Get('templates')
  @Roles('RECEPTION', 'MANAGER', 'DOCTOR')
  templates(@Query('all') all?: string) { return this.prisma.packageTemplate.findMany({ where: all === '1' ? {} : { active: true }, orderBy: [{ sessions: 'asc' }, { price: 'asc' }] }); }

  @Post('templates')
  @Roles('MANAGER')
  async create(@Body() b: TemplateDto, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const t = await this.prisma.packageTemplate.create({ data: { ...b, validDays: b.validDays ?? 180 } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'CREATE', entity: 'PackageTemplate', entityId: t.id, ip });
    return t;
  }

  @Patch('templates/:id')
  @Roles('MANAGER')
  async patch(@Param('id') id: string, @Body() b: Partial<TemplateDto>, @CurrentUser() u: AuthUser, @ClientIp() ip: string) {
    const t = await this.prisma.packageTemplate.update({ where: { id }, data: { ...b, sample: false } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'UPDATE', entity: 'PackageTemplate', entityId: id, ip, meta: b });
    return t;
  }

  // Gói của một bệnh nhân (số buổi còn lại) – tự chuyển hết hạn
  @Get('patient/:patientId')
  @Roles('RECEPTION', 'DOCTOR', 'THERAPIST', 'MANAGER')
  async ofPatient(@Param('patientId') patientId: string) {
    await this.prisma.patientPackage.updateMany({ where: { patientId, status: 'ACTIVE', expiresAt: { lt: new Date() } }, data: { status: 'EXPIRED' } });
    const rows = await this.prisma.patientPackage.findMany({ where: { patientId }, orderBy: { purchasedAt: 'desc' } });
    return rows.map((r) => ({ ...r, remaining: r.totalSessions - r.usedSessions }));
  }
}

@Module({ controllers: [ProductsController, PrescriptionsController, PackagesController] })
export class PharmacyModule {}
