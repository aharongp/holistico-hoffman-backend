import { Module } from '@nestjs/common';
import { PatientModule } from './patient/patient.module';
import { HistoryModule } from './history/history.module';
import { ConsultationModule } from './consultation/consultation.module';
import { VitalsModule } from './vitals/vitals.module';
import { DentalModule } from './exams/dental/dental.module';
import { OcularModule } from './exams/ocular/ocular.module';
import { PatientInstrumentsModule } from './patient-instruments/patient-instruments.module';
import { RedimensionModule } from './redimension/redimension.module';

@Module({
  imports: [PatientModule, HistoryModule, ConsultationModule, VitalsModule, DentalModule, OcularModule, PatientInstrumentsModule, RedimensionModule]
})
export class PatientsModule {}
