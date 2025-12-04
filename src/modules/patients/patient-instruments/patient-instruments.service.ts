import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePatientInstrumentDto } from './dto/create-patient-instrument.dto';
import { UpdatePatientInstrumentDto } from './dto/update-patient-instrument.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PatientInstrumentAssignment, PatientInstrumentResponse } from './entities/patient-instrument.entity';
import { Prisma, paciente_instrumento, paciente_instrumento_respuesta } from '@prisma/client';
import { SubmitInstrumentAnswerDto, SubmitPatientInstrumentResponseDto } from './dto/submit-patient-instrument-response.dto';

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

  async findResponsesByPatient(patientId: number): Promise<PatientInstrumentResponse[]> {
    await this.ensurePatientExists(patientId);

    const records = await this.prisma.paciente_instrumento_respuesta.findMany({
      where: { id_paciente: patientId },
      orderBy: [
        { fecha: 'desc' },
        { created_at: 'desc' },
        { id: 'desc' },
      ],
    });

    return this.mapInstrumentResponses(records);
  }

  async findResponsesByUser(userId: number): Promise<PatientInstrumentResponse[]> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.findResponsesByPatient(patientId);
  }

  async submitResponses(
    patientInstrumentId: number,
    dto: SubmitPatientInstrumentResponseDto,
  ): Promise<PatientInstrumentResponse[]> {
    const assignment = await this.prisma.paciente_instrumento.findUnique({ where: { id: patientInstrumentId } });

    if (!assignment) {
      throw new NotFoundException('Asignación de instrumento no encontrada');
    }

    if (!dto.answers || dto.answers.length === 0) {
      throw new BadRequestException('Se requiere al menos una respuesta para guardar el instrumento');
    }

    const resolvedPatientId = assignment.id_paciente ?? dto.patientId ?? null;
    if (!resolvedPatientId) {
      throw new BadRequestException('No se pudo determinar el paciente asociado a la asignación.');
    }

    const resolvedInstrumentTypeId = assignment.id_instrumento_tipo ?? dto.instrumentTypeId ?? null;
    const resolvedInstrumentId = dto.instrumentId ?? null;
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.paciente_instrumento_respuesta.deleteMany({
        where: { id_paciente_instrumento: patientInstrumentId },
      });

      const rows = dto.answers.map((answer, index) =>
        this.buildResponseRow({
          answer,
          assignment,
          patientId: resolvedPatientId,
          instrumentId: resolvedInstrumentId,
          instrumentTypeId: resolvedInstrumentTypeId,
          fallbackOrder: index + 1,
          timestamp: now,
          saveOnly: dto.saveOnly ?? false,
          overrideTheme: dto.theme ?? answer.theme ?? null,
          overrideTopic: dto.topic ?? answer.topic ?? null,
          instrumentTypeName: dto.instrumentTypeName ?? null,
        }),
      );

      if (rows.length) {
        await tx.paciente_instrumento_respuesta.createMany({ data: rows });
      }

      const shouldMarkCompleted = dto.saveOnly ? false : dto.markAsCompleted !== false;

      await tx.paciente_instrumento.update({
        where: { id: patientInstrumentId },
        data: {
          completado: shouldMarkCompleted ? 1 : assignment.completado ?? 0,
          updated_at: now,
          disponible: shouldMarkCompleted ? '0' : assignment.disponible ?? null,
        },
      });
    });

    const savedRecords = await this.prisma.paciente_instrumento_respuesta.findMany({
      where: { id_paciente_instrumento: patientInstrumentId },
      orderBy: [
        { orden: 'asc' },
        { id: 'asc' },
      ],
    });

    return this.mapInstrumentResponses(savedRecords);
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

  private buildResponseRow(params: {
    answer: SubmitInstrumentAnswerDto;
    assignment: paciente_instrumento;
    patientId: number;
    instrumentId: number | null;
    instrumentTypeId: number | null;
    fallbackOrder: number;
    timestamp: Date;
    saveOnly: boolean;
    overrideTheme: string | null;
    overrideTopic: string | null;
    instrumentTypeName: string | null;
  }): Prisma.paciente_instrumento_respuestaCreateManyInput {
    const { answer, assignment, patientId, instrumentId, instrumentTypeId, fallbackOrder, timestamp, saveOnly, overrideTheme, overrideTopic, instrumentTypeName } = params;

    const value = this.stringifyAnswer(answer.value ?? answer.rawValue ?? null, answer.selections);
    const label = this.stringifyAnswer(answer.label ?? null, answer.selections);

    if (!value && !label) {
      throw new BadRequestException('Cada respuesta debe incluir un valor.');
    }

    const questionId = this.normalizeQuestionId(answer.questionId);
    const questionText = this.toStringOrNull(answer.questionText);
    const order = typeof answer.order === 'number' && Number.isFinite(answer.order) ? answer.order : fallbackOrder;

    return {
      id_paciente: patientId,
      id_paciente_instrumento: assignment.id,
      id_instrumento: instrumentId,
      id_instrumento_tipo: instrumentTypeId,
      id_pregunta: questionId,
      pregunta: questionText,
      respuesta: value ?? label ?? '',
      competencia: label ?? null,
      fecha: timestamp,
      updated_at: timestamp,
      evaluado: 0,
      created_at: timestamp,
      guardado: saveOnly ? 1 : 0,
      id_criterio: null,
      id_tema: null,
      tipo_instrumento: instrumentTypeName ?? assignment.origen ?? null,
      tema: overrideTheme,
      topico: overrideTopic,
      orden: order,
    };
  }

  private stringifyAnswer(value?: string | null, selections?: string[] | null): string | null {
    if (Array.isArray(selections) && selections.length) {
      const normalizedSelections = selections
        .map((item) => this.toStringOrNull(item))
        .filter((item): item is string => Boolean(item));

      if (normalizedSelections.length) {
        return normalizedSelections.join(', ');
      }
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }

    return null;
  }

  private normalizeQuestionId(value: unknown): number | null {
    if (value === null || typeof value === 'undefined' || value === '') {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private mapInstrumentResponses(records: paciente_instrumento_respuesta[]): PatientInstrumentResponse[] {
    if (!records.length) {
      return [];
    }

    return records.map<PatientInstrumentResponse>((record) => ({
      id: record.id,
      patientId: record.id_paciente ?? null,
      patientInstrumentId: record.id_paciente_instrumento ?? null,
      instrumentId: record.id_instrumento ?? null,
      instrumentTypeId: record.id_instrumento_tipo ?? null,
      topicId: record.id_tema ?? null,
      criterionId: record.id_criterio ?? null,
      questionId: record.id_pregunta ?? null,
      theme: this.toStringOrNull(record.tema),
      topic: this.toStringOrNull(record.topico),
      question: this.toStringOrNull(record.pregunta),
      answer: this.toStringOrNull(record.respuesta),
      competence: this.toStringOrNull(record.competencia),
      type: this.toStringOrNull(record.tipo_instrumento),
      order: record.orden ?? null,
      saved: this.toBoolean(record.guardado),
      evaluated: this.toBoolean(record.evaluado),
      answerDate: this.toIso(record.fecha),
      createdAt: this.toIso(record.created_at),
      updatedAt: this.toIso(record.updated_at),
    }));
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
