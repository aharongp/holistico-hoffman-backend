import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePatientInstrumentDto } from './dto/create-patient-instrument.dto';
import { UpdatePatientInstrumentDto } from './dto/update-patient-instrument.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PatientInstrumentAssignment,
  PatientInstrumentResponse,
} from './entities/patient-instrument.entity';
import {
  AttitudinalStrengthResult,
  DailyReviewResult,
  HealthDiagnosticResult,
  PatientAggregatedResults,
  RegiflexEntry,
  RegiflexResult,
  TestResult,
  WheelResult,
} from './entities/patient-instrument-results.entity';
import {
  Prisma,
  paciente_instrumento,
  paciente_instrumento_respuesta,
} from '@prisma/client';
import {
  SubmitInstrumentAnswerDto,
  SubmitPatientInstrumentResponseDto,
} from './dto/submit-patient-instrument-response.dto';
import {
  buildAttitudinalSummary,
  buildCodependencyResult,
  colorValor,
  diagnosticoSalud,
  ponderacion,
  resultadoTest,
  revistaDiaria,
} from './utils/formulas.util';

@Injectable()
export class PatientInstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createPatientInstrumentDto: CreatePatientInstrumentDto,
  ): Promise<PatientInstrumentAssignment> {
    const patientId = this.normalizeNumber(
      (createPatientInstrumentDto as any).id_paciente ??
        (createPatientInstrumentDto as any).patientId,
    );
    if (patientId === null) {
      throw new BadRequestException(
        'Se requiere el identificador del paciente.',
      );
    }

    const instrumentTypeId = this.normalizeNumber(
      (createPatientInstrumentDto as any).id_instrumento_tipo ??
        (createPatientInstrumentDto as any).instrumentTypeId,
    );
    if (instrumentTypeId === null) {
      throw new BadRequestException('Se requiere el tipo de instrumento.');
    }

    await this.ensurePatientExists(patientId);
    await this.ensureInstrumentTypeExists(instrumentTypeId);

    const ribbonId = this.normalizeNumber(
      (createPatientInstrumentDto as any).id_cinta ??
        (createPatientInstrumentDto as any).ribbonId,
    );
    if (ribbonId !== null) {
      await this.ensureRibbonExists(ribbonId);
    }

    const hasAssignedAt = this.hasAnyKey(createPatientInstrumentDto, [
      'fecha_instrumento',
      'assignedAt',
    ]);
    const rawAssignedAt =
      (createPatientInstrumentDto as any).fecha_instrumento ??
      (createPatientInstrumentDto as any).assignedAt;
    const assignedAt = this.normalizeDate(rawAssignedAt);
    if (
      hasAssignedAt &&
      assignedAt === null &&
      rawAssignedAt !== null &&
      rawAssignedAt !== undefined &&
      rawAssignedAt !== ''
    ) {
      throw new BadRequestException('La fecha de asignación no es válida.');
    }

    const hasValidUntil = this.hasAnyKey(createPatientInstrumentDto, [
      'valido_hasta',
      'validUntil',
    ]);
    const rawValidUntil =
      (createPatientInstrumentDto as any).valido_hasta ??
      (createPatientInstrumentDto as any).validUntil;
    const validUntil = this.normalizeDate(rawValidUntil);
    if (
      hasValidUntil &&
      validUntil === null &&
      rawValidUntil !== null &&
      rawValidUntil !== undefined &&
      rawValidUntil !== ''
    ) {
      throw new BadRequestException('La fecha de vencimiento no es válida.');
    }

    const completedFlag = this.normalizeBoolean(
      (createPatientInstrumentDto as any).completado ??
        (createPatientInstrumentDto as any).completed,
    );
    if (
      this.hasAnyKey(createPatientInstrumentDto, ['completado', 'completed']) &&
      completedFlag === null
    ) {
      throw new BadRequestException('El indicador de completado no es válido.');
    }

    const evaluatedFlag = this.normalizeBoolean(
      (createPatientInstrumentDto as any).evaluado ??
        (createPatientInstrumentDto as any).evaluated,
    );
    if (
      this.hasAnyKey(createPatientInstrumentDto, ['evaluado', 'evaluated']) &&
      evaluatedFlag === null
    ) {
      throw new BadRequestException('El indicador de evaluación no es válido.');
    }

    let availability = this.normalizeAvailability(
      (createPatientInstrumentDto as any).disponible ??
        (createPatientInstrumentDto as any).available,
    );
    if (
      this.hasAnyKey(createPatientInstrumentDto, ['disponible', 'available']) &&
      availability === null
    ) {
      throw new BadRequestException(
        'El indicador de disponibilidad no es válido.',
      );
    }
    if (
      !this.hasAnyKey(createPatientInstrumentDto, ['disponible', 'available'])
    ) {
      availability = '1';
    }

    const origin = this.toStringOrNull(
      (createPatientInstrumentDto as any).origen ??
        (createPatientInstrumentDto as any).origin,
    );
    const userCreated = this.toStringOrNull(
      (createPatientInstrumentDto as any).user_created ??
        (createPatientInstrumentDto as any).userCreated,
    );
    const topics = this.serializeTopics(
      (createPatientInstrumentDto as any).array_tema ??
        (createPatientInstrumentDto as any).topics,
    );

    const now = new Date();

    const record = await this.prisma.paciente_instrumento.create({
      data: {
        id_paciente: patientId,
        id_instrumento_tipo: instrumentTypeId,
        fecha_instrumento: hasAssignedAt ? assignedAt : now,
        completado: completedFlag === null ? undefined : completedFlag ? 1 : 0,
        user_created: userCreated ?? undefined,
        created_at: now,
        updated_at: now,
        origen: origin ?? undefined,
        valido_hasta: hasValidUntil ? (validUntil ?? null) : undefined,
        evaluado: evaluatedFlag === null ? undefined : evaluatedFlag ? 1 : 0,
        array_tema: topics ?? undefined,
        disponible: availability ?? undefined,
        id_cinta: ribbonId ?? undefined,
      },
    });

    const [assignment] = await this.mapAssignments([record]);
    return assignment;
  }

  async findAll(): Promise<PatientInstrumentAssignment[]> {
    const records = await this.prisma.paciente_instrumento.findMany({
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
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

  async update(
    id: number,
    updatePatientInstrumentDto: UpdatePatientInstrumentDto,
  ): Promise<PatientInstrumentAssignment> {
    const existing = await this.prisma.paciente_instrumento.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Asignación de instrumento no encontrada');
    }

    const data: Prisma.paciente_instrumentoUpdateInput = {};

    if (
      this.hasAnyKey(updatePatientInstrumentDto, ['id_paciente', 'patientId'])
    ) {
      const patientId = this.normalizeNumber(
        (updatePatientInstrumentDto as any).id_paciente ??
          (updatePatientInstrumentDto as any).patientId,
      );
      if (patientId !== null) {
        await this.ensurePatientExists(patientId);
      }
      data.id_paciente = patientId;
    }

    if (
      this.hasAnyKey(updatePatientInstrumentDto, [
        'id_instrumento_tipo',
        'instrumentTypeId',
      ])
    ) {
      const instrumentTypeId = this.normalizeNumber(
        (updatePatientInstrumentDto as any).id_instrumento_tipo ??
          (updatePatientInstrumentDto as any).instrumentTypeId,
      );
      if (instrumentTypeId === null) {
        throw new BadRequestException('El tipo de instrumento no es válido.');
      }
      await this.ensureInstrumentTypeExists(instrumentTypeId);
      data.id_instrumento_tipo = instrumentTypeId;
    }

    if (
      this.hasAnyKey(updatePatientInstrumentDto, [
        'fecha_instrumento',
        'assignedAt',
      ])
    ) {
      const rawAssignedAt =
        (updatePatientInstrumentDto as any).fecha_instrumento ??
        (updatePatientInstrumentDto as any).assignedAt;
      const assignedAt = this.normalizeDate(rawAssignedAt);

      if (
        assignedAt === null &&
        rawAssignedAt !== null &&
        rawAssignedAt !== undefined &&
        rawAssignedAt !== ''
      ) {
        throw new BadRequestException('La fecha de asignación no es válida.');
      }

      data.fecha_instrumento = assignedAt;
    }

    if (
      this.hasAnyKey(updatePatientInstrumentDto, ['valido_hasta', 'validUntil'])
    ) {
      const rawValidUntil =
        (updatePatientInstrumentDto as any).valido_hasta ??
        (updatePatientInstrumentDto as any).validUntil;
      const validUntil = this.normalizeDate(rawValidUntil);

      if (
        validUntil === null &&
        rawValidUntil !== null &&
        rawValidUntil !== undefined &&
        rawValidUntil !== ''
      ) {
        throw new BadRequestException('La fecha de vencimiento no es válida.');
      }

      data.valido_hasta = validUntil;
    }

    if (
      this.hasAnyKey(updatePatientInstrumentDto, ['completado', 'completed'])
    ) {
      const completedFlag = this.normalizeBoolean(
        (updatePatientInstrumentDto as any).completado ??
          (updatePatientInstrumentDto as any).completed,
      );
      if (completedFlag === null) {
        data.completado = null;
      } else {
        data.completado = completedFlag ? 1 : 0;
      }
    }

    if (this.hasAnyKey(updatePatientInstrumentDto, ['evaluado', 'evaluated'])) {
      const evaluatedFlag = this.normalizeBoolean(
        (updatePatientInstrumentDto as any).evaluado ??
          (updatePatientInstrumentDto as any).evaluated,
      );
      if (evaluatedFlag === null) {
        data.evaluado = null;
      } else {
        data.evaluado = evaluatedFlag ? 1 : 0;
      }
    }

    if (
      this.hasAnyKey(updatePatientInstrumentDto, ['disponible', 'available'])
    ) {
      const availability = this.normalizeAvailability(
        (updatePatientInstrumentDto as any).disponible ??
          (updatePatientInstrumentDto as any).available,
      );
      if (availability === null) {
        data.disponible = null;
      } else {
        data.disponible = availability;
      }
    }

    if (this.hasAnyKey(updatePatientInstrumentDto, ['origen', 'origin'])) {
      data.origen = this.toStringOrNull(
        (updatePatientInstrumentDto as any).origen ??
          (updatePatientInstrumentDto as any).origin,
      );
    }

    if (
      this.hasAnyKey(updatePatientInstrumentDto, [
        'user_created',
        'userCreated',
      ])
    ) {
      data.user_created = this.toStringOrNull(
        (updatePatientInstrumentDto as any).user_created ??
          (updatePatientInstrumentDto as any).userCreated,
      );
    }

    if (this.hasAnyKey(updatePatientInstrumentDto, ['array_tema', 'topics'])) {
      data.array_tema = this.serializeTopics(
        (updatePatientInstrumentDto as any).array_tema ??
          (updatePatientInstrumentDto as any).topics,
      );
    }

    if (this.hasAnyKey(updatePatientInstrumentDto, ['id_cinta', 'ribbonId'])) {
      const ribbonId = this.normalizeNumber(
        (updatePatientInstrumentDto as any).id_cinta ??
          (updatePatientInstrumentDto as any).ribbonId,
      );
      if (ribbonId !== null) {
        await this.ensureRibbonExists(ribbonId);
      }
      data.id_cinta = ribbonId;
    }

    if (Object.keys(data).length === 0) {
      const [assignment] = await this.mapAssignments([existing]);
      return assignment;
    }

    data.updated_at = new Date();

    const updated = await this.prisma.paciente_instrumento.update({
      where: { id },
      data,
    });

    const [assignment] = await this.mapAssignments([updated]);
    return assignment;
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.paciente_instrumento.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Asignación de instrumento no encontrada');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paciente_instrumento_respuesta.deleteMany({
        where: { id_paciente_instrumento: id },
      });
      await tx.paciente_instrumento.delete({ where: { id } });
    });

    return { deleted: true };
  }

  async findByPatient(
    patientId: number,
  ): Promise<PatientInstrumentAssignment[]> {
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

  async findResponsesByPatient(
    patientId: number,
  ): Promise<PatientInstrumentResponse[]> {
    await this.ensurePatientExists(patientId);

    const records = await this.prisma.paciente_instrumento_respuesta.findMany({
      where: { id_paciente: patientId },
      orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }, { id: 'desc' }],
    });

    return this.mapInstrumentResponses(records);
  }

  async findResponsesByUser(
    userId: number,
  ): Promise<PatientInstrumentResponse[]> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.findResponsesByPatient(patientId);
  }

  async findAggregatedResultsByPatient(
    patientId: number,
  ): Promise<PatientAggregatedResults> {
    await this.ensurePatientExists(patientId);

    const patient = await this.prisma.paciente.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        fecha_nacimiento: true,
        interno: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const patientAge = this.calculateAge(patient.fecha_nacimiento ?? null);
    const dailyInstrumentTopicId = patient.interno === 1 ? 64 : 63;
    const dailyInstrument = await this.prisma.instrumento.findFirst({
      where: { id_tema: dailyInstrumentTopicId },
      select: { id: true },
    });
    const dailyInstrumentId = dailyInstrument?.id ?? null;

    const strengthsRaw = await this.prisma.$queryRaw<
      Array<{
        tema: string | null;
        id_tema: number | null;
        suma: number | null;
        cantidad: number | null;
      }>
    >`
      SELECT
        tema,
        id_tema,
        SUM(CAST(respuesta AS DOUBLE PRECISION)) AS suma,
        COUNT(*) AS cantidad
      FROM paciente_instrumento_respuesta
      WHERE id_paciente = ${patientId} AND id_criterio = 3 AND evaluado = 0
      GROUP BY tema, id_tema
      ORDER BY tema
    `;

    const strengths: AttitudinalStrengthResult[] = strengthsRaw
      .map((row) => {
        const sum = this.toNumeric(row.suma);
        const count = this.toNumeric(row.cantidad);
        if (!count) {
          return null;
        }

        const average = sum / count;
        const percentage = Math.min(Math.max(average * 20, 0), 100);

        return {
          topicId: row.id_tema ?? null,
          topic: row.tema ?? null,
          sum: Number(sum.toFixed(2)),
          questionCount: count,
          average: Number(average.toFixed(2)),
          percentage: Number(percentage.toFixed(2)),
          colorClass: colorValor(average),
          ponderation: ponderacion(percentage),
        } satisfies AttitudinalStrengthResult;
      })
      .filter((item): item is AttitudinalStrengthResult => Boolean(item));

    const attitudinalSummary = buildAttitudinalSummary(strengths);

    const diagnosticsRaw = await this.prisma.$queryRaw<
      Array<{ topico: string | null; id: number | null; suma: number | null }>
    >`
      SELECT
        t.nombre AS topico,
        t.id AS id,
        SUM(CAST(p.respuesta AS INTEGER)) AS suma
      FROM paciente_instrumento_respuesta p
      INNER JOIN pregunta q ON p.id_pregunta = q.id
      INNER JOIN topico t ON q.id_topico = t.id
      WHERE p.id_paciente = ${patientId} AND p.tipo_instrumento = 'diagnostico-salud'
        AND p.evaluado = 0
      GROUP BY t.nombre, t.id
      ORDER BY t.nombre
    `;

    const diagnostics: HealthDiagnosticResult[] = diagnosticsRaw.map((row) => {
      const result = diagnosticoSalud(
        row.id ?? null,
        row.topico ?? null,
        this.toNumeric(row.suma),
      );
      return {
        ...result,
        diagnostic: row.topico ?? result.diagnostic,
        total: Number(result.total.toFixed(2)),
      } satisfies HealthDiagnosticResult;
    });

    const stressSum = await this.sumNumericResponses({
      id_paciente: patientId,
      tipo_instrumento: 'test-estres',
      evaluado: 0,
    });
    const healthSum = await this.sumNumericResponses(
      {
        id_paciente: patientId,
        tipo_instrumento: 'test-salud',
        id_tema: 55,
        evaluado: 0,
      },
      { min: 0, max: 100 },
    );
    const biologicalAgeSum = await this.sumNumericResponses({
      id_paciente: patientId,
      tipo_instrumento: 'test-biologica',
      evaluado: 0,
    });
    const codependencySum = await this.sumNumericResponses({
      id_paciente: patientId,
      tipo_instrumento: 'test-codependencia',
      evaluado: 0,
    });

    const tests: Record<string, TestResult | null> = {
      stress:
        stressSum !== null
          ? resultadoTest({
              edad: patientAge,
              test: 'estres',
              valor: stressSum,
            })
          : null,
      health:
        healthSum !== null
          ? resultadoTest({ edad: patientAge, test: 'salud', valor: healthSum })
          : null,
      biologicalAge:
        biologicalAgeSum !== null
          ? resultadoTest({
              edad: patientAge,
              test: 'edad-biologica',
              valor: biologicalAgeSum,
            })
          : null,
      codependency:
        codependencySum !== null
          ? buildCodependencyResult(codependencySum)
          : null,
    };

    const wheelOfLifeRaw = await this.prisma.$queryRaw<
      Array<{ topic: string | null; promedio: number | null }>
    >`
      SELECT
        t.nombre AS topic,
        AVG(CAST(p.respuesta AS DOUBLE PRECISION)) AS promedio
      FROM paciente_instrumento_respuesta p
      INNER JOIN pregunta q ON p.id_pregunta = q.id
      INNER JOIN topico t ON q.id_topico = t.id
      WHERE p.id_paciente = ${patientId}
        AND p.tipo_instrumento = 'rueda-vida'
        AND p.evaluado = 0
      GROUP BY t.nombre
      ORDER BY t.nombre
    `;

    const wheelOfLife: WheelResult[] = wheelOfLifeRaw.map((row) => {
      const average = this.toNumeric(row.promedio);
      return {
        topic: row.topic ?? null,
        average: Number(average.toFixed(2)),
      } satisfies WheelResult;
    });

    const wheelOfHealthRaw = await this.prisma.$queryRaw<
      Array<{ topic: string | null; promedio: number | null }>
    >`
      SELECT
        t.nombre AS topic,
        AVG(CAST(p.respuesta AS DOUBLE PRECISION)) AS promedio
      FROM paciente_instrumento_respuesta p
      INNER JOIN pregunta q ON p.id_pregunta = q.id
      INNER JOIN topico t ON q.id_topico = t.id
      WHERE p.id_paciente = ${patientId}
        AND p.tipo_instrumento = 'rueda-salud'
        AND p.evaluado = 0
      GROUP BY t.nombre
      ORDER BY t.nombre
    `;

    const wheelOfHealth: WheelResult[] = wheelOfHealthRaw.map((row) => {
      const average = this.toNumeric(row.promedio);
      return {
        topic: row.topic ?? null,
        average: Number(average.toFixed(2)),
      } satisfies WheelResult;
    });

    const regiflexRaw = await this.prisma.$queryRaw<
      Array<{
        respuesta: string | null;
        topico: string | null;
        suma: number | null;
      }>
    >`
      SELECT
        p.respuesta,
        CASE p.respuesta WHEN '1' THEN 'FLEXIRIGI' ELSE 'RIGIFLEX' END AS topico,
        SUM(CAST(p.respuesta AS DOUBLE PRECISION)) AS suma
      FROM paciente_instrumento_respuesta p
      WHERE p.id_paciente = ${patientId}
        AND p.tipo_instrumento = 'regiflex-flexirigi'
        AND p.evaluado = 0
        AND p.id_tema = 132
      GROUP BY p.respuesta
      ORDER BY p.respuesta
    `;

    const regiflexEntries = regiflexRaw.reduce<RegiflexEntry[]>((acc, row) => {
      if (!row.topico) {
        return acc;
      }

      const sum = this.toNumeric(row.suma);
      acc.push({
        topic: row.topico,
        sum: Number(sum.toFixed(2)),
      });
      return acc;
    }, []);

    const regiflexPredominant = regiflexEntries.reduce<RegiflexEntry | null>(
      (carry, current) => {
        if (!carry || current.sum > carry.sum) {
          return current;
        }
        return carry;
      },
      null,
    );

    const regiflex: RegiflexResult | null = regiflexEntries.length
      ? {
          entries: regiflexEntries,
          predominant: regiflexPredominant?.topic ?? null,
        }
      : null;

    const dailyRaw = dailyInstrumentId
      ? await this.prisma.$queryRaw<
          Array<{
            id_topico: number | null;
            topico: string | null;
            promedio: number | null;
          }>
        >`
          SELECT
            t.id AS id_topico,
            t.nombre AS topico,
            AVG(CAST(p.respuesta AS DOUBLE PRECISION)) AS promedio
          FROM paciente_instrumento_respuesta p
          INNER JOIN pregunta q ON p.id_pregunta = q.id
          INNER JOIN topico t ON q.id_topico = t.id
          WHERE p.id_paciente = ${patientId}
            AND p.tipo_instrumento IN ('revista-diaria-interno', 'revista-diaria-externo')
            AND p.id_instrumento = ${dailyInstrumentId}
            AND p.evaluado = 0
          GROUP BY t.id, t.nombre
          ORDER BY t.nombre
        `
      : [];

    const dailyReview: DailyReviewResult[] = dailyRaw.map((row) => {
      const base = revistaDiaria(row.promedio ?? 0, row.id_topico ?? null);
      return {
        ...base,
        topicId: row.id_topico ?? base.topicId,
        topic: row.topico ?? base.topic,
        average: Number((row.promedio ?? 0).toFixed(2)),
      } satisfies DailyReviewResult;
    });

    return {
      attitudinal: {
        strengths,
        summary: attitudinalSummary,
      },
      health: {
        diagnostics,
        tests,
      },
      dailyReview,
      wellness: {
        wheelOfLife,
        wheelOfHealth,
        regiflex,
      },
    } satisfies PatientAggregatedResults;
  }

  async findAggregatedResultsByUser(
    userId: number,
  ): Promise<PatientAggregatedResults> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.findAggregatedResultsByPatient(patientId);
  }

  async submitResponses(
    patientInstrumentId: number,
    dto: SubmitPatientInstrumentResponseDto,
  ): Promise<PatientInstrumentResponse[]> {
    const assignment = await this.prisma.paciente_instrumento.findUnique({
      where: { id: patientInstrumentId },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación de instrumento no encontrada');
    }

    if (!dto.answers || dto.answers.length === 0) {
      throw new BadRequestException(
        'Se requiere al menos una respuesta para guardar el instrumento',
      );
    }

    const resolvedPatientId = assignment.id_paciente ?? dto.patientId ?? null;
    if (!resolvedPatientId) {
      throw new BadRequestException(
        'No se pudo determinar el paciente asociado a la asignación.',
      );
    }

    const resolvedInstrumentTypeId =
      assignment.id_instrumento_tipo ?? dto.instrumentTypeId ?? null;
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

      const shouldMarkCompleted = dto.saveOnly
        ? false
        : dto.markAsCompleted !== false;

      await tx.paciente_instrumento.update({
        where: { id: patientInstrumentId },
        data: {
          completado: shouldMarkCompleted ? 1 : (assignment.completado ?? 0),
          updated_at: now,
          disponible: shouldMarkCompleted
            ? '0'
            : (assignment.disponible ?? null),
        },
      });
    });

    const savedRecords =
      await this.prisma.paciente_instrumento_respuesta.findMany({
        where: { id_paciente_instrumento: patientInstrumentId },
        orderBy: [{ orden: 'asc' }, { id: 'asc' }],
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

  private async ensureInstrumentTypeExists(
    instrumentTypeId: number,
  ): Promise<void> {
    const instrumentType = await this.prisma.instrumento_tipo.findUnique({
      where: { id: instrumentTypeId },
      select: { id: true },
    });

    if (!instrumentType) {
      throw new NotFoundException('Tipo de instrumento no encontrado');
    }
  }

  private async ensureRibbonExists(ribbonId: number): Promise<void> {
    const ribbon = await this.prisma.cinta.findUnique({
      where: { id: ribbonId },
      select: { id: true },
    });

    if (!ribbon) {
      throw new NotFoundException('Cinta no encontrada');
    }
  }

  private hasAnyKey(source: unknown, keys: string[]): boolean {
    if (!source || typeof source !== 'object') {
      return false;
    }

    return keys.some((key) =>
      Object.prototype.hasOwnProperty.call(source, key),
    );
  }

  private normalizeNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.trunc(value);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const numeric = Number(trimmed);
      return Number.isFinite(numeric) ? Math.trunc(numeric) : null;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    return null;
  }

  private normalizeDate(value: unknown): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private normalizeBoolean(value: unknown): boolean | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        return null;
      }
      return value !== 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        return null;
      }

      if (['1', 'true', 't', 'yes', 'y', 'si', 'on'].includes(normalized)) {
        return true;
      }

      if (['0', 'false', 'f', 'no', 'n', 'off'].includes(normalized)) {
        return false;
      }

      return null;
    }

    return null;
  }

  private normalizeAvailability(value: unknown): string | null {
    const flag = this.normalizeBoolean(value);
    if (flag === null) {
      return null;
    }

    return flag ? '1' : '0';
  }

  private async resolvePatientIdByUser(userId: number): Promise<number> {
    const patient = await this.prisma.paciente.findFirst({
      where: { id_usuario: userId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException(
        'Paciente no encontrado para el usuario proporcionado',
      );
    }

    return patient.id;
  }

  private async mapAssignments(
    records: paciente_instrumento[],
  ): Promise<PatientInstrumentAssignment[]> {
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

    const instrumentTypeMap = new Map<
      number,
      { nombre: string | null; descripcion: string | null }
    >(
      instrumentTypes.map((type) => [
        type.id,
        { nombre: type.nombre ?? null, descripcion: type.descripcion ?? null },
      ]),
    );

    return records.map<PatientInstrumentAssignment>((record) => {
      const typeInfo = record.id_instrumento_tipo
        ? (instrumentTypeMap.get(record.id_instrumento_tipo) ?? null)
        : null;

      return {
        id: record.id,
        patientId: record.id_paciente ?? null,
        instrumentTypeId: record.id_instrumento_tipo ?? null,
        instrumentTypeName: typeInfo?.nombre ?? null,
        instrumentTypeDescription: typeInfo?.descripcion ?? null,
        assignedAt:
          this.toIso(record.fecha_instrumento) ?? this.toIso(record.created_at),
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
    const {
      answer,
      assignment,
      patientId,
      instrumentId,
      instrumentTypeId,
      fallbackOrder,
      timestamp,
      saveOnly,
      overrideTheme,
      overrideTopic,
      instrumentTypeName,
    } = params;

    const value = this.stringifyAnswer(
      answer.value ?? answer.rawValue ?? null,
      answer.selections,
    );
    const label = this.stringifyAnswer(answer.label ?? null, answer.selections);

    if (!value && !label) {
      throw new BadRequestException('Cada respuesta debe incluir un valor.');
    }

    const questionId = this.normalizeQuestionId(answer.questionId);
    const questionText = this.toStringOrNull(answer.questionText);
    const order =
      typeof answer.order === 'number' && Number.isFinite(answer.order)
        ? answer.order
        : fallbackOrder;

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

  private stringifyAnswer(
    value?: string | null,
    selections?: string[] | null,
  ): string | null {
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

  private mapInstrumentResponses(
    records: paciente_instrumento_respuesta[],
  ): PatientInstrumentResponse[] {
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

  private calculateAge(birthDate: Date | null): number | null {
    if (!birthDate) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  private async sumNumericResponses(
    where: Prisma.paciente_instrumento_respuestaWhereInput,
    options?: { min?: number; max?: number },
  ): Promise<number | null> {
    const rows = await this.prisma.paciente_instrumento_respuesta.findMany({
      where,
      select: { respuesta: true },
    });

    if (!rows.length) {
      return null;
    }

    let total = 0;
    let hasNumericValue = false;
    const min = options?.min;
    const max = options?.max;

    rows.forEach((row) => {
      const numeric = this.parseNumeric(row.respuesta);
      if (numeric === null) {
        return;
      }

      if (min !== undefined && numeric < min) {
        return;
      }

      if (max !== undefined && numeric > max) {
        return;
      }

      total += numeric;
      hasNumericValue = true;
    });

    if (!hasNumericValue || !Number.isFinite(total)) {
      return null;
    }

    return Number(total.toFixed(2));
  }

  private parseNumeric(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.toString().replace(',', '.');
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private toNumeric(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    try {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    } catch {
      return 0;
    }
  }

  private serializeTopics(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (Array.isArray(value)) {
      const normalized = value
        .map((item) => this.toStringOrNull(item))
        .filter((item): item is string => Boolean(item));

      return normalized.length ? JSON.stringify(normalized) : null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }

    return this.toStringOrNull(value);
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
          .map((item) =>
            item === null || item === undefined ? null : item.toString().trim(),
          )
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
