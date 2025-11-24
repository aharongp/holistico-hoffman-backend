import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePatientInstrumentDto } from './dto/create-patient-instrument.dto';
import { UpdatePatientInstrumentDto } from './dto/update-patient-instrument.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PatientInstrumentAssignment } from './entities/patient-instrument.entity';
import { paciente_instrumento } from '@prisma/client';

@Injectable()
export class PatientInstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPatientInstrumentDto: CreatePatientInstrumentDto) {
    return 'This action adds a new patientInstrument';
  }

  async findAll(): Promise<PatientInstrumentAssignment[]> {
    const records = await this.prisma.paciente_instrumento.findMany({
      orderBy: [
        { created_at: 'desc' },
        { id: 'desc' },
      ],
    });

    return this.mapAssignments(records);
  }

  async findOne(id: number): Promise<PatientInstrumentAssignment | null> {
    const record = await this.prisma.paciente_instrumento.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    const [assignment] = await this.mapAssignments([record]);
    return assignment ?? null;
  }

  async update(id: number, updatePatientInstrumentDto: UpdatePatientInstrumentDto) {
    return `This action updates a #${id} patientInstrument`;
  }

  async remove(id: number) {
    return `This action removes a #${id} patientInstrument`;
  }

  async findByPatient(patientId: number): Promise<PatientInstrumentAssignment[]> {
    await this.ensurePatientExists(patientId);

    const records = await this.prisma.paciente_instrumento.findMany({
      where: { id_paciente: patientId },
      orderBy: [
        { fecha_instrumento: 'desc' },
        { created_at: 'desc' },
        { id: 'desc' },
      ],
    });

    return this.mapAssignments(records);
  }

  async findByUser(userId: number): Promise<PatientInstrumentAssignment[]> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.findByPatient(patientId);
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

  private async resolvePatientIdByUser(userId: number): Promise<number> {
    const patient = await this.prisma.paciente.findFirst({
      where: { id_usuario: userId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado para el usuario proporcionado');
    }

    return patient.id;
  }

  private async mapAssignments(records: paciente_instrumento[]): Promise<PatientInstrumentAssignment[]> {
    if (!records.length) {
      return [];
    }

    const instrumentTypeIds = Array.from(
      new Set(
        records
          .map((record) => record.id_instrumento_tipo)
          .filter((id): id is number => id !== null && id !== undefined),
      ),
    );

    const instrumentTypes = instrumentTypeIds.length
      ? await this.prisma.instrumento_tipo.findMany({
          where: { id: { in: instrumentTypeIds } },
          select: {
            id: true,
            nombre: true,
            descripcion: true,
          },
        })
      : [];

    const instrumentTypeMap = new Map<number, { nombre: string | null; descripcion: string | null }>(
      instrumentTypes.map((type) => [type.id, { nombre: type.nombre ?? null, descripcion: type.descripcion ?? null }]),
    );

    return records.map<PatientInstrumentAssignment>((record) => {
      const typeInfo = record.id_instrumento_tipo
        ? instrumentTypeMap.get(record.id_instrumento_tipo) ?? null
        : null;

      return {
        id: record.id,
        patientId: record.id_paciente ?? null,
        instrumentTypeId: record.id_instrumento_tipo ?? null,
        instrumentTypeName: typeInfo?.nombre ?? null,
        instrumentTypeDescription: typeInfo?.descripcion ?? null,
        assignedAt: this.toIso(record.fecha_instrumento) ?? this.toIso(record.created_at),
        createdAt: this.toIso(record.created_at),
        updatedAt: this.toIso(record.updated_at),
        validUntil: this.toIso(record.valido_hasta),
        completed: this.toBoolean(record.completado),
        evaluated: this.toBoolean(record.evaluado),
        available: this.toBoolean(record.disponible),
        availabilityRaw: this.toStringOrNull(record.disponible),
        origin: record.origen ?? null,
        ribbonId: record.id_cinta ?? null,
        topics: this.parseTopics(record.array_tema),
      };
    });
  }

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

  private toBoolean(value: number | string | null | undefined): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    const normalized = value.toString().trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    if (['0', 'false', 'no', 'off', 'n', 'f'].includes(normalized)) {
      return false;
    }

    return true;
  }

  private toStringOrNull(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const str = value.toString().trim();
    return str.length ? str : null;
  }

  private parseTopics(raw: string | null | undefined): string[] {
    if (!raw) {
      return [];
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (item === null || item === undefined ? null : item.toString().trim()))
          .filter((item): item is string => Boolean(item));
      }
    } catch {
      // ignore json parse errors, fallback below
    }

    return trimmed
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
