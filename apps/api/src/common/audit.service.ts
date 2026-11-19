import { Global, Injectable, Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(e: { userId?: string | null; username?: string | null; action: string; entity?: string; entityId?: string; ip?: string; meta?: object }) {
    return this.prisma.auditLog
      .create({ data: { ...e, meta: e.meta as any } })
      .catch((err) => console.error('Ghi nhật ký thất bại', err));
  }
}

@Global()
@Module({ providers: [AuditService], exports: [AuditService] })
export class AuditModule {}
