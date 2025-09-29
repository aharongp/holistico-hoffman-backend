import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [PatientController],
  imports: [PrismaModule],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
