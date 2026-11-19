import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { AuthUser, Roles } from '../common/auth.guard';
import { ClientIp, CurrentUser } from '../common/current-user';
import { hashPassword, passwordProblem } from '../common/password';

class CreateUserDto {
  @Matches(/^[a-z0-9._-]{3,32}$/) username: string;
  @IsString() @MinLength(2) fullName: string;
  @IsEnum(Role) role: Role;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() title?: string;
  @IsString() password: string; // mật khẩu tạm; người dùng phải đổi khi đăng nhập lần đầu
}
class UpdateUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsBoolean() active?: boolean;
}
class ResetDto { @IsString() password: string }

const SAFE = { id: true, username: true, fullName: true, role: true, phone: true, email: true, title: true, active: true, totpEnabled: true, mustChangePassword: true, createdAt: true } as const;

@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // Danh sách nhân viên (để chọn bác sĩ/trị liệu viên/sale khi đặt lịch) — mọi vai trò xem được, chỉ thông tin tối thiểu
  @Get('staff')
  staff() {
    return this.prisma.user.findMany({ where: { active: true }, select: { id: true, fullName: true, role: true, title: true }, orderBy: { fullName: 'asc' } });
  }

  @Roles('MANAGER')
  @Get()
  list() {
    return this.prisma.user.findMany({ select: SAFE, orderBy: [{ role: 'asc' }, { fullName: 'asc' }] });
  }

  @Roles('MANAGER')
  @Post()
  async create(@Body() b: CreateUserDto, @CurrentUser() me: AuthUser, @ClientIp() ip: string) {
    const problem = passwordProblem(b.password);
    if (problem) throw new BadRequestException(problem);
    const exists = await this.prisma.user.findUnique({ where: { username: b.username } });
    if (exists) throw new BadRequestException('Tên đăng nhập đã tồn tại');
    const { password, ...rest } = b;
    const u = await this.prisma.user.create({ data: { ...rest, passwordHash: await hashPassword(password) }, select: SAFE });
    await this.audit.log({ userId: me.id, username: me.username, action: 'CREATE', entity: 'User', entityId: u.id, ip, meta: { role: u.role } });
    return u;
  }

  @Roles('MANAGER')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() b: UpdateUserDto, @CurrentUser() me: AuthUser, @ClientIp() ip: string) {
    if (id === me.id && (b.active === false || (b.role && b.role !== me.role))) throw new BadRequestException('Không thể tự khóa hoặc đổi vai trò của chính mình');
    const u = await this.prisma.user.update({ where: { id }, data: b, select: SAFE }).catch(() => { throw new NotFoundException(); });
    if (b.active === false || b.role) await this.prisma.authSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({ userId: me.id, username: me.username, action: 'UPDATE', entity: 'User', entityId: id, ip, meta: b });
    return u;
  }

  @Roles('MANAGER')
  @Post(':id/reset-password')
  async reset(@Param('id') id: string, @Body() b: ResetDto, @CurrentUser() me: AuthUser, @ClientIp() ip: string) {
    const problem = passwordProblem(b.password);
    if (problem) throw new BadRequestException(problem);
    await this.prisma.user.update({ where: { id }, data: { passwordHash: await hashPassword(b.password), mustChangePassword: true, failedLogins: 0, lockedUntil: null } });
    await this.prisma.authSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({ userId: me.id, username: me.username, action: 'RESET_PASSWORD', entity: 'User', entityId: id, ip });
    return { ok: true };
  }

  // Đặt lại 2FA khi nhân viên mất điện thoại
  @Roles('MANAGER')
  @Post(':id/reset-2fa')
  async reset2fa(@Param('id') id: string, @CurrentUser() me: AuthUser, @ClientIp() ip: string) {
    await this.prisma.user.update({ where: { id }, data: { totpEnabled: false, totpSecretEnc: null } });
    await this.prisma.authSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({ userId: me.id, username: me.username, action: 'RESET_2FA', entity: 'User', entityId: id, ip });
    return { ok: true };
  }

  @Roles('MANAGER')
  @Get('audit/recent')
  audits() {
    return this.prisma.auditLog.findMany({ orderBy: { id: 'desc' }, take: 200 }).then((rows) => rows.map((r) => ({ ...r, id: r.id.toString() })));
  }
}
