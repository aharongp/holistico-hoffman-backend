import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Prisma, observacion_coach_diagnostico } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCoachDiagnosticObservationDto } from './dto/create-coach-diagnostic-observation.dto';
import { UpdateCoachDiagnosticObservationDto } from './dto/update-coach-diagnostic-observation.dto';
import { CoachDiagnosticObservation } from './entities/coach-diagnostic-observation.entity';

@Injectable()
export class CoachDiagnosticObservationService {
	constructor(private readonly prisma: PrismaService) {}

	async create(
		createCoachDiagnosticObservationDto: CreateCoachDiagnosticObservationDto,
	): Promise<CoachDiagnosticObservation> {
		const patientId = this.parsePatientId(
			createCoachDiagnosticObservationDto.id_paciente,
		);
		await this.ensurePatientExists(patientId);

		const data = this.buildCreateData(
			createCoachDiagnosticObservationDto,
			patientId,
		);

		const created =
			await this.prisma.observacion_coach_diagnostico.create({ data });

		return this.mapObservation(created);
	}

	async findAll(patientId?: number): Promise<CoachDiagnosticObservation[]> {
		let where: Prisma.observacion_coach_diagnosticoWhereInput | undefined;

		if (typeof patientId !== 'undefined') {
			const sanitized = this.parseIdentifier(patientId, 'del paciente');
			await this.ensurePatientExists(sanitized);
			where = { id_paciente: sanitized };
		}

		const observations = await this.prisma.observacion_coach_diagnostico.findMany({
			where,
			orderBy: { fecha_aplicado: 'desc' },
		});

		return observations.map((record) => this.mapObservation(record));
	}

	async findOne(id: number): Promise<CoachDiagnosticObservation> {
		const observationId = this.parseIdentifier(id, 'de la observacion');

		const observation = await this.prisma.observacion_coach_diagnostico.findUnique({
			where: { id: observationId },
		});

		if (!observation) {
			throw new NotFoundException('Observacion de coach no encontrada');
		}

		return this.mapObservation(observation);
	}

	async update(
		id: number,
		updateCoachDiagnosticObservationDto: UpdateCoachDiagnosticObservationDto,
	): Promise<CoachDiagnosticObservation> {
		const observationId = this.parseIdentifier(id, 'de la observacion');

		const existing = await this.prisma.observacion_coach_diagnostico.findUnique({
			where: { id: observationId },
		});

		if (!existing) {
			throw new NotFoundException('Observacion de coach no encontrada');
		}

		let nextPatientId: number | null | undefined;

		if (
			Object.prototype.hasOwnProperty.call(
				updateCoachDiagnosticObservationDto,
				'id_paciente',
			)
		) {
			const provided = updateCoachDiagnosticObservationDto.id_paciente;
			if (provided === null || typeof provided === 'undefined') {
				nextPatientId = null;
			} else {
				nextPatientId = this.parsePatientId(provided);
				await this.ensurePatientExists(nextPatientId);
			}
		}

		const data = this.buildUpdateData(
			updateCoachDiagnosticObservationDto,
			nextPatientId,
		);

		const updated = await this.prisma.observacion_coach_diagnostico.update({
			where: { id: observationId },
			data,
		});

		return this.mapObservation(updated);
	}

	async remove(id: number): Promise<CoachDiagnosticObservation> {
		const observationId = this.parseIdentifier(id, 'de la observacion');

		const existing = await this.prisma.observacion_coach_diagnostico.findUnique({
			where: { id: observationId },
		});

		if (!existing) {
			throw new NotFoundException('Observacion de coach no encontrada');
		}

		const deleted = await this.prisma.observacion_coach_diagnostico.delete({
			where: { id: observationId },
		});

		return this.mapObservation(deleted);
	}

	private buildCreateData(
		dto: CreateCoachDiagnosticObservationDto,
		patientId: number,
	): Prisma.observacion_coach_diagnosticoUncheckedCreateInput {
		return {
			id_paciente: patientId,
			id_instrumento: this.parseOptionalIdentifier(
				dto.id_instrumento,
				'del instrumento',
			),
			id_topico: this.parseOptionalIdentifier(dto.id_topico, 'del topico'),
			fecha_aplicado: this.toDate(dto.fecha_aplicado),
			comentario: this.toNullableString(dto.comentario),
			coach: this.toNullableString(dto.coach),
		};
	}

