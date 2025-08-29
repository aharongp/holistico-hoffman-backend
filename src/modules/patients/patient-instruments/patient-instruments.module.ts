import { Module } from '@nestjs/common';
import { PatientInstrumentsService } from './patient-instruments.service';
import { PatientInstrumentsController } from './patient-instruments.controller';

@Module({
  controllers: [PatientInstrumentsController],
  providers: [PatientInstrumentsService],
})
export class PatientInstrumentsModule {}
