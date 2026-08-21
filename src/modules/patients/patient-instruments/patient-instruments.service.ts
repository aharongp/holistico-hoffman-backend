import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateBulkPatientInstrumentDto } from './dto/create-bulk-patient-instrument.dto';
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
  HealthDiagnosticResponse,
  FirmnessAdaptabilityResult,
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
import { MailService } from 'src/modules/mail/mail.service';

const WHEEL_OF_LIFE_TOPIC_GROUPS = [
  { label: 'FAMILIA', topicIds: [122, 163, 58, 225] },
  {
    label: 'SALUD',
    topicIds: [
      35, 53, 54, 46, 47, 62, 56, 57, 70, 55, 65, 66, 67, 51, 52, 63, 64, 69,
      87, 82, 83, 92, 123, 93, 99, 119, 120, 124, 158, 159, 228,
    ],
  },
  { label: 'MANUTENCION', topicIds: [68, 88, 98, 116, 105, 108] },
  { label: 'AMIGOS', topicIds: [45, 223] },
  { label: 'RECREACION', topicIds: [73, 226] },
  {
    label: 'COMUNICACIÓN',
    topicIds: [15, 16, 133, 121, 91, 78, 80, 28, 36, 37],
  },
  { label: 'ESTUDIOS', topicIds: [31, 48, 49, 42, 43, 102, 109, 125, 134, 135, 147] },
  { label: 'FINANZAS', topicIds: [26, 224] },
  { label: 'NEGOCIOS', topicIds: [161] },
  {
    label: 'ESPIRITUALIDAD',
    topicIds: [128, 79, 113, 114, 115, 117, 127, 131, 126, 151, 162, 227],
  },
  { label: 'SEGURIDAD', topicIds: [95] },
  { label: 'ORGANIZACIÓN', topicIds: [10, 140, 86, 50, 22, 153, 157, 229] },
  { label: 'JUSTICIA', topicIds: [12, 138, 142, 144, 154] },
  {
    label: 'CRECIMIENTO PERSONAL',
    topicIds: [
      38, 39, 72, 61, 19, 156, 20, 155, 84, 89, 75, 130, 77, 94, 74, 132, 139,
      160, 96, 146, 110, 101, 103, 104, 11, 141, 148, 13, 14, 143, 17, 18, 24,
      25, 145, 149, 222,
    ],
  },
] as const;

const WHEEL_OF_LIFE_TOPICS = WHEEL_OF_LIFE_TOPIC_GROUPS.map(
  (group) => group.label,
);

const WHEEL_OF_LIFE_TOPIC_IDS = WHEEL_OF_LIFE_TOPIC_GROUPS.flatMap(
  (group) => group.topicIds,
);

const WHEEL_OF_LIFE_TOPIC_ID_TO_LABEL = new Map<number, string>(
  WHEEL_OF_LIFE_TOPIC_GROUPS.flatMap((group) =>
    group.topicIds.map((topicId) => [topicId, group.label] as const),
  ),
);

const WHEEL_OF_LIFE_TOPIC_ALIASES: Record<string, string> = {
  'autoestima y valoracion': 'CRECIMIENTO PERSONAL',
  'desarrollo espititual': 'ESPIRITUALIDAD',
  'desarrollo espiritual': 'ESPIRITUALIDAD',
  'desarrollo profesional y dinero': 'FINANZAS',
  'familia y relaciones interpersonales': 'FAMILIA',
  'hobbies y recreacion': 'RECREACION',
  'cantidad vs calidad de tiempo': 'ORGANIZACIÓN',
  'salud fisica': 'SALUD',
  'pareja y sexo': 'AMIGOS',
  'comunicacion': 'COMUNICACIÓN',
  'organizacion': 'ORGANIZACIÓN',
  'crecimiento personal': 'CRECIMIENTO PERSONAL',
  'finanzas': 'FINANZAS',
  'negocios': 'NEGOCIOS',
  'seguridad': 'SEGURIDAD',
  'justicia': 'JUSTICIA',
  'estudios': 'ESTUDIOS',
  'amigos': 'AMIGOS',
  'familia': 'FAMILIA',
  'salud': 'SALUD',
  'recreacion': 'RECREACION',
  'espiritualidad': 'ESPIRITUALIDAD',
  'manutencion': 'MANUTENCION',
};

export type AggregatedResultsDateOptions = {
  attitudinalDate?: string | null;
  firmnessAdaptabilityDate?: string | null;
  diagnosticsDate?: string | null;
  testsDate?: string | null;
  dailyReviewDate?: string | null;
  wellnessLifeDate?: string | null;
  wellnessHealthDate?: string | null;
  wellnessRegiflexDate?: string | null;
};

export type BulkAssignmentItemResult = {
  patientId: number | null;
  instrumentTypeId: number | null;
  status: 'created' | 'failed';
  assignmentId?: number;
  error?: string;
};

export type BulkAssignmentResult = {
  requestedPairs: number;
  createdCount: number;
  failedCount: number;
  results: BulkAssignmentItemResult[];
};

