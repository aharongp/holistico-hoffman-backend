import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, paciente_consulta } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { Consultation } from './entities/consultation.entity';

@Injectable()
export class ConsultationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createConsultationDto: CreateConsultationDto): Promise<Consultation> {
    const patientId = this.parsePatientId(createConsultationDto.id_paciente);
    await this.ensurePatientExists(patientId);

    const data = this.buildCreateData(createConsultationDto, patientId);
    const created = await this.prisma.paciente_consulta.create({ data });

    return this.mapConsultation(created);
  }

  async findAll(patientId?: number): Promise<Consultation[]> {
    let where: Prisma.paciente_consultaWhereInput | undefined;

    if (typeof patientId !== 'undefined') {
      const sanitized = this.parseIdentifier(patientId, 'del paciente');
      await this.ensurePatientExists(sanitized);
      where = { id_paciente: sanitized };
    }

    const consultations = await this.prisma.paciente_consulta.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });

    return consultations.map((record) => this.mapConsultation(record));
  }

  async findOne(id: number): Promise<Consultation> {
    const consultationId = this.parseIdentifier(id, 'de la consulta');

    const consultation = await this.prisma.paciente_consulta.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    return this.mapConsultation(consultation);
  }

  async update(
    id: number,
    updateConsultationDto: UpdateConsultationDto,
  ): Promise<Consultation> {
    const consultationId = this.parseIdentifier(id, 'de la consulta');

    const existing = await this.prisma.paciente_consulta.findUnique({
      where: { id: consultationId },
    });

    if (!existing) {
      throw new NotFoundException('Consulta no encontrada');
    }

    let nextPatientId: number | null | undefined;

    if (Object.prototype.hasOwnProperty.call(updateConsultationDto, 'id_paciente')) {
      const provided = updateConsultationDto.id_paciente;
      if (provided === null || typeof provided === 'undefined') {
        nextPatientId = null;
      } else {
        nextPatientId = this.parsePatientId(provided);
        await this.ensurePatientExists(nextPatientId);
      }
    }

    const data = this.buildUpdateData(updateConsultationDto, nextPatientId);

    const updated = await this.prisma.paciente_consulta.update({
      where: { id: consultationId },
      data,
    });

    return this.mapConsultation(updated);
  }

  async remove(id: number): Promise<Consultation> {
    const consultationId = this.parseIdentifier(id, 'de la consulta');

    const existing = await this.prisma.paciente_consulta.findUnique({
      where: { id: consultationId },
    });

    if (!existing) {
      throw new NotFoundException('Consulta no encontrada');
    }

    const deleted = await this.prisma.paciente_consulta.delete({
      where: { id: consultationId },
    });

    return this.mapConsultation(deleted);
  }

  private parseIdentifier(value: number, context: string): number {
    if (!Number.isFinite(value)) {
      throw new BadRequestException(`El identificador ${context} es inválido`);
    }

    const normalized = Math.trunc(value);
    if (normalized <= 0) {
      throw new BadRequestException(`El identificador ${context} es inválido`);
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

    throw new BadRequestException('El identificador del paciente es inválido');
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

  private buildCreateData(
    dto: CreateConsultationDto,
    patientId: number,
  ): Prisma.paciente_consultaUncheckedCreateInput {
    return {
      id_paciente: patientId,
      motivo: this.toNullableString(dto.motivo),
      fecha: this.toDate(dto.fecha),
      peso: this.toNullableString(dto.peso),
      imc: this.toNullableString(dto.imc),
      gc: this.toNullableString(dto.gc),
      pulso: this.toNullableString(dto.pulso),
      fcm: this.toNullableString(dto.fcm),
      tension: this.toNullableString(dto.tension),
      brazo: this.toNullableString(dto.brazo),
      muslo: this.toNullableString(dto.muslo),
      cintura: this.toNullableString(dto.cintura),
      cadera: this.toNullableString(dto.cadera),
      busto_pecho: this.toNullableString(dto.busto_pecho),
      cuello: this.toNullableString(dto.cuello),
      hallazgo: this.toNullableString(dto.hallazgo),
      diagnostico: this.toNullableString(dto.diagnostico),
      recomendacion: this.toNullableString(dto.recomendacion),
      observacion: this.toNullableString(dto.observacion),
      respiracion: this.toNullableString(dto.respiracion),
      evolucion: this.toNullableString(dto.evolucion),
      recomendacion_coach: this.toNullableString(dto.recomendacion_coach),
      indicaciones: this.toNullableString(dto.indicaciones),
    };
  }

  private buildUpdateData(
    dto: UpdateConsultationDto,
    patientId: number | null | undefined,
  ): Prisma.paciente_consultaUncheckedUpdateInput {
    const data: Prisma.paciente_consultaUncheckedUpdateInput = {};

    if (typeof patientId !== 'undefined') {
      data.id_paciente = patientId;
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'motivo')) {
      data.motivo = this.toNullableString(dto.motivo);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'fecha')) {
      data.fecha = this.toDate(dto.fecha);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'peso')) {
      data.peso = this.toNullableString(dto.peso);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'imc')) {
      data.imc = this.toNullableString(dto.imc);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'gc')) {
      data.gc = this.toNullableString(dto.gc);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'pulso')) {
      data.pulso = this.toNullableString(dto.pulso);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'fcm')) {
      data.fcm = this.toNullableString(dto.fcm);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'tension')) {
      data.tension = this.toNullableString(dto.tension);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'brazo')) {
      data.brazo = this.toNullableString(dto.brazo);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'muslo')) {
      data.muslo = this.toNullableString(dto.muslo);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'cintura')) {
      data.cintura = this.toNullableString(dto.cintura);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'cadera')) {
      data.cadera = this.toNullableString(dto.cadera);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'busto_pecho')) {
      data.busto_pecho = this.toNullableString(dto.busto_pecho);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'cuello')) {
      data.cuello = this.toNullableString(dto.cuello);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'hallazgo')) {
      data.hallazgo = this.toNullableString(dto.hallazgo);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'diagnostico')) {
      data.diagnostico = this.toNullableString(dto.diagnostico);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'recomendacion')) {
      data.recomendacion = this.toNullableString(dto.recomendacion);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'observacion')) {
      data.observacion = this.toNullableString(dto.observacion);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'respiracion')) {
      data.respiracion = this.toNullableString(dto.respiracion);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'evolucion')) {
      data.evolucion = this.toNullableString(dto.evolucion);
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'recomendacion_coach')) {
      data.recomendacion_coach = this.toNullableString(
        dto.recomendacion_coach,
      );
    }
    if (Object.prototype.hasOwnProperty.call(dto, 'indicaciones')) {
      data.indicaciones = this.toNullableString(dto.indicaciones);
    }

    return data;
  }

  private mapConsultation(record: paciente_consulta): Consultation {
    return {
      id: record.id,
      patientId: record.id_paciente ?? null,
      reason: this.toNullableString(record.motivo),
      date: this.toIsoString(record.fecha),
      weight: this.toNullableString(record.peso),
      bodyMassIndex: this.toNullableString(record.imc),
      bodyFat: this.toNullableString(record.gc),
      pulse: this.toNullableString(record.pulso),
      maxHeartRate: this.toNullableString(record.fcm),
      bloodPressure: this.toNullableString(record.tension),
      arm: this.toNullableString(record.brazo),
      thigh: this.toNullableString(record.muslo),
      waist: this.toNullableString(record.cintura),
      hip: this.toNullableString(record.cadera),
      chest: this.toNullableString(record.busto_pecho),
      neck: this.toNullableString(record.cuello),
      finding: this.toNullableString(record.hallazgo),
      diagnosis: this.toNullableString(record.diagnostico),
      recommendation: this.toNullableString(record.recomendacion),
      observation: this.toNullableString(record.observacion),
      breathing: this.toNullableString(record.respiracion),
      evolution: this.toNullableString(record.evolucion),
      coachRecommendation: this.toNullableString(record.recomendacion_coach),
      indications: this.toNullableString(record.indicaciones),
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