	private buildUpdateData(
		dto: UpdateCoachDiagnosticObservationDto,
		patientId: number | null | undefined,
	): Prisma.observacion_coach_diagnosticoUncheckedUpdateInput {
		const data: Prisma.observacion_coach_diagnosticoUncheckedUpdateInput = {};

		if (typeof patientId !== 'undefined') {
			data.id_paciente = patientId;
		}

		if (Object.prototype.hasOwnProperty.call(dto, 'id_instrumento')) {
			data.id_instrumento = this.parseOptionalIdentifier(
				dto.id_instrumento,
				'del instrumento',
			);
		}

		if (Object.prototype.hasOwnProperty.call(dto, 'id_topico')) {
			data.id_topico = this.parseOptionalIdentifier(
				dto.id_topico,
				'del topico',
			);
		}

		if (Object.prototype.hasOwnProperty.call(dto, 'fecha_aplicado')) {
			data.fecha_aplicado = this.toDate(dto.fecha_aplicado);
		}

		if (Object.prototype.hasOwnProperty.call(dto, 'comentario')) {
			data.comentario = this.toNullableString(dto.comentario);
		}

		if (Object.prototype.hasOwnProperty.call(dto, 'coach')) {
			data.coach = this.toNullableString(dto.coach);
		}

		return data;
	}

	private parseIdentifier(value: number, context: string): number {
		if (!Number.isFinite(value)) {
			throw new BadRequestException(`El identificador ${context} es invalido`);
		}

		const normalized = Math.trunc(value);
		if (normalized <= 0) {
			throw new BadRequestException(`El identificador ${context} es invalido`);
		}

		return normalized;
	}

	private parsePatientId(value: unknown): number {
		if (value === null || typeof value === 'undefined') {
			throw new BadRequestException(
				'El identificador del paciente es obligatorio',
			);
		}

		if (typeof value === 'number') {
			return this.parseIdentifier(value, 'del paciente');
		}

		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) {
				throw new BadRequestException(
					'El identificador del paciente es obligatorio',
				);
			}
			const parsed = Number(trimmed);
			return this.parseIdentifier(parsed, 'del paciente');
		}

		throw new BadRequestException('El identificador del paciente es invalido');
	}

	private parseOptionalIdentifier(
		value: unknown,
		context: string,
	): number | null {
		if (value === null || typeof value === 'undefined') {
			return null;
		}

		if (typeof value === 'number') {
			return this.parseIdentifier(value, context);
		}

		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) {
				return null;
			}
			const parsed = Number(trimmed);
			return this.parseIdentifier(parsed, context);
		}

		throw new BadRequestException(`El identificador ${context} es invalido`);
	}

	private async ensurePatientExists(patientId: number): Promise<void> {
		const found = await this.prisma.paciente.findUnique({
			where: { id: patientId },
			select: { id: true },
		});

		if (!found) {
			throw new NotFoundException('Paciente no encontrado');
		}
	}

	private mapObservation(
		record: observacion_coach_diagnostico,
	): CoachDiagnosticObservation {
		return {
			id: record.id,
			patientId: record.id_paciente ?? null,
			instrumentId: record.id_instrumento ?? null,
			topicId: record.id_topico ?? null,
			appliedAt: this.toIsoString(record.fecha_aplicado),
			comment: this.toNullableString(record.comentario),
			coach: this.toNullableString(record.coach),
			createdAt: this.toIsoString(record.created_at),
			updatedAt: this.toIsoString(record.updated_at),
		};
	}

	private toNullableString(value: unknown): string | null {
		if (value === null || typeof value === 'undefined') {
			return null;
		}

		if (value instanceof Date) {
			return Number.isNaN(value.getTime()) ? null : value.toISOString();
		}

		const normalized = String(value).trim();
		return normalized.length > 0 ? normalized : null;
	}

	private toIsoString(value: Date | null | undefined): string | null {
		if (!value) {
			return null;
		}

		return Number.isNaN(value.getTime()) ? null : value.toISOString();
	}

	private toDate(value: unknown): Date | null {
		if (value === null || typeof value === 'undefined') {
			return null;
		}

		if (value instanceof Date && !Number.isNaN(value.getTime())) {
			return value;
		}

		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (!trimmed) {
				return null;
			}

			const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
				? `${trimmed}T00:00:00.000Z`
				: trimmed;

			const parsed = new Date(normalized);
			return Number.isNaN(parsed.getTime()) ? null : parsed;
		}

		return null;
	}
}
