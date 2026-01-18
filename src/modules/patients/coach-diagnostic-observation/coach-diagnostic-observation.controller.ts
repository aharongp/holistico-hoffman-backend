import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { CoachDiagnosticObservationService } from './coach-diagnostic-observation.service';
import { CreateCoachDiagnosticObservationDto } from './dto/create-coach-diagnostic-observation.dto';
import { UpdateCoachDiagnosticObservationDto } from './dto/update-coach-diagnostic-observation.dto';

@Controller('coach-diagnostic-observation')
export class CoachDiagnosticObservationController {
	constructor(
		private readonly coachDiagnosticObservationService: CoachDiagnosticObservationService,
	) {}

	@Post()
	create(
		@Body()
		createCoachDiagnosticObservationDto: CreateCoachDiagnosticObservationDto,
	) {
		return this.coachDiagnosticObservationService.create(
			createCoachDiagnosticObservationDto,
		);
	}

	@Get()
	findAll(@Query('patientId') patientId?: string) {
		const parsed =
			typeof patientId === 'string' && patientId.trim().length
				? Number(patientId)
				: undefined;

		const filter =
			typeof parsed === 'number' && Number.isFinite(parsed)
				? parsed
				: undefined;

		return this.coachDiagnosticObservationService.findAll(filter);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.coachDiagnosticObservationService.findOne(+id);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body()
		updateCoachDiagnosticObservationDto: UpdateCoachDiagnosticObservationDto,
	) {
		return this.coachDiagnosticObservationService.update(
			+id,
			updateCoachDiagnosticObservationDto,
		);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.coachDiagnosticObservationService.remove(+id);
	}
}
