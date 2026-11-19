import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { sha256 } from './crypto';

export const SESSION_COOKIE = 'kpv_session';
export const IDLE_MS = 30 * 60 * 1000;      // tự đăng xuất sau 30 phút không dùng
export const ABSOLUTE_MS = 12 * 3600 * 1000; // tối đa 12 giờ

export const Public = () => SetMetadata('public', true);
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

export interface AuthUser { id: string; username: string; fullName: string; role: Role; mustChangePassword: boolean; sessionId: string }

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>('public', targets)) return true;

    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) throw new UnauthorizedException('Chưa đăng nhập');

    const s = await this.prisma.authSession.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
    const now = Date.now();
    if (!s || s.revokedAt || s.expiresAt.getTime() < now || now - s.lastSeenAt.getTime() > IDLE_MS || !s.user.active)
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');

    if (now - s.lastSeenAt.getTime() > 60_000)
      await this.prisma.authSession.update({ where: { id: s.id }, data: { lastSeenAt: new Date() } });

    const u: AuthUser = { id: s.user.id, username: s.user.username, fullName: s.user.fullName, role: s.user.role, mustChangePassword: s.user.mustChangePassword, sessionId: s.id };
    req.user = u;

    if (u.mustChangePassword && !this.reflector.getAllAndOverride<boolean>('allowMustChange', targets))
      throw new ForbiddenException({ message: 'Cần đổi mật khẩu trước khi sử dụng', code: 'MUST_CHANGE_PASSWORD' });

    const roles = this.reflector.getAllAndOverride<Role[]>('roles', targets);
    if (roles && !roles.includes(u.role)) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    return true;
  }
}

export const AllowMustChange = () => SetMetadata('allowMustChange', true);
