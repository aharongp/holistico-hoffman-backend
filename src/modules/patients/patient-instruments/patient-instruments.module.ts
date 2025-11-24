import { Module } from '@nestjs/common';
import { PatientInstrumentsService } from './patient-instruments.service';
import { PatientInstrumentsController } from './patient-instruments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [PatientInstrumentsController],
  imports: [PrismaModule],
  providers: [PatientInstrumentsService],
  exports: [PatientInstrumentsService],
})
export class PatientInstrumentsModule {}
