import { BadRequestException, Body, Controller, ForbiddenException, Get, HttpCode, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { IsString, MinLength } from 'class-validator';
import * as QRCode from 'qrcode';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { ABSOLUTE_MS, AllowMustChange, AuthUser, Public, SESSION_COOKIE } from '../common/auth.guard';
import { ClientIp, CurrentUser } from '../common/current-user';
import { decrypt, encrypt, newToken, sha256, signTicket, verifyTicket } from '../common/crypto';
import { checkPassword, hashPassword, passwordProblem } from '../common/password';

class LoginDto { @IsString() username: string; @IsString() password: string }
class CodeDto { @IsString() ticket: string; @IsString() code: string }
class TicketDto { @IsString() ticket: string }
class ChangePwDto { @IsString() oldPassword: string; @IsString() @MinLength(10) newPassword: string }

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const REQUIRE_2FA: Role[] = ['DOCTOR', 'MANAGER'];

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  async login(@Body() b: LoginDto, @ClientIp() ip: string, @Res({ passthrough: true }) res: Response) {
    const user = await this.prisma.user.findUnique({ where: { username: b.username.trim().toLowerCase() } });
    const fail = async (reason: string) => {
      await this.audit.log({ userId: user?.id, username: b.username, action: 'LOGIN_FAILED', ip, meta: { reason } });
      throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');
    };
    if (!user || !user.active) return fail('unknown_or_inactive');
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now())
      throw new ForbiddenException('Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau ít phút.');

    if (!(await checkPassword(user.passwordHash, b.password))) {
      const n = user.failedLogins + 1;
      await this.prisma.user.update({ where: { id: user.id }, data: { failedLogins: n >= MAX_FAILS ? 0 : n, lockedUntil: n >= MAX_FAILS ? new Date(Date.now() + LOCK_MS) : null } });
      return fail('bad_password');
    }
    const ticket = signTicket(user.id);
    if (user.totpEnabled) return { step: 'totp', ticket };
    if (REQUIRE_2FA.includes(user.role)) return { step: 'setup2fa', ticket };
    return this.finish(res, user.id, ip); // vai trò không bắt buộc 2FA
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('2fa/verify')
  @HttpCode(200)
  async verify(@Body() b: CodeDto, @ClientIp() ip: string, @Res({ passthrough: true }) res: Response) {
    const userId = verifyTicket(b.ticket);
    if (!userId) throw new UnauthorizedException('Phiên xác thực đã hết hạn, vui lòng đăng nhập lại');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.totpSecretEnc) throw new BadRequestException('Chưa thiết lập 2FA');
    const ok = verifySync({ secret: decrypt(user.totpSecretEnc), token: b.code.replace(/\s/g, '') }).valid;
    if (!ok) {
      await this.audit.log({ userId, username: user.username, action: 'LOGIN_FAILED', ip, meta: { reason: 'bad_totp' } });
      throw new UnauthorizedException('Mã xác thực không đúng');
    }
    if (!user.totpEnabled) await this.prisma.user.update({ where: { id: userId }, data: { totpEnabled: true } });
    return this.finish(res, userId, ip);
  }

  // Bước thiết lập 2FA lần đầu: sinh khóa + mã QR (chưa bật cho đến khi nhập đúng mã)
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('2fa/setup')
  @HttpCode(200)
  async setup(@Body() b: TicketDto) {
    const userId = verifyTicket(b.ticket);
    if (!userId) throw new UnauthorizedException('Phiên xác thực đã hết hạn, vui lòng đăng nhập lại');
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.totpEnabled) throw new ForbiddenException('2FA đã được bật');
    const secret = generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { totpSecretEnc: encrypt(secret) } });
    const uri = generateURI({ issuer: 'KhoiPhucViet', label: user.username, secret });
    return { secret, qr: await QRCode.toDataURL(uri) };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@CurrentUser() u: AuthUser, @ClientIp() ip: string, @Res({ passthrough: true }) res: Response) {
    await this.prisma.authSession.update({ where: { id: u.sessionId }, data: { revokedAt: new Date() } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'LOGOUT', ip });
    res.clearCookie(SESSION_COOKIE);
    return { ok: true };
  }

  @AllowMustChange()
  @Get('me')
  me(@CurrentUser() u: AuthUser) {
    return { id: u.id, username: u.username, fullName: u.fullName, role: u.role, mustChangePassword: u.mustChangePassword };
  }

  @AllowMustChange()
  @Post('change-password')
  @HttpCode(200)
  async changePassword(@CurrentUser() u: AuthUser, @Body() b: ChangePwDto, @ClientIp() ip: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: u.id } });
    if (!(await checkPassword(user.passwordHash, b.oldPassword))) throw new BadRequestException('Mật khẩu cũ không đúng');
    const problem = passwordProblem(b.newPassword);
    if (problem) throw new BadRequestException(problem);
    await this.prisma.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(b.newPassword), mustChangePassword: false } });
    // đăng xuất các phiên khác
    await this.prisma.authSession.updateMany({ where: { userId: u.id, id: { not: u.sessionId }, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.log({ userId: u.id, username: u.username, action: 'CHANGE_PASSWORD', ip });
    return { ok: true };
  }

  // ── nội bộ ──
  private async finish(res: Response, userId: string, ip: string) {
    const token = newToken();
    const user = await this.prisma.user.update({ where: { id: userId }, data: { failedLogins: 0, lockedUntil: null } });
    await this.prisma.authSession.create({ data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + ABSOLUTE_MS), ip } });
    res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE !== 'false', maxAge: ABSOLUTE_MS, path: '/' });
    await this.audit.log({ userId, username: user.username, action: 'LOGIN', ip });
    return { step: 'done', user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, mustChangePassword: user.mustChangePassword } };
  }
}