@Injectable()
export class PatientInstrumentsService {
  private readonly logger = new Logger(PatientInstrumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

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

    if (assignment) {
      void this.dispatchAssignmentEmail(assignment);
    }

    return assignment;
  }

  private normalizeWheelTopic(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private resolveWheelOfLifeTopic(value: string): string | null {
    const normalizedValue = this.normalizeWheelTopic(value);
    if (!normalizedValue) {
      return null;
    }

    return (
      WHEEL_OF_LIFE_TOPIC_ALIASES[normalizedValue] ??
      WHEEL_OF_LIFE_TOPICS.find(
        (topic) => this.normalizeWheelTopic(topic) === normalizedValue,
      ) ??
      null
    );
  }

  private resolveWheelOfLifeGroup(
    topicId: number | null,
    topicName: string | null,
  ): string | null {
    if (topicId !== null) {
      const resolvedById = WHEEL_OF_LIFE_TOPIC_ID_TO_LABEL.get(topicId);
      if (resolvedById) {
        return resolvedById;
      }
    }

    if (topicName) {
      return this.resolveWheelOfLifeTopic(topicName);
    }

    return null;
  }

  async createBulk(
    createBulkPatientInstrumentDto: CreateBulkPatientInstrumentDto,
  ): Promise<BulkAssignmentResult> {
    const patientIds = Array.isArray(createBulkPatientInstrumentDto.patientIds)
      ? createBulkPatientInstrumentDto.patientIds
      : [];
    const instrumentTypeIds = Array.isArray(
      createBulkPatientInstrumentDto.instrumentTypeIds,
    )
      ? createBulkPatientInstrumentDto.instrumentTypeIds
      : [];

    if (!patientIds.length) {
      throw new BadRequestException(
        'Debes seleccionar al menos un paciente para la asignación por lote.',
      );
    }

    if (!instrumentTypeIds.length) {
      throw new BadRequestException(
        'Debes seleccionar al menos un tipo de instrumento para la asignación por lote.',
      );
    }

    const results: BulkAssignmentItemResult[] = [];

    for (const rawPatientId of patientIds) {
      const patientId = this.normalizeNumber(rawPatientId);

      for (const rawInstrumentTypeId of instrumentTypeIds) {
        const instrumentTypeId = this.normalizeNumber(rawInstrumentTypeId);

        if (patientId === null || instrumentTypeId === null) {
          results.push({
            patientId,
            instrumentTypeId,
            status: 'failed',
            error: 'Identificador de paciente o tipo de instrumento inválido.',
          });
          continue;
        }

        const payload: CreatePatientInstrumentDto = {
          id_paciente: patientId,
          id_instrumento_tipo: instrumentTypeId,
        };

        // Only forward optional fields that were actually sent in the bulk payload.
        if (
          this.hasAnyKey(createBulkPatientInstrumentDto, [
            'fecha_instrumento',
            'assignedAt',
          ])
        ) {
          payload.fecha_instrumento =
            (createBulkPatientInstrumentDto as any).fecha_instrumento ??
            (createBulkPatientInstrumentDto as any).assignedAt;
        }

        if (
          this.hasAnyKey(createBulkPatientInstrumentDto, [
            'valido_hasta',
            'validUntil',
          ])
        ) {
          payload.valido_hasta =
            (createBulkPatientInstrumentDto as any).valido_hasta ??
            (createBulkPatientInstrumentDto as any).validUntil;
        }

        if (
          this.hasAnyKey(createBulkPatientInstrumentDto, [
            'disponible',
            'available',
          ])
        ) {
          payload.disponible =
            (createBulkPatientInstrumentDto as any).disponible ??
            (createBulkPatientInstrumentDto as any).available;
        }

        if (this.hasAnyKey(createBulkPatientInstrumentDto, ['origen', 'origin'])) {
          payload.origen =
            (createBulkPatientInstrumentDto as any).origen ??
            (createBulkPatientInstrumentDto as any).origin;
        }

        if (
          this.hasAnyKey(createBulkPatientInstrumentDto, ['array_tema', 'topics'])
        ) {
          payload.array_tema =
            (createBulkPatientInstrumentDto as any).array_tema ??
            (createBulkPatientInstrumentDto as any).topics;
        }

        if (
          this.hasAnyKey(createBulkPatientInstrumentDto, [
            'user_created',
            'userCreated',
          ])
        ) {
          payload.user_created =
            (createBulkPatientInstrumentDto as any).user_created ??
            (createBulkPatientInstrumentDto as any).userCreated;
        }

        if (this.hasAnyKey(createBulkPatientInstrumentDto, ['id_cinta', 'ribbonId'])) {
          payload.id_cinta =
            (createBulkPatientInstrumentDto as any).id_cinta ??
            (createBulkPatientInstrumentDto as any).ribbonId;
        }

        try {
          const assignment = await this.create(payload);
          results.push({
            patientId,
            instrumentTypeId,
            status: 'created',
            assignmentId: assignment.id,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Error inesperado al crear la asignación.';
          results.push({
            patientId,
            instrumentTypeId,
            status: 'failed',
            error: message,
          });
        }
      }
    }

    const createdCount = results.filter((item) => item.status === 'created').length;
    const failedCount = results.length - createdCount;

    return {
      requestedPairs: patientIds.length * instrumentTypeIds.length,
      createdCount,
      failedCount,
      results,
    };
  }

  private async dispatchAssignmentEmail(
    assignment: PatientInstrumentAssignment,
  ): Promise<void> {
    if (!assignment.patientId) {
      return;
    }

    try {
      const patient = await this.prisma.paciente.findUnique({
        where: { id: assignment.patientId },
        select: {
          id: true,
          nombres: true,
          apellidos: true,
          contacto: true,
          contacto_correo: true,
          id_usuario: true,
        },
      });

      if (!patient) {
        this.logger.warn(
          `Paciente ${assignment.patientId} no encontrado al preparar el correo de asignación ${assignment.id}.`,
        );
        return;
      }

      let targetEmail = this.normalizeEmail(patient.contacto_correo);
      let fallbackName =
        this.composeFullName(patient.nombres, patient.apellidos) ??
        this.toStringOrNull(patient.contacto);
      let userName: string | null = null;

      if ((!targetEmail || !fallbackName) && patient.id_usuario) {
        const user = await this.prisma.usuario.findUnique({
          where: { id: patient.id_usuario },
          select: {
            email: true,
            username: true,
          },
        });

        if (user) {
          if (!targetEmail) {
            targetEmail = this.normalizeEmail(user.email);
          }
          if (!fallbackName) {
            userName = this.toStringOrNull(user.username);
          }
        }
      }

      if (!targetEmail) {
        this.logger.warn(
          `No se envió correo para la asignación ${assignment.id} porque el paciente ${assignment.patientId} no tiene correo registrado.`,
        );
        return;
      }

      const patientName =
        this.composeFullName(patient.nombres, patient.apellidos) ??
        this.toStringOrNull(patient.contacto) ??
        userName ??
        'Paciente';

      const instrumentName =
        this.toStringOrNull(assignment.instrumentTypeName) ??
        'instrumento asignado';

      const sent = await this.mailService.sendInstrumentAssignmentEmail({
        to: targetEmail,
        patientName,
        instrumentName,
        assignedAt: assignment.assignedAt,
        validUntil: assignment.validUntil,
      });

      if (!sent) {
        this.logger.warn(
          `El correo para la asignación ${assignment.id} dirigido a ${targetEmail} no pudo enviarse.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al enviar notificación de instrumento asignado ${assignment.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
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
    options?: AggregatedResultsDateOptions,
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

    const [
      attitudinalDates,
      diagnosticsDates,
      testsDates,
      firmnessAdaptabilityDates,
      dailyReviewDates,
      wellnessLifeDates,
      wellnessHealthDates,
      wellnessRegiflexDates,
    ] = await Promise.all([
      this.collectAvailableDates({
        id_paciente: patientId,
        id_criterio: 3,
        evaluado: 0,
      }),
      this.collectAvailableDates({
        id_paciente: patientId,
        tipo_instrumento: 'diagnostico-salud',
        evaluado: 0,
      }),
      this.collectAvailableDates({
        id_paciente: patientId,
        tipo_instrumento: {
          in: [
            'test-estres',
            'test-salud',
            'test-biologica',
            'test-codependencia',
          ],
        },
        evaluado: 0,
      }),
      this.collectAvailableDates({
        id_paciente: patientId,
        tipo_instrumento: 'test-salud',
        id_tema: 139,
        evaluado: 0,
      }),
      this.collectAvailableDates({
        id_paciente: patientId,
        tipo_instrumento: {
          in: ['revista-diaria-interno', 'revista-diaria-externo'],
        },
        evaluado: 0,
        ...(dailyInstrumentId ? { id_instrumento: dailyInstrumentId } : {}),
      }),
      this.collectAvailableDates({
        id_paciente: patientId,
        tipo_instrumento: 'rueda-vida',
        evaluado: 0,
      }),
      this.collectAvailableDates({
        id_paciente: patientId,
        tipo_instrumento: 'rueda-salud',
        evaluado: 0,
      }),
      this.collectAvailableDates({
        id_paciente: patientId,
        tipo_instrumento: 'regiflex-flexirigi',
        id_tema: 132,
        evaluado: 0,
      }),
    ]);

    const attitudinalSelected = this.resolveSelectedSectionDate(
      options?.attitudinalDate ?? null,
      attitudinalDates,
    );
    const diagnosticsSelected = this.resolveSelectedSectionDate(
      options?.diagnosticsDate ?? null,
      diagnosticsDates,
    );
    const testsSelected = this.resolveSelectedSectionDate(
      options?.testsDate ?? null,
      testsDates,
    );
    const firmnessAdaptabilitySelected = this.resolveSelectedSectionDate(
      options?.firmnessAdaptabilityDate ?? null,
      firmnessAdaptabilityDates,
    );
    const dailyReviewSelected = this.resolveSelectedSectionDate(
      options?.dailyReviewDate ?? null,
      dailyReviewDates,
    );
    const wellnessLifeSelected = this.resolveSelectedSectionDate(
      options?.wellnessLifeDate ?? null,
      wellnessLifeDates,
    );
    const wellnessHealthSelected = this.resolveSelectedSectionDate(
      options?.wellnessHealthDate ?? null,
      wellnessHealthDates,
    );
    const wellnessRegiflexSelected = this.resolveSelectedSectionDate(
      options?.wellnessRegiflexDate ?? null,
      wellnessRegiflexDates,
    );

    const diagnosticsRange = diagnosticsSelected
      ? this.buildDateRange(diagnosticsSelected)
      : null;
    const testsRange = testsSelected ? this.buildDateRange(testsSelected) : null;
    const firmnessAdaptabilityRange = firmnessAdaptabilitySelected
      ? this.buildDateRange(firmnessAdaptabilitySelected)
      : null;
    const dailyReviewRange = dailyReviewSelected
      ? this.buildDateRange(dailyReviewSelected)
      : null;
    const wellnessLifeRange = wellnessLifeSelected
      ? this.buildDateRange(wellnessLifeSelected)
      : null;
    const wellnessHealthRange = wellnessHealthSelected
      ? this.buildDateRange(wellnessHealthSelected)
      : null;
    const wellnessRegiflexRange = wellnessRegiflexSelected
      ? this.buildDateRange(wellnessRegiflexSelected)
      : null;

    const diagnosticsFilter = this.buildDateFilter(diagnosticsRange, 'p');
    const firmnessAdaptabilityFilter = this.buildDateFilter(
      firmnessAdaptabilityRange,
      'p',
    );
    const dailyFilter = this.buildDateFilter(dailyReviewRange, 'p');
    const wellnessLifeFilter = this.buildDateFilter(wellnessLifeRange, 'p');
    const wellnessHealthFilter = this.buildDateFilter(wellnessHealthRange, 'p');
    const wellnessRegiflexFilter = this.buildDateFilter(
      wellnessRegiflexRange,
      'p',
    );

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

    const mapStrengthRows = (
      rows: Array<{
        tema: string | null;
        id_tema: number | null;
        suma: number | null;
        cantidad: number | null;
      }>,
    ): AttitudinalStrengthResult[] =>
      rows
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

    const attitudinalStrengths = mapStrengthRows(strengthsRaw);

    const attitudinalSummary = buildAttitudinalSummary(attitudinalStrengths);

    const firmnessAdaptabilityRaw = await this.prisma.$queryRaw<
      Array<{ topico: string | null; suma: number | null }>
    >`
      SELECT
        p.topico,
        SUM(CAST(p.respuesta AS DOUBLE PRECISION)) AS suma
      FROM paciente_instrumento_respuesta p
      WHERE p.id_paciente = ${patientId}
        AND p.tipo_instrumento = 'test-salud'
        AND p.id_tema = 139
        AND p.evaluado = 0
        ${firmnessAdaptabilityFilter}
      GROUP BY p.topico
    `;

    let firmnessAdaptability: FirmnessAdaptabilityResult | null = null;
    if (firmnessAdaptabilityRaw.length) {
      const normalizeTopic = (value: string | null | undefined): string =>
        value
          ? value
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .trim()
              .toLowerCase()
          : '';

      const findSum = (needle: string): number => {
        const entry = firmnessAdaptabilityRaw.find(
          (row) => normalizeTopic(row.topico) === needle,
        );
        return this.toNumeric(entry?.suma);
      };

      const firmnessSum = findSum('firmeza');
      const adaptabilitySum = findSum('adaptabilidad');
      const total = firmnessSum + adaptabilitySum;

      if (total > 0) {
        const firmnessPercentage = Number(
          ((firmnessSum / total) * 100).toFixed(2),
        );
        const adaptabilityPercentage = Number(
          ((adaptabilitySum / total) * 100).toFixed(2),
        );
        const difference = Number(
          Math.abs(firmnessPercentage - adaptabilityPercentage).toFixed(2),
        );

        let balance: FirmnessAdaptabilityResult['balance'] = 'balanced';
        if (firmnessSum > adaptabilitySum) {
          balance = 'firmness';
        } else if (adaptabilitySum > firmnessSum) {
          balance = 'adaptability';
        }

        firmnessAdaptability = {
          firmness: {
            label: 'Firmeza',
            sum: Number(firmnessSum.toFixed(2)),
            percentage: firmnessPercentage,
          },
          adaptability: {
            label: 'Adaptabilidad',
            sum: Number(adaptabilitySum.toFixed(2)),
            percentage: adaptabilityPercentage,
          },
          total: Number(total.toFixed(2)),
          difference,
          balance,
        };
      }
    }

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
        ${diagnosticsFilter}
      GROUP BY t.nombre, t.id
      ORDER BY t.nombre
    `;

    const diagnosticsResponsesRaw = await this.prisma.$queryRaw<
      Array<{
        topico: string | null;
        id: number | null;
        pregunta: string | null;
        respuesta: string | null;
        respuesta_texto: string | null;
        pregunta_id: number | null;
      }>
    >`
      SELECT
        t.nombre AS topico,
        t.id AS id,
        p.pregunta AS pregunta,
        p.respuesta AS respuesta,
        q.id AS pregunta_id,
        txt.nombre AS respuesta_texto
      FROM paciente_instrumento_respuesta p
      INNER JOIN pregunta q ON p.id_pregunta = q.id
      INNER JOIN topico t ON q.id_topico = t.id
      LEFT JOIN LATERAL (
        SELECT nombre
        FROM respuesta r
        WHERE r.id_pregunta = q.id
          AND (
            (r.valor IS NOT NULL AND TRIM(r.valor) = TRIM(p.respuesta))
            OR (r.nombre IS NOT NULL AND LOWER(TRIM(r.nombre)) = LOWER(TRIM(p.respuesta)))
          )
        ORDER BY r.id
        LIMIT 1
      ) AS txt ON TRUE
      WHERE p.id_paciente = ${patientId} AND p.tipo_instrumento = 'diagnostico-salud'
        AND p.evaluado = 0
        ${diagnosticsFilter}
      ORDER BY t.nombre, COALESCE(p.orden, q.orden, p.id)
    `;

    const buildAnswerLookupKeys = (
      ...values: Array<string | null | undefined>
    ): string[] => {
      const keys = new Set<string>();
      values.forEach((value) => {
        if (value === null || value === undefined) {
          return;
        }
        const base = String(value).trim();
        if (!base.length) {
          return;
        }
        keys.add(base);
        keys.add(base.toLowerCase());
        const numericCandidate = Number(base.replace(',', '.'));
        if (!Number.isNaN(numericCandidate)) {
          keys.add(String(numericCandidate));
          keys.add(numericCandidate.toFixed(0));
          keys.add(numericCandidate.toFixed(1));
        }
      });
      return Array.from(keys).filter((item) => item.length > 0);
    };

    const answerLookupByQuestion = new Map<number, Map<string, string>>();
    const questionIds = Array.from(
      new Set(
        diagnosticsResponsesRaw
          .map((row) => this.toNumeric(row.pregunta_id))
          .filter((value): value is number => value !== null),
      ),
    );

    if (questionIds.length) {
      const answerOptions = await this.prisma.respuesta.findMany({
        where: { id_pregunta: { in: questionIds } },
        select: { id_pregunta: true, valor: true, nombre: true },
      });

      const pushLookupKey = (lookup: Map<string, string>, key: string, label: string) => {
        if (!key.length) {
          return;
        }
        if (!lookup.has(key)) {
          lookup.set(key, label);
        }
        const lower = key.toLowerCase();
        if (!lookup.has(lower)) {
          lookup.set(lower, label);
        }
      };

      answerOptions.forEach((option) => {
        const questionId = this.toNumeric(option.id_pregunta);
        if (questionId === null) {
          return;
        }
        const label = option.nombre?.trim();
        if (!label?.length) {
          return;
        }

        const lookup = answerLookupByQuestion.get(questionId) ?? new Map<string, string>();
        const keys = buildAnswerLookupKeys(option.valor, option.nombre);

        const rawValue = option.valor?.trim() ?? null;
        if (rawValue?.length) {
          keys.push(rawValue);
          const normalizedValue = rawValue.replace(',', '.');
          keys.push(normalizedValue);
          keys.push(normalizedValue.replace(/^0+(?=\d)/, ''));
        }

        keys.forEach((key) => {
          const normalizedKey = key.trim();
          if (!normalizedKey.length) {
            return;
          }
          pushLookupKey(lookup, normalizedKey, label);
        });

        answerLookupByQuestion.set(questionId, lookup);
      });
    }

    const normalizeQuestionLabel = (value: string | null): string => {
      if (!value) {
        return '';
      }

      const cleaned = value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[¿?]/g, ' ')
        .replace(/\busted\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      return cleaned;
    };

    const mapNumericAnswerHeuristic = (
      normalizedQuestion: string,
      value: string,
    ): string | null => {
      const numeric = Number(value.replace(',', '.'));
      if (!Number.isFinite(numeric)) {
        return null;
      }

      if (normalizedQuestion.startsWith('siente ')) {
        return numeric >= 2 ? 'Sí' : 'No';
      }

      const likertMap: Record<number, string> = {
        0: 'Nunca',
        1: 'Casi nunca',
        2: 'A veces',
        3: 'Frecuentemente',
        4: 'Casi siempre',
        5: 'Siempre',
      };

      const rounded = Math.round(numeric);
      return likertMap[rounded] ?? null;
    };

    const buildDiagnosticKey = (id: number | null, name: string | null) => {
      if (id !== null) {
        return `id:${id}`;
      }
      if (name && name.trim().length) {
        return `name:${name.trim().toLowerCase()}`;
      }
      return 'unknown';
    };

    const processedResponses = diagnosticsResponsesRaw.map((row) => {
      const questionId = this.toNumeric(row.pregunta_id);
      const question = row.pregunta?.trim() ?? null;
      const normalizedQuestion = normalizeQuestionLabel(question);
      const diagnosticKey = buildDiagnosticKey(row.id ?? null, row.topico ?? null);
      const lookupOptions =
        questionId !== null ? answerLookupByQuestion.get(questionId) : undefined;
      const lookupKeys = buildAnswerLookupKeys(row.respuesta, row.respuesta_texto);

      if (row.respuesta) {
        const trimmed = row.respuesta.trim();
        if (trimmed.length) {
          lookupKeys.push(trimmed);
          const normalizedNumeric = trimmed.replace(',', '.');
          lookupKeys.push(normalizedNumeric);
          lookupKeys.push(normalizedNumeric.replace(/^0+(?=\d)/, ''));
        }
      }

      let resolvedAnswer: string | null = null;
      if (lookupOptions && lookupKeys.length) {
        for (const lookupKey of lookupKeys) {
          const candidate = lookupOptions.get(lookupKey);
          if (candidate) {
            resolvedAnswer = candidate;
            break;
          }
        }
      }

      if (!resolvedAnswer?.trim().length) {
        resolvedAnswer = row.respuesta_texto?.trim() ?? null;
      }
      if (!resolvedAnswer?.trim().length) {
        resolvedAnswer = row.respuesta?.trim() ?? null;
      }

      const answer = resolvedAnswer?.trim() ?? null;

      return {
        diagnosticKey,
        question,
        normalizedQuestion,
        answer,
      };
    });

    const numericPattern = /^-?\d+(?:[.,]\d+)?$/;
    const textualAnswerByQuestion = new Map<string, string>();

    processedResponses.forEach((item) => {
      if (!item.normalizedQuestion || !item.answer) {
        return;
      }
      if (!numericPattern.test(item.answer)) {
        textualAnswerByQuestion.set(item.normalizedQuestion, item.answer);
      }
    });

    const responsesByDiagnostic = processedResponses.reduce(
      (acc, item) => {
        if (!item.answer) {
          return acc;
        }

        let answer = item.answer;
        if (numericPattern.test(answer)) {
          const fallback = textualAnswerByQuestion.get(item.normalizedQuestion);
          if (fallback?.trim().length) {
            answer = fallback.trim();
          } else {
            const heuristic = mapNumericAnswerHeuristic(item.normalizedQuestion, answer);
            if (heuristic) {
              answer = heuristic;
            }
          }
        }

        answer = answer.trim();
        if (!answer.length) {
          return acc;
        }

        const current = acc.get(item.diagnosticKey) ?? [];
        const existingIndex = current.findIndex(
          (entry) =>
            (entry.question ?? '').toLowerCase() === (item.question ?? '').toLowerCase(),
        );

        const isNumericAnswer = numericPattern.test(item.answer);
        const newEntry: HealthDiagnosticResponse = { question: item.question, answer };

        if (existingIndex >= 0) {
          const existing = current[existingIndex];
          const existingIsNumeric = numericPattern.test(existing.answer ?? '');
          if (!existing.answer || (existingIsNumeric && !isNumericAnswer)) {
            current[existingIndex] = newEntry;
          }
        } else {
          current.push(newEntry);
        }

        acc.set(item.diagnosticKey, current);
        return acc;
      },
      new Map<string, HealthDiagnosticResponse[]>(),
    );

    const diagnostics: HealthDiagnosticResult[] = diagnosticsRaw.map((row) => {
      const result = diagnosticoSalud(
        row.id ?? null,
        row.topico ?? null,
        this.toNumeric(row.suma),
      );
      const responseKey = buildDiagnosticKey(row.id ?? null, row.topico ?? null);
      return {
        ...result,
        diagnostic: row.topico ?? result.diagnostic,
        total: Number(result.total.toFixed(2)),
        responses: responsesByDiagnostic.get(responseKey) ?? [],
      } satisfies HealthDiagnosticResult;
    });

    const stressSum = await this.sumNumericResponses(
      {
        id_paciente: patientId,
        tipo_instrumento: 'test-estres',
        evaluado: 0,
      },
      { dateRange: testsRange },
    );
    const healthSum = await this.sumNumericResponses(
      {
        id_paciente: patientId,
        tipo_instrumento: 'test-salud',
        id_tema: 55,
        evaluado: 0,
      },
      { min: 0, max: 100, dateRange: testsRange },
    );
    const biologicalAgeSum = await this.sumNumericResponses(
      {
        id_paciente: patientId,
        tipo_instrumento: 'test-biologica',
        evaluado: 0,
      },
      { dateRange: testsRange },
    );
    const codependencySum = await this.sumNumericResponses(
      {
        id_paciente: patientId,
        tipo_instrumento: 'test-codependencia',
        evaluado: 0,
      },
      { dateRange: testsRange },
    );

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
      Array<{
        topicId: number | null;
        topic: string | null;
        promedio: number | null;
        cantidad: number | null;
      }>
    >`
      SELECT
        t.id AS topicId,
        COALESCE(p.topico, t.nombre) AS topic,
        AVG(CAST(p.respuesta AS DOUBLE PRECISION)) AS promedio
        ,COUNT(*) AS cantidad
      FROM paciente_instrumento_respuesta p
      LEFT JOIN pregunta q ON p.id_pregunta = q.id
      LEFT JOIN topico t ON q.id_topico = t.id
      WHERE p.id_paciente = ${patientId}
        AND p.evaluado = 0
        AND (
          p.tipo_instrumento = 'rueda-vida'
          OR q.id_topico IN (${Prisma.join(WHEEL_OF_LIFE_TOPIC_IDS)})
        )
        ${wellnessLifeFilter}
      GROUP BY t.id, COALESCE(p.topico, t.nombre)
      ORDER BY COALESCE(p.topico, t.nombre)
    `;

    const wheelOfLifeLookup = new Map<
      string,
      { sum: number; count: number }
    >();

    for (const row of wheelOfLifeRaw) {
      const group = this.resolveWheelOfLifeGroup(row.topicId ?? null, row.topic);
      if (!group) {
        continue;
      }

      const average = this.toNumeric(row.promedio);
      const count = this.toNumeric(row.cantidad);
      if (!count) {
        continue;
      }

      const current = wheelOfLifeLookup.get(group) ?? { sum: 0, count: 0 };
      current.sum += average * count;
      current.count += count;
      wheelOfLifeLookup.set(group, current);
    }

    const wheelOfLife: WheelResult[] = WHEEL_OF_LIFE_TOPICS.map((topic) => ({
      topic,
      average: Number(
        (
          (() => {
            const aggregated = wheelOfLifeLookup.get(topic);
            if (!aggregated || !aggregated.count) {
              return 0;
            }

            return aggregated.sum / aggregated.count;
          })()
        ).toFixed(2),
      ),
    }));

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
        ${wellnessHealthFilter}
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
        ${wellnessRegiflexFilter}
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
            ${dailyFilter}
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
        strengths: attitudinalStrengths,
        summary: attitudinalSummary,
      },
      firmnessAdaptability,
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
      metadata: {
        attitudinal: {
          availableDates: attitudinalDates,
          selectedDate: attitudinalSelected,
        },
        firmnessAdaptability: {
          availableDates: firmnessAdaptabilityDates,
          selectedDate: firmnessAdaptabilitySelected,
        },
        diagnostics: {
          availableDates: diagnosticsDates,
          selectedDate: diagnosticsSelected,
        },
        tests: {
          availableDates: testsDates,
          selectedDate: testsSelected,
        },
        dailyReview: {
          availableDates: dailyReviewDates,
          selectedDate: dailyReviewSelected,
        },
        wellnessLife: {
          availableDates: wellnessLifeDates,
          selectedDate: wellnessLifeSelected,
        },
        wellnessHealth: {
          availableDates: wellnessHealthDates,
          selectedDate: wellnessHealthSelected,
        },
        wellnessRegiflex: {
          availableDates: wellnessRegiflexDates,
          selectedDate: wellnessRegiflexSelected,
        },
      },
    } satisfies PatientAggregatedResults;
  }

  async findAggregatedResultsByUser(
    userId: number,
    options?: AggregatedResultsDateOptions,
  ): Promise<PatientAggregatedResults> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.findAggregatedResultsByPatient(patientId, options);
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
    const patientByUser = await this.prisma.paciente.findFirst({
      where: { id_usuario: userId },
      orderBy: [{ activo: 'desc' }, { updated_at: 'desc' }, { id: 'desc' }],
      select: { id: true },
    });

    if (patientByUser) {
      return patientByUser.id;
    }

    const patientById = await this.prisma.paciente.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (patientById) {
      return patientById.id;
    }

    throw new NotFoundException(
      'Paciente no encontrado para el usuario proporcionado',
    );
  }

  private cleanTopicName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.length > 70 && trimmed.includes('.')) {
      const match = trimmed.match(/^([^.]{5,70}\.)/);
      if (match) {
        const candidate = match[1].replace(/\.$/, '').trim();
        if (/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(candidate) && candidate.length >= 5) {
          return candidate;
        }
      }
    }
    return trimmed;
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

    const rawTopicsMap = new Map<number, string[]>();
    const explicitTemaIds = new Set<number>();
    const typesNeedingTemas = new Set<number>();

    for (const record of records) {
      const parsed = this.parseTopics(record.array_tema);
      rawTopicsMap.set(record.id, parsed);

      if (parsed.length > 0) {
        for (const item of parsed) {
          const num = Number(item);
          if (Number.isInteger(num) && num > 0) {
            explicitTemaIds.add(num);
          }
        }
      } else if (record.id_instrumento_tipo) {
        typesNeedingTemas.add(record.id_instrumento_tipo);
      }
    }

    const typeToTemasMap = new Map<number, number[]>();
    if (typesNeedingTemas.size > 0) {
      const instruments = await this.prisma.instrumento.findMany({
        where: {
          id_instrumento_tipo: { in: Array.from(typesNeedingTemas) },
          activo: 1,
        },
        select: { id_instrumento_tipo: true, id_tema: true },
      });

      for (const inst of instruments) {
        if (inst.id_instrumento_tipo && inst.id_tema) {
          explicitTemaIds.add(inst.id_tema);
          const existing = typeToTemasMap.get(inst.id_instrumento_tipo) ?? [];
          if (!existing.includes(inst.id_tema)) {
            existing.push(inst.id_tema);
          }
          typeToTemasMap.set(inst.id_instrumento_tipo, existing);
        }
      }
    }

    const temaList = explicitTemaIds.size > 0
      ? await this.prisma.tema.findMany({
          where: { id: { in: Array.from(explicitTemaIds) } },
          select: { id: true, nombre: true },
        })
      : [];

    const temaNameMap = new Map<number, string>(
      temaList.map((t) => [t.id, t.nombre ? this.cleanTopicName(t.nombre) : '']),
    );

    return records.map<PatientInstrumentAssignment>((record) => {
      const typeInfo = record.id_instrumento_tipo
        ? (instrumentTypeMap.get(record.id_instrumento_tipo) ?? null)
        : null;

      const parsedTopics = rawTopicsMap.get(record.id) ?? [];
      let resolvedTopics: string[] = [];

      if (parsedTopics.length > 0) {
        resolvedTopics = parsedTopics.map((topicStr) => {
          const numericId = Number(topicStr);
          if (Number.isInteger(numericId) && temaNameMap.has(numericId)) {
            return temaNameMap.get(numericId) || topicStr;
          }
          return topicStr;
        });
      } else if (record.id_instrumento_tipo && typeToTemasMap.has(record.id_instrumento_tipo)) {
        const temaIdsForType = typeToTemasMap.get(record.id_instrumento_tipo) ?? [];
        resolvedTopics = temaIdsForType
          .map((tId) => temaNameMap.get(tId) ?? '')
          .filter(Boolean);
      }

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
        topics: resolvedTopics,
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

  private normalizeEmail(value: unknown): string | null {
    const email = this.toStringOrNull(value);
    if (!email) {
      return null;
    }

    const normalized = email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return null;
    }

    return normalized;
  }

  private composeFullName(first: unknown, last: unknown): string | null {
    const firstName = this.toStringOrNull(first);
    const lastName = this.toStringOrNull(last);
    const parts = [firstName, lastName].filter(
      (value): value is string => Boolean(value),
    );

    if (parts.length) {
      return parts.join(' ');
    }

    return firstName ?? lastName ?? null;
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

  private async collectAvailableDates(
    where: Prisma.paciente_instrumento_respuestaWhereInput,
  ): Promise<string[]> {
    const rows = await this.prisma.paciente_instrumento_respuesta.findMany({
      where: {
        AND: [where, { fecha: { not: null } }],
      },
      select: { fecha: true },
      orderBy: { fecha: 'desc' },
    });

    const seen = new Set<string>();
    rows.forEach((row) => {
      if (!row.fecha) {
        return;
      }
      const formatted = this.formatDateOnly(row.fecha);
      if (formatted) {
        seen.add(formatted);
      }
    });

    return Array.from(seen).sort((a, b) => (a === b ? 0 : a > b ? -1 : 1));
  }

  private resolveSelectedSectionDate(
    requested: string | null | undefined,
    availableDates: string[],
  ): string | null {
    const normalized = requested ? this.normalizeDate(requested) : null;
    const requestedDate = normalized
      ? this.formatDateOnly(normalized)
      : null;

    if (requestedDate && availableDates.includes(requestedDate)) {
      return requestedDate;
    }

    return availableDates[0] ?? null;
  }

  private buildDateFilter(
    range: { start: Date; end: Date } | null,
    alias?: string,
  ): Prisma.Sql {
    if (!range) {
      return Prisma.sql``;
    }

    const column = alias ? `${alias}.fecha` : 'fecha';
    return Prisma.sql`AND ${Prisma.raw(column)} >= ${range.start} AND ${Prisma.raw(column)} < ${range.end}`;
  }

  private async sumNumericResponses(
    where: Prisma.paciente_instrumento_respuestaWhereInput,
    options?: {
      min?: number;
      max?: number;
      dateRange?: { start: Date; end: Date } | null;
    },
  ): Promise<number | null> {
    const mergedWhere: Prisma.paciente_instrumento_respuestaWhereInput = {
      ...where,
    };

    if (options?.dateRange) {
      mergedWhere.fecha = {
        gte: options.dateRange.start,
        lt: options.dateRange.end,
      };
    }

    const rows = await this.prisma.paciente_instrumento_respuesta.findMany({
      where: mergedWhere,
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

  private formatDateOnly(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    const raw = value?.toString().trim();
    if (!raw) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return raw;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime())
      ? ''
      : parsed.toISOString().slice(0, 10);
  }

  private buildDateRange(
    dateString: string | null,
  ): { start: Date; end: Date } | null {
    if (!dateString) {
      return null;
    }

    const parts = dateString.split('-');
    if (parts.length !== 3) {
      return null;
    }

    const [yearStr, monthStr, dayStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    ) {
      return null;
    }

    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));
    return { start, end };
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
