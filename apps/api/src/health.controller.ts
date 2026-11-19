import { Controller, Get } from '@nestjs/common';
import { Public } from './common/auth.guard';
import { PrismaService } from './prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  // Dùng cho dịch vụ giám sát: trả 200 khi API và CSDL đều sống
  @Public()
  @Get()
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true, at: new Date().toISOString() };
  }
}
