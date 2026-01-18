import { PartialType } from '@nestjs/mapped-types';
import { CreateCoachDiagnosticObservationDto } from './create-coach-diagnostic-observation.dto';

export class UpdateCoachDiagnosticObservationDto extends PartialType(CreateCoachDiagnosticObservationDto) {}
