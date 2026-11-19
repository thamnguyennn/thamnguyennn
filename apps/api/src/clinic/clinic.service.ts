import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { vnDay } from './util';

@Injectable()
export class ClinicService {
  constructor(private prisma: PrismaService) {}

  private async next(tx: Prisma.TransactionClient, key: string) {
    const c = await tx.counter.upsert({ where: { key }, create: { key, value: 1 }, update: { value: { increment: 1 } } });
    return c.value;
  }

  // Mã hồ sơ: KPV-26-000123
  async newPatientCode(tx: Prisma.TransactionClient) {
    const yy = vnDay().slice(2, 4);
    const n = await this.next(tx, `patient:${yy}`);
    return `KPV-${yy}-${String(n).padStart(6, '0')}`;
  }

  // Check-in: tạo lượt khám, tự đếm "lần khám thứ mấy" và số thứ tự trong ngày
  async checkIn(patientId: string, by: string, opts: { appointmentId?: string; doctorId?: string; therapistId?: string }) {
    return this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({ where: { id: patientId } });
      if (!patient) throw new NotFoundException('Không tìm thấy bệnh nhân');
      const today = vnDay();
      const open = await tx.encounter.findFirst({ where: { patientId, status: { notIn: ['DONE', 'CANCELLED'] }, visitDate: { gte: new Date(`${today}T00:00:00+07:00`) } } });
      if (open) throw new ConflictException('Bệnh nhân đã check-in hôm nay và chưa hoàn tất');
      const visitNo = (await tx.encounter.count({ where: { patientId, status: { not: 'CANCELLED' } } })) + 1;
      const queueNo = await this.next(tx, `queue:${today}`);
      const appt = opts.appointmentId ? await tx.appointment.findUnique({ where: { id: opts.appointmentId } }) : null;
      const enc = await tx.encounter.create({
        data: {
          patientId, visitNo, queueNo, checkedInById: by,
          appointmentId: appt?.id,
          doctorId: opts.doctorId ?? appt?.doctorId,
          therapistId: opts.therapistId ?? appt?.therapistId,
        },
        include: { patient: { select: { code: true, fullName: true, birthYear: true, phone: true } } },
      });
      if (appt) {
        await tx.appointment.update({ where: { id: appt.id }, data: { status: 'CHECKED_IN', patientId } });
        if (appt.leadId) await tx.lead.update({ where: { id: appt.leadId }, data: { status: 'VISITED', patientId } });
      }
      return enc;
    });
  }
}
