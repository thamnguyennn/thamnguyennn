import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma.service';
import { AuditModule } from './common/audit.service';
import { AuthGuard } from './common/auth.guard';
import { AuthController } from './auth/auth.controller';
import { UsersController } from './users/users.controller';
import { ClinicModule } from './clinic/clinic.module';
import { ExamModule } from './exam/exam.controller';
import { TreatmentModule } from './treatment/treatment.controller';
import { PharmacyModule } from './pharmacy/pharmacy.controller';
import { BillingModule } from './billing/billing.controller';
import { FollowUpModule } from './followup/followup.controller';
import { ReportsModule } from './reports/reports.controller';
import { HealthController } from './health.controller';

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]), PrismaModule, AuditModule, ClinicModule, ExamModule, TreatmentModule, PharmacyModule, BillingModule, FollowUpModule, ReportsModule],
  controllers: [AuthController, UsersController, HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
