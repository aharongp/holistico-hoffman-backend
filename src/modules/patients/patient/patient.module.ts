import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HistoryModule } from '../history/history.module';

@Module({
  controllers: [PatientController],
  imports: [PrismaModule, HistoryModule],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
