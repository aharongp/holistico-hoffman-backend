import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { CoachDiagnosticObservationController } from './coach-diagnostic-observation.controller';
import { CoachDiagnosticObservationService } from './coach-diagnostic-observation.service';

@Module({
	imports: [PrismaModule],
	controllers: [CoachDiagnosticObservationController],
	providers: [CoachDiagnosticObservationService],
})
export class CoachDiagnosticObservationModule {}
