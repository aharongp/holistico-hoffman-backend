import { Module } from '@nestjs/common';
import { PatientPunctualityService } from './patient-punctuality.service';
import { PatientPunctualityController } from './patient-punctuality.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatientPunctualityController],
  providers: [PatientPunctualityService],
  exports: [PatientPunctualityService],
})
export class PatientPunctualityModule {}
