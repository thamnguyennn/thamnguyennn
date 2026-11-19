import { Module } from '@nestjs/common';
import { ClinicService } from './clinic.service';
import { LeadsController, AppointmentsController, PatientsController, EncountersController } from './clinic.controllers';

@Module({ controllers: [LeadsController, AppointmentsController, PatientsController, EncountersController], providers: [ClinicService] })
export class ClinicModule {}
