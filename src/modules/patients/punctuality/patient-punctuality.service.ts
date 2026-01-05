import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePatientPunctualityDto } from './dto/update-patient-punctuality.dto';
import { CreatePatientPunctualityDto } from './dto/create-patient-punctuality.dto';
import { PatientPunctualityRecord } from './entities/patient-punctuality.entity';

@Injectable()
export class PatientPunctualityService {
  constructor(private readonly prisma: PrismaService) {}

  private toIso(value: Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    try {
      return value.toISOString();
    } catch {
      return null;
    }
  }

  private hasAnyKey(
    input: Record<string, any> | undefined,
    keys: string[],
  ): boolean {
    if (!input || typeof input !== 'object') {
      return false;
    }

    return keys.some((key) => Object.prototype.hasOwnProperty.call(input, key));
  }

  private normalizeString(value: unknown): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return undefined;
  }

  private normalizeNumber(value: unknown): number | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? Number(value) : undefined;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      const normalized = Number(trimmed.replace(/,/g, '.'));
      return Number.isFinite(normalized) ? normalized : undefined;
    }

    return undefined;
  }

  private normalizeBooleanInt(value: unknown): number | null | undefined {
    const normalized = this.normalizeNumber(value);
    if (normalized === undefined) {
      return undefined;
    }

    if (normalized === null) {
      return null;
    }

    if (!Number.isFinite(normalized)) {
      return undefined;
    }

    return normalized ? 1 : 0;
  }

  private normalizeDateInput(value: unknown): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      const iso = trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00.000Z`;
      const parsed = new Date(iso);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    return undefined;
  }

  private async ensurePatientExists(patientId: number): Promise<void> {
    const patient = await this.prisma.paciente.findUnique({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }
  }

  private mapPrismaRecord(record: any): PatientPunctualityRecord {
    return {
      id: record.id,
      patientId: record.id_paciente ?? null,
      date: this.toIso(record.fecha),
      activity: record.actividad ?? null,
      punctuality: record.puntualidad ?? null,
      effectiveness: record.efectividad ?? null,
      compliance: record.cumplimiento ?? null,
      roleEffectiveness: record.efectividad_rol ?? null,
      evaluated: record.evaluado ?? null,
      createdAt: this.toIso(record.created_at),
      updatedAt: this.toIso(record.updated_at),
    };
  }

  async create(
    createDto: CreatePatientPunctualityDto,
  ): Promise<PatientPunctualityRecord> {
    const rawPatientId =
      (createDto as any).id_paciente ?? (createDto as any).patientId;
    const patientId = this.normalizeNumber(rawPatientId);

    if (patientId === undefined || patientId === null) {
      throw new BadRequestException(
        'Se requiere el identificador del paciente.',
      );
    }

    await this.ensurePatientExists(Number(patientId));

    const data: Prisma.paciente_puntualidadCreateInput = {
      id_paciente: Number(patientId),
    };

    if (this.hasAnyKey(createDto as any, ['fecha', 'date'])) {
      const normalizedDate = this.normalizeDateInput(
        (createDto as any).fecha ?? (createDto as any).date,
      );
      if (normalizedDate === undefined) {
        throw new BadRequestException('La fecha proporcionada no es válida.');
      }
      data.fecha = normalizedDate;
    }

    if (this.hasAnyKey(createDto as any, ['actividad', 'activity'])) {
      const activity = this.normalizeString(
        (createDto as any).actividad ?? (createDto as any).activity,
      );
      if (activity === undefined) {
        throw new BadRequestException(
          'La actividad proporcionada no es válida.',
        );
      }
      data.actividad = activity;
    }

    if (this.hasAnyKey(createDto as any, ['puntualidad', 'punctuality'])) {
      const punctuality = this.normalizeNumber(
        (createDto as any).puntualidad ?? (createDto as any).punctuality,
      );
      if (punctuality === undefined) {
        throw new BadRequestException('El valor de puntualidad no es válido.');
      }
      data.puntualidad = punctuality;
    }

    if (this.hasAnyKey(createDto as any, ['efectividad', 'effectiveness'])) {
      const effectiveness = this.normalizeNumber(
        (createDto as any).efectividad ?? (createDto as any).effectiveness,
      );
      if (effectiveness === undefined) {
        throw new BadRequestException('El valor de efectividad no es válido.');
      }
      data.efectividad = effectiveness;
    }

    if (this.hasAnyKey(createDto as any, ['cumplimiento', 'compliance'])) {
      const compliance = this.normalizeNumber(
        (createDto as any).cumplimiento ?? (createDto as any).compliance,
      );
      if (compliance === undefined) {
        throw new BadRequestException('El valor de cumplimiento no es válido.');
      }
      data.cumplimiento = compliance;
    }

    if (
      this.hasAnyKey(createDto as any, ['efectividad_rol', 'roleEffectiveness'])
    ) {
      const roleEffectiveness = this.normalizeNumber(
        (createDto as any).efectividad_rol ??
          (createDto as any).roleEffectiveness,
      );
      if (roleEffectiveness === undefined) {
        throw new BadRequestException(
          'El valor de efectividad por rol no es válido.',
        );
      }
      data.efectividad_rol = roleEffectiveness;
    }

    if (this.hasAnyKey(createDto as any, ['evaluado', 'evaluated'])) {
      const evaluated = this.normalizeBooleanInt(
        (createDto as any).evaluado ?? (createDto as any).evaluated,
      );
      if (evaluated === undefined) {
        throw new BadRequestException('El valor de evaluado no es válido.');
      }
      data.evaluado = evaluated;
    }

    const now = new Date();

    if (this.hasAnyKey(createDto as any, ['created_at'])) {
      const createdAt = this.normalizeDateInput((createDto as any).created_at);
      if (createdAt === undefined) {
        throw new BadRequestException('La fecha de creación no es válida.');
      }
      data.created_at = createdAt;
    } else {
      data.created_at = now;
    }

    if (this.hasAnyKey(createDto as any, ['updated_at'])) {
      const updatedAt = this.normalizeDateInput((createDto as any).updated_at);
      if (updatedAt === undefined) {
        throw new BadRequestException(
          'La fecha de actualización no es válida.',
        );
      }
      data.updated_at = updatedAt;
    } else {
      data.updated_at = now;
    }

    const created = await this.prisma.paciente_puntualidad.create({ data });
    return this.mapPrismaRecord(created);
  }

  async findAll(): Promise<PatientPunctualityRecord[]> {
    const records = await this.prisma.paciente_puntualidad.findMany({
      orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }, { id: 'desc' }],
    });

    return records.map((record) => this.mapPrismaRecord(record));
  }

  async findByPatient(patientId: number): Promise<PatientPunctualityRecord[]> {
    await this.ensurePatientExists(patientId);

    const records = await this.prisma.paciente_puntualidad.findMany({
      where: { id_paciente: patientId },
      orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }, { id: 'desc' }],
    });

    return records.map((record) => this.mapPrismaRecord(record));
  }

  async findOne(id: number): Promise<PatientPunctualityRecord | null> {
    const record = await this.prisma.paciente_puntualidad.findUnique({
      where: { id },
    });
    if (!record) {
      return null;
    }

    return this.mapPrismaRecord(record);
  }

  async update(
    id: number,
    updateDto: UpdatePatientPunctualityDto,
  ): Promise<PatientPunctualityRecord> {
    const existing = await this.prisma.paciente_puntualidad.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Registro de puntualidad no encontrado');
    }

    const data: Prisma.paciente_puntualidadUpdateInput = {};

    if (this.hasAnyKey(updateDto, ['id_paciente', 'patientId'])) {
      const patientId = this.normalizeNumber(
        (updateDto as any).id_paciente ?? (updateDto as any).patientId,
      );
      if (patientId === undefined) {
        throw new BadRequestException(
          'El identificador del paciente no es válido.',
        );
      }

      if (patientId !== null) {
        await this.ensurePatientExists(Number(patientId));
      }

      data.id_paciente = patientId;
    }

    if (this.hasAnyKey(updateDto, ['fecha', 'date'])) {
      const normalizedDate = this.normalizeDateInput(
        (updateDto as any).fecha ?? (updateDto as any).date,
      );
      if (normalizedDate === undefined) {
        throw new BadRequestException('La fecha proporcionada no es válida.');
      }
      data.fecha = normalizedDate;
    }

    if (this.hasAnyKey(updateDto, ['actividad', 'activity'])) {
      const activity = this.normalizeString(
        (updateDto as any).actividad ?? (updateDto as any).activity,
      );
      if (activity === undefined) {
        throw new BadRequestException(
          'La actividad proporcionada no es válida.',
        );
      }
      data.actividad = activity;
    }

    if (this.hasAnyKey(updateDto, ['puntualidad', 'punctuality'])) {
      const punctuality = this.normalizeNumber(
        (updateDto as any).puntualidad ?? (updateDto as any).punctuality,
      );
      if (punctuality === undefined) {
        throw new BadRequestException('El valor de puntualidad no es válido.');
      }
      data.puntualidad = punctuality;
    }

    if (this.hasAnyKey(updateDto, ['efectividad', 'effectiveness'])) {
      const effectiveness = this.normalizeNumber(
        (updateDto as any).efectividad ?? (updateDto as any).effectiveness,
      );
      if (effectiveness === undefined) {
        throw new BadRequestException('El valor de efectividad no es válido.');
      }
      data.efectividad = effectiveness;
    }

    if (this.hasAnyKey(updateDto, ['cumplimiento', 'compliance'])) {
      const compliance = this.normalizeNumber(
        (updateDto as any).cumplimiento ?? (updateDto as any).compliance,
      );
      if (compliance === undefined) {
        throw new BadRequestException('El valor de cumplimiento no es válido.');
      }
      data.cumplimiento = compliance;
    }

    if (this.hasAnyKey(updateDto, ['efectividad_rol', 'roleEffectiveness'])) {
      const roleEffectiveness = this.normalizeNumber(
        (updateDto as any).efectividad_rol ??
          (updateDto as any).roleEffectiveness,
      );
      if (roleEffectiveness === undefined) {
        throw new BadRequestException(
          'El valor de efectividad por rol no es válido.',
        );
      }
      data.efectividad_rol = roleEffectiveness;
    }

    if (this.hasAnyKey(updateDto, ['evaluado', 'evaluated'])) {
      const evaluated = this.normalizeBooleanInt(
        (updateDto as any).evaluado ?? (updateDto as any).evaluated,
      );
      if (evaluated === undefined) {
        throw new BadRequestException('El valor de evaluado no es válido.');
      }
      data.evaluado = evaluated;
    }

    if (this.hasAnyKey(updateDto, ['created_at'])) {
      const createdAt = this.normalizeDateInput((updateDto as any).created_at);
      if (createdAt === undefined) {
        throw new BadRequestException('La fecha de creación no es válida.');
      }
      data.created_at = createdAt;
    }

    if (this.hasAnyKey(updateDto, ['updated_at'])) {
      const updatedAt = this.normalizeDateInput((updateDto as any).updated_at);
      if (updatedAt === undefined) {
        throw new BadRequestException(
          'La fecha de actualización no es válida.',
        );
      }
      data.updated_at = updatedAt;
    } else {
      data.updated_at = new Date();
    }

    if (Object.keys(data).length === 0) {
      return this.mapPrismaRecord(existing);
    }

    const updated = await this.prisma.paciente_puntualidad.update({
      where: { id },
      data,
    });

    return this.mapPrismaRecord(updated);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.paciente_puntualidad.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Registro de puntualidad no encontrado');
    }

    await this.prisma.paciente_puntualidad.delete({ where: { id } });

    return { deleted: true };
  }
}
