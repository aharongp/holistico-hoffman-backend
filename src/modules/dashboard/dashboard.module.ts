import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PatientModule } from '../patients/patient/patient.module';

@Module({
  imports: [PrismaModule, PatientModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
