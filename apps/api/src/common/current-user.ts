import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './auth.guard';

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user);
export const ClientIp = createParamDecorator((_: unknown, ctx: ExecutionContext): string => ctx.switchToHttp().getRequest().ip);
