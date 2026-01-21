import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BloodPressureRecord,
  HeartRateRecoveryRecord,
  NumericVitalRecord,
  PatientVitalsSummary,
} from './entities/vital.entity';
import { CreateVitalDto } from './dto/create-vital.dto';
import { CreatePulseDto } from './dto/create-pulse.dto';
import { CreateHeartRateDto } from './dto/create-heart-rate.dto';
import { CreateBodyMassDto } from './dto/create-body-mass.dto';
import { CreateGlycemiaDto } from './dto/create-glycemia.dto';
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';
import { UpdatePulseDto } from './dto/update-pulse.dto';
import { UpdateHeartRateDto } from './dto/update-heart-rate.dto';
import { UpdateBodyMassDto } from './dto/update-body-mass.dto';
import { UpdateGlycemiaDto } from './dto/update-glycemia.dto';
import { UpdateBloodPressureDto } from './dto/update-blood-pressure.dto';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, isAbsolute, join, relative, resolve } from 'path';
import { randomBytes } from 'crypto';
import sharp from 'sharp';

type UploadedAttachmentFile = {
  buffer: Buffer;
  originalname?: string | null;
  mimetype?: string | null;
  size?: number | null;
};

type BodyMassImageUploads = {
  face?: UploadedAttachmentFile | null;
  front?: UploadedAttachmentFile | null;
  profile?: UploadedAttachmentFile | null;
  back?: UploadedAttachmentFile | null;
  extra?: UploadedAttachmentFile | null;
};

type BodyMassImageType =
  | 'foto_rostro'
  | 'foto_cuerpo_frente'
  | 'foto_cuerpo_perfil'
  | 'foto_espalda_entero'
  | 'foto_extra';

@Injectable()
export class VitalsService {
  private readonly bodyMassImagesDir = (() => {
    const candidates = [
      join(process.cwd(), 'assets', 'images'),
      join(process.cwd(), 'src', 'assets', 'images'),
      join(process.cwd(), 'dist', 'assets', 'images'),
      join(__dirname, '..', '..', '..', 'assets', 'images'),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return candidates[0];
  })();

  private readonly bodyMassImageTargetPixels = Math.max(
    1,
    Math.round((4 / 2.54) * 96),
  );

  constructor(private readonly prisma: PrismaService) {}

  private guessExtension(mime?: string | null): string | null {
    const normalized = mime?.toLowerCase().trim();
    switch (normalized) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      default:
        return null;
    }
  }

  private sanitizeBodyMassString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const trimmed = value.toString().trim();
    return trimmed.length ? trimmed : null;
  }

  private resolveBodyMassImageAbsolutePath(relativePath: string): string {
    const sanitized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!sanitized) {
      throw new BadRequestException('Ruta de imagen inválida.');
    }

    const withoutPrefix = sanitized.startsWith('images/')
      ? sanitized.slice('images/'.length)
      : sanitized;

    const absolutePath = resolve(this.bodyMassImagesDir, withoutPrefix);
    const diff = relative(this.bodyMassImagesDir, absolutePath);

    if (diff.startsWith('..') || isAbsolute(diff)) {
      throw new BadRequestException('Ruta de imagen inválida.');
    }

    return absolutePath;
  }

  private async storeBodyMassImage(
    patientId: number,
    imageType: BodyMassImageType,
    file?: UploadedAttachmentFile | null,
  ): Promise<string | undefined> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      return undefined;
    }

    if (file.size && file.size > 10 * 1024 * 1024) {
      throw new BadRequestException(
        'Las fotos corporales deben pesar máximo 10MB.',
      );
    }

    if (file.mimetype) {
      const normalizedMime = file.mimetype.toLowerCase();
      const allowedMimes = new Set(['image/jpeg', 'image/jpg', 'image/png']);

      if (!allowedMimes.has(normalizedMime)) {
        throw new BadRequestException(
          'Formato de imagen no permitido. Usa archivos JPG o PNG.',
        );
      }
    }

    let extension = extname(file.originalname ?? '').toLowerCase();
    if (!extension || !/^\.[a-z0-9]{1,10}$/.test(extension)) {
      extension = this.guessExtension(file.mimetype);
    }

    if (!extension) {
      extension = '.jpg';
    }

    const targetFormat = extension === '.png' ? 'png' : 'jpeg';
    const processedBuffer = await sharp(file.buffer)
      .rotate()
      .resize(this.bodyMassImageTargetPixels, this.bodyMassImageTargetPixels, {
        fit: sharp.fit.cover,
        position: 'center',
      })
      .toFormat(
        targetFormat,
        targetFormat === 'png'
          ? { compressionLevel: 9 }
          : { mozjpeg: true, quality: 80 },
      )
      .toBuffer();

    const uniqueToken = Buffer.from(
      `${Date.now()}-${randomBytes(10).toString('hex')}`,
      'utf8',
    ).toString('base64url');
    const filename = `${uniqueToken}${extension}`;
    const destinationDir = join(
      this.bodyMassImagesDir,
      imageType,
      String(patientId),
    );

    await mkdir(destinationDir, { recursive: true });
    const absolutePath = join(destinationDir, filename);
    await writeFile(absolutePath, processedBuffer);

    return join('images', imageType, String(patientId), filename).replace(
      /\\/g,
      '/',
    );
  }

  private async deleteBodyMassImage(
    relativePath: string | null | undefined,
  ): Promise<void> {
    if (!relativePath) {
      return;
    }

    try {
      const absolutePath = this.resolveBodyMassImageAbsolutePath(relativePath);
      await unlink(absolutePath).catch(() => undefined);
    } catch {
      // Ignoramos errores de eliminación para no bloquear el flujo principal.
    }
  }

  private async ensurePatientExists(patientId: number): Promise<void> {
    const patient = await this.prisma.paciente.findUnique({
      where: { id: patientId },
      select: { id: true, estatura: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const patientHeightInMeters = this.toMeters(patient.estatura);
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

  private toIso(date: Date | null | undefined): string | null {
    if (!date) {
      return null;
    }
    try {
      return date.toISOString();
    } catch {
      return null;
    }
  }

  private resolveRecordedAt(
    ...dates: Array<Date | null | undefined>
  ): string | null {
    for (const candidate of dates) {
      const iso = this.toIso(candidate);
      if (iso) {
        return iso;
      }
    }
    return null;
  }

  private toNumber(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value;
    }

    const normalized = value
      .toString()
      .trim()
      .replace(/,/g, '.')
      .replace(/[^0-9+-.]/g, '');

    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private parseDateInput(
    value: string | null | undefined,
  ): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    const trimmed = value.toString().trim();
    if (!trimmed) {
      return null;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private toMeters(value: string | number | null | undefined): number | null {
    const numeric = this.toNumber(value);
    if (numeric === null) {
      return null;
    }

    if (numeric === 0) {
      return null;
    }

    if (numeric > 10) {
      return numeric / 100;
    }

    return numeric;
  }

  private parseBloodPressure(raw: string | null | undefined): {
    systolic: number | null;
    diastolic: number | null;
  } {
    if (!raw) {
      return { systolic: null, diastolic: null };
    }

    const cleaned = raw.replace(/,/g, '.');
    const match = cleaned.match(/(-?\d+(?:\.\d+)?)\D+(-?\d+(?:\.\d+)?)/);

    if (!match) {
      return { systolic: null, diastolic: null };
    }

    const systolic = this.toNumber(match[1]);
    const diastolic = this.toNumber(match[2]);

    return { systolic, diastolic };
  }

  private sortByDateDesc<T extends { recordedAt: string | null }>(
    records: T[],
  ): T[] {
    return [...records].sort((a, b) => {
      if (!a.recordedAt && !b.recordedAt) {
        return 0;
      }
      if (!a.recordedAt) {
        return 1;
      }
      if (!b.recordedAt) {
        return -1;
      }

      const aTime = Number(new Date(a.recordedAt)) || 0;
      const bTime = Number(new Date(b.recordedAt)) || 0;
      return bTime - aTime;
    });
  }

  private mapConsultationWeightRecords(
    consultations: Array<{
      id: number;
      fecha: Date | null;
      peso: string | null;
    }>,
  ): NumericVitalRecord[] {
    return consultations
      .filter((entry) => entry.peso !== null && entry.peso !== undefined)
      .map<NumericVitalRecord>((entry) => ({
        id: entry.id,
        recordedAt: this.toIso(entry.fecha),
        value: this.toNumber(entry.peso),
        rawValue: entry.peso,
        unit: 'kg',
        source: 'consultation',
      }));
  }

  private mapWeightTableRecords(
    entries: Array<{
      id: number;
      fecha: Date | null;
      peso: string | null;
      created_at?: Date | null;
      updated_at?: Date | null;
    }>,
  ): NumericVitalRecord[] {
    return entries.map<NumericVitalRecord>((entry) => ({
      id: entry.id,
      recordedAt: this.resolveRecordedAt(
        entry.fecha,
        entry.updated_at,
        entry.created_at,
      ),
      value: this.toNumber(entry.peso),
      rawValue: entry.peso,
      unit: 'kg',
      source: 'weight',
    }));
  }

  private mapPulseRecords(
    consultations: Array<{
      id: number;
      fecha: Date | null;
      pulso: string | null;
    }>,
    pulses: Array<{
      id: number;
      fecha: Date | null;
      pulso: number | null;
      created_at?: Date | null;
      updated_at?: Date | null;
    }>,
  ): NumericVitalRecord[] {
    const consultationPulse = consultations
      .filter((entry) => entry.pulso !== null && entry.pulso !== undefined)
      .map<NumericVitalRecord>((entry) => ({
        id: entry.id,
        recordedAt: this.toIso(entry.fecha),
        value: this.toNumber(entry.pulso),
        rawValue: entry.pulso,
        unit: 'bpm',
        source: 'consultation',
      }));

    const pulseEntries = pulses.map<NumericVitalRecord>((entry) => ({
      id: entry.id,
      recordedAt: this.resolveRecordedAt(
        entry.fecha,
        entry.updated_at,
        entry.created_at,
      ),
      value:
        entry.pulso === null || entry.pulso === undefined
          ? null
          : this.toNumber(entry.pulso),
      rawValue:
        entry.pulso === null || entry.pulso === undefined
          ? null
          : String(entry.pulso),
      unit: 'bpm',
      source: 'pulse',
    }));

    return [...consultationPulse, ...pulseEntries];
  }

  private mapBloodPressureRecords(
    consultations: Array<{
      id: number;
      fecha: Date | null;
      tension: string | null;
    }>,
  ): BloodPressureRecord[] {
    return consultations
      .filter((entry) => entry.tension !== null && entry.tension !== undefined)
      .map<BloodPressureRecord>((entry) => {
        const parsed = this.parseBloodPressure(entry.tension);
        return {
          id: entry.id,
          recordedAt: this.toIso(entry.fecha),
          systolic: parsed.systolic,
          diastolic: parsed.diastolic,
          rawValue: entry.tension,
          source: 'consultation',
        };
      });
  }

  private mapBloodPressureTableRecords(
    entries: Array<{
      id: number;
      fecha: Date | null;
      sistolica: number | null;
      diastolica: number | null;
      created_at?: Date | null;
      updated_at?: Date | null;
    }>,
  ): BloodPressureRecord[] {
    return entries.map<BloodPressureRecord>((entry) => ({
      id: entry.id,
      recordedAt: this.resolveRecordedAt(
        entry.fecha,
        entry.updated_at,
        entry.created_at,
      ),
      systolic: this.toNumber(entry.sistolica),
      diastolic: this.toNumber(entry.diastolica),
      rawValue:
        entry.sistolica === null || entry.diastolica === null
          ? null
          : `${entry.sistolica}/${entry.diastolica}`,
      source: 'blood_pressure',
    }));
  }

  private mapConsultationBodyMassIndexRecords(
    consultations: Array<{
      id: number;
      fecha: Date | null;
      imc: string | null;
    }>,
  ): NumericVitalRecord[] {
    return consultations
      .filter((entry) => entry.imc !== null && entry.imc !== undefined)
      .map<NumericVitalRecord>((entry) => ({
        id: entry.id,
        recordedAt: this.toIso(entry.fecha),
        value: this.toNumber(entry.imc),
        rawValue: entry.imc,
        unit: 'kg/m²',
        source: 'consultation',
      }));
  }

  private mapBodyMassIndexFromWeightRecords(
    entries: Array<{
      id: number;
      fecha: Date | null;
      peso: string | null;
    }> | null,
    heightInMeters: number | null,
  ): NumericVitalRecord[] {
    if (!entries?.length || !heightInMeters || heightInMeters <= 0) {
      return [];
    }

    const denominator = heightInMeters * heightInMeters;
    if (denominator <= 0) {
      return [];
    }

    return entries
      .map<NumericVitalRecord | null>((entry) => {
        const weightValue = this.toNumber(entry.peso);
        if (weightValue === null) {
          return null;
        }

        const bmi = weightValue / denominator;
        if (!Number.isFinite(bmi)) {
          return null;
        }

        const normalizedBmi = Number(bmi.toFixed(2));

        return {
          id: entry.id,
          recordedAt: this.toIso(entry.fecha),
          value: normalizedBmi,
          rawValue: normalizedBmi.toString(),
          unit: 'kg/m²',
          source: 'body_mass',
        } satisfies NumericVitalRecord;
      })
      .filter((entry): entry is NumericVitalRecord => entry !== null);
  }

  private mapGlycemiaRecords(
    glycemiaEntries: Array<{
      id: number;
      fecha: Date | null;
      glicemia: string | null;
      created_at?: Date | null;
      updated_at?: Date | null;
    }>,
  ): NumericVitalRecord[] {
    return glycemiaEntries.map<NumericVitalRecord>((entry) => ({
      id: entry.id,
      recordedAt: this.resolveRecordedAt(
        entry.fecha,
        entry.updated_at,
        entry.created_at,
      ),
      value: this.toNumber(entry.glicemia),
      rawValue: entry.glicemia,
      unit: 'mg/dL',
      source: 'glycemia',
    }));
  }

  private mapHeartRateRecords(
    heartRateEntries: Array<{
      id: number;
      fecha: Date | null;
      fcr: number | string | null;
      fc_15_min: number | string | null;
      fc_30_min: number | string | null;
      fc_45_min: number | string | null;
      fc_5_min_entrenamiento: number | string | null;
      fc_10_min_entrenamiento: number | string | null;
      entrenamiento: string | null;
      created_at?: Date | null;
      updated_at?: Date | null;
    }>,
  ): HeartRateRecoveryRecord[] {
    return heartRateEntries.map<HeartRateRecoveryRecord>((entry) => ({
      id: entry.id,
      recordedAt: this.resolveRecordedAt(
        entry.fecha,
        entry.updated_at,
        entry.created_at,
      ),
      resting: this.toNumber(entry.fcr),
      after5Minutes: this.toNumber(entry.fc_5_min_entrenamiento),
      after10Minutes: this.toNumber(entry.fc_10_min_entrenamiento),
      after15Minutes: this.toNumber(entry.fc_15_min),
      after30Minutes: this.toNumber(entry.fc_30_min),
      after45Minutes: this.toNumber(entry.fc_45_min),
      sessionType: entry.entrenamiento ?? null,
      source: 'heart_rate',
    }));
  }

  async getByPatient(patientId: number): Promise<PatientVitalsSummary> {
    const patient = await this.prisma.paciente.findUnique({
      where: { id: patientId },
      select: { id: true, estatura: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const patientHeightInMeters = this.toMeters(patient.estatura);

    const [
      consultations,
      pulseEntries,
      glycemiaEntries,
      bloodPressureEntries,
      heartRateEntries,
      weightEntries,
    ] = await Promise.all([
      this.prisma.paciente_consulta.findMany({
        where: { id_paciente: patientId },
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          fecha: true,
          peso: true,
          pulso: true,
          tension: true,
          imc: true,
        },
      }),
      this.prisma.paciente_pulso.findMany({
        where: { id_paciente: patientId },
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          fecha: true,
          pulso: true,
          created_at: true,
          updated_at: true,
        },
      }),
      this.prisma.paciente_glicemia.findMany({
        where: { id_paciente: patientId },
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          fecha: true,
          glicemia: true,
          created_at: true,
          updated_at: true,
        },
      }),
      this.prisma.paciente_tension_arterial.findMany({
        where: { id_paciente: patientId },
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          fecha: true,
          sistolica: true,
          diastolica: true,
          created_at: true,
          updated_at: true,
        },
      }),
      this.prisma.$queryRaw<
        Array<{
          id: number;
          id_paciente: number | null;
          fecha: Date | null;
          fcr: number | string | null;
          fc_15_min: number | string | null;
          fc_30_min: number | string | null;
          fc_45_min: number | string | null;
          fc_5_min_entrenamiento: number | string | null;
          fc_10_min_entrenamiento: number | string | null;
          entrenamiento: string | null;
          created_at: Date | null;
          updated_at: Date | null;
        }>
      >`
        SELECT
          id,
          id_paciente,
          fecha,
          fcr,
          fc_15_min,
          fc_30_min,
          fc_45_min,
          fc_5_min_entrenamiento,
          fc_10_min_entrenamiento,
          entrenamiento,
          created_at,
          updated_at
        FROM paciente_frecuencia_cardiaca
        WHERE id_paciente = ${patientId}
        ORDER BY fecha DESC
      `,
      this.prisma.paciente_peso.findMany({
        where: { id_paciente: patientId },
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          fecha: true,
          peso: true,
          created_at: true,
          updated_at: true,
        },
      }),
    ]);

    return {
      weight: this.sortByDateDesc([
        ...this.mapConsultationWeightRecords(consultations),
        ...this.mapWeightTableRecords(weightEntries),
      ]),
      pulse: this.sortByDateDesc(
        this.mapPulseRecords(consultations, pulseEntries),
      ),
      bloodPressure: this.sortByDateDesc([
        ...this.mapBloodPressureRecords(consultations),
        ...this.mapBloodPressureTableRecords(bloodPressureEntries),
      ]),
      bodyMassIndex: this.sortByDateDesc([
        ...this.mapConsultationBodyMassIndexRecords(consultations),
        ...this.mapBodyMassIndexFromWeightRecords(
          weightEntries,
          patientHeightInMeters,
        ),
      ]),
      glycemia: this.sortByDateDesc(this.mapGlycemiaRecords(glycemiaEntries)),
      heartRateRecovery: this.sortByDateDesc(
        this.mapHeartRateRecords(heartRateEntries),
      ),
    };
  }

  async getByUserId(userId: number): Promise<PatientVitalsSummary> {
    const patient = await this.prisma.paciente.findFirst({
      where: { id_usuario: userId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException(
        'Paciente no encontrado para el usuario proporcionado',
      );
    }

    return this.getByPatient(patient.id);
  }

  /**
   * Registra un peso para un paciente usando la tabla `paciente_peso`.
   * Devuelve el registro creado mapeado como NumericVitalRecord.
   */
  async registerWeight(
    patientId: number,
    dto: CreateVitalDto,
  ): Promise<NumericVitalRecord> {
    await this.ensurePatientExists(patientId);

    const created = await this.prisma.paciente_peso.create({
      data: {
        id_paciente: patientId,
        peso: dto.peso ?? null,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      id: created.id,
      recordedAt: this.resolveRecordedAt(
        created.fecha,
        created.updated_at,
        created.created_at,
      ),
      value: this.toNumber(created.peso),
      rawValue: created.peso,
      unit: 'kg',
      source: 'weight',
    } as NumericVitalRecord;
  }

  async updateWeight(
    patientId: number,
    recordId: number,
    dto: UpdateVitalDto,
  ): Promise<NumericVitalRecord> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_peso.findFirst({
      where: { id: recordId, id_paciente: patientId },
    });

    if (!existing) {
      throw new NotFoundException('Registro de peso no encontrado');
    }

    const updated = await this.prisma.paciente_peso.update({
      where: { id: recordId },
      data: {
        peso: dto.peso === undefined ? undefined : (dto.peso ?? null),
        fecha: this.parseDateInput(dto.fecha),
        updated_at: new Date(),
      },
      select: {
        id: true,
        fecha: true,
        peso: true,
        created_at: true,
        updated_at: true,
      },
    });

    return this.mapWeightTableRecords([updated])[0];
  }

  async deleteWeight(patientId: number, recordId: number): Promise<void> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_peso.findFirst({
      where: { id: recordId, id_paciente: patientId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Registro de peso no encontrado');
    }

    await this.prisma.paciente_peso.delete({ where: { id: recordId } });
  }

  async registerPulse(
    patientId: number,
    dto: CreatePulseDto,
  ): Promise<NumericVitalRecord> {
    await this.ensurePatientExists(patientId);

    const pulseValue = this.toNumber(dto.pulso);
    const created = await this.prisma.paciente_pulso.create({
      data: {
        id_paciente: patientId,
        pulso: pulseValue === null ? null : Math.round(pulseValue),
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      id: created.id,
      recordedAt: this.resolveRecordedAt(
        created.fecha,
        created.updated_at,
        created.created_at,
      ),
      value: this.toNumber(created.pulso),
      rawValue:
        created.pulso === null || created.pulso === undefined
          ? null
          : String(created.pulso),
      unit: 'bpm',
      source: 'pulse',
    };
  }

  async updatePulse(
    patientId: number,
    recordId: number,
    dto: UpdatePulseDto,
  ): Promise<NumericVitalRecord> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_pulso.findFirst({
      where: { id: recordId, id_paciente: patientId },
    });

    if (!existing) {
      throw new NotFoundException('Registro de pulso no encontrado');
    }

    const pulseValue =
      dto.pulso === undefined ? undefined : this.toNumber(dto.pulso);

    const updated = await this.prisma.paciente_pulso.update({
      where: { id: recordId },
      data: {
        pulso:
          pulseValue === undefined
            ? undefined
            : pulseValue === null
              ? null
              : Math.round(pulseValue),
        fecha: this.parseDateInput(dto.fecha),
        updated_at: new Date(),
      },
      select: {
        id: true,
        fecha: true,
        pulso: true,
        created_at: true,
        updated_at: true,
      },
    });

    return this.mapPulseRecords([], [updated])[0];
  }

  async deletePulse(patientId: number, recordId: number): Promise<void> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_pulso.findFirst({
      where: { id: recordId, id_paciente: patientId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Registro de pulso no encontrado');
    }

    await this.prisma.paciente_pulso.delete({ where: { id: recordId } });
  }

  async registerHeartRate(
    patientId: number,
    dto: CreateHeartRateDto,
  ): Promise<HeartRateRecoveryRecord> {
    await this.ensurePatientExists(patientId);

    const now = new Date();
    const fecha = dto.fecha ? new Date(dto.fecha) : now;
    const toNullableNumber = (
      value: string | number | undefined,
    ): number | null => (value === undefined ? null : this.toNumber(value));

    const inserted = await this.prisma.$queryRaw<
      Array<{
        id: number;
        fecha: Date | null;
        fcr: number | null;
        fc_5_min_entrenamiento: number | null;
        fc_10_min_entrenamiento: number | null;
        fc_15_min: number | null;
        fc_30_min: number | null;
        fc_45_min: number | null;
        entrenamiento: string | null;
        created_at: Date | null;
        updated_at: Date | null;
      }>
    >`
      INSERT INTO paciente_frecuencia_cardiaca (
        id_paciente,
        fecha,
        fcr,
        fc_5_min_entrenamiento,
        fc_10_min_entrenamiento,
        fc_15_min,
        fc_30_min,
        entrenamiento,
        created_at,
        updated_at
        entrenamiento,
        created_at,
        updated_at
      ) VALUES (
        ${patientId},
        ${fecha},
        ${toNullableNumber(dto.fcr)},
        ${toNullableNumber(dto.fc5MinEntrenamiento)},
        ${toNullableNumber(dto.fc10MinEntrenamiento)},
        ${toNullableNumber(dto.fc15Min)},
        ${toNullableNumber(dto.fc30Min)},
        ${toNullableNumber(dto.fc45Min)},
        ${dto.entrenamiento ?? null},
        ${now},
        ${now}
      )
      RETURNING
        id,
        fecha,
        fcr,
        fc_5_min_entrenamiento,
        fc_10_min_entrenamiento,
        fc_15_min,
        fc_30_min,
        fc_45_min,
        entrenamiento,
        created_at,
        updated_at
    `;

    const created = inserted[0];

    return {
      id: created.id,
      recordedAt: this.resolveRecordedAt(
        created.fecha,
        created.updated_at,
        created.created_at,
      ),
      resting: this.toNumber(created.fcr),
      after5Minutes: this.toNumber(created.fc_5_min_entrenamiento),
      after10Minutes: this.toNumber(created.fc_10_min_entrenamiento),
      after15Minutes: this.toNumber(created.fc_15_min),
      after30Minutes: this.toNumber(created.fc_30_min),
      after45Minutes: this.toNumber(created.fc_45_min),
      sessionType: created.entrenamiento ?? null,
      source: 'heart_rate',
    };
  }

  async updateHeartRate(
    patientId: number,
    recordId: number,
    dto: UpdateHeartRateDto,
  ): Promise<HeartRateRecoveryRecord> {
    await this.ensurePatientExists(patientId);

    const existingRecords = await this.prisma.$queryRaw<
      Array<{
        id: number;
        fecha: Date | null;
        fcr: number | string | null;
        fc_5_min_entrenamiento: number | string | null;
        fc_10_min_entrenamiento: number | string | null;
        fc_15_min: number | string | null;
        fc_30_min: number | string | null;
        fc_45_min: number | string | null;
        entrenamiento: string | null;
        created_at: Date | null;
        updated_at: Date | null;
      }>
    >`
      SELECT
        id,
        fecha,
        fcr,
        fc_5_min_entrenamiento,
        fc_10_min_entrenamiento,
        fc_15_min,
        fc_30_min,
        fc_45_min,
        entrenamiento,
        created_at,
        updated_at
      FROM paciente_frecuencia_cardiaca
      WHERE id = ${recordId}
        AND id_paciente = ${patientId}
      LIMIT 1
    `;

    if (!existingRecords.length) {
      throw new NotFoundException(
        'Registro de frecuencia cardiaca no encontrado',
      );
    }

    const current = existingRecords[0];

    const toNullableNumber = (value: string | number | null | undefined) =>
      value === undefined ? undefined : this.toNumber(value);

    const fecha = this.parseDateInput(dto.fecha);
    const fcr = toNullableNumber(dto.fcr);
    const fc5 = toNullableNumber(dto.fc5MinEntrenamiento);
    const fc10 = toNullableNumber(dto.fc10MinEntrenamiento);
    const fc15 = toNullableNumber(dto.fc15Min);
    const fc30 = toNullableNumber(dto.fc30Min);
    const fc45 = toNullableNumber(dto.fc45Min);
    const entrenamiento =
      dto.entrenamiento === undefined ? undefined : (dto.entrenamiento ?? null);

    await this.prisma.$executeRaw`
      UPDATE paciente_frecuencia_cardiaca
      SET
        fecha = ${fecha === undefined ? current.fecha : fecha},
        fcr = ${fcr === undefined ? current.fcr : fcr},
        fc_5_min_entrenamiento = ${fc5 === undefined ? current.fc_5_min_entrenamiento : fc5},
        fc_10_min_entrenamiento = ${fc10 === undefined ? current.fc_10_min_entrenamiento : fc10},
        fc_15_min = ${fc15 === undefined ? current.fc_15_min : fc15},
        fc_30_min = ${fc30 === undefined ? current.fc_30_min : fc30},
        fc_45_min = ${fc45 === undefined ? current.fc_45_min : fc45},
        entrenamiento = ${entrenamiento === undefined ? current.entrenamiento : entrenamiento},
        updated_at = ${new Date()}
      WHERE id = ${recordId}
        AND id_paciente = ${patientId}
    `;

    const updatedRecords = await this.prisma.$queryRaw<
      Array<{
        id: number;
        fecha: Date | null;
        fcr: number | string | null;
        fc_15_min: number | string | null;
        fc_30_min: number | string | null;
        fc_45_min: number | string | null;
        fc_5_min_entrenamiento: number | string | null;
        fc_10_min_entrenamiento: number | string | null;
        entrenamiento: string | null;
        created_at: Date | null;
        updated_at: Date | null;
      }>
    >`
      SELECT
        id,
        fecha,
        fcr,
        fc_15_min,
        fc_30_min,
        fc_45_min,
        fc_5_min_entrenamiento,
        fc_10_min_entrenamiento,
        entrenamiento,
        created_at,
        updated_at
      FROM paciente_frecuencia_cardiaca
      WHERE id = ${recordId}
        AND id_paciente = ${patientId}
      LIMIT 1
    `;

    return this.mapHeartRateRecords(updatedRecords)[0];
  }

  async deleteHeartRate(patientId: number, recordId: number): Promise<void> {
    await this.ensurePatientExists(patientId);

    const result = await this.prisma.$executeRaw`
      DELETE FROM paciente_frecuencia_cardiaca
      WHERE id = ${recordId}
        AND id_paciente = ${patientId}
    `;

    if (!result) {
      throw new NotFoundException(
        'Registro de frecuencia cardiaca no encontrado',
      );
    }
  }

  async registerBodyMass(
    patientId: number,
    dto: CreateBodyMassDto,
    images?: BodyMassImageUploads,
  ): Promise<NumericVitalRecord> {
    await this.ensurePatientExists(patientId);

    const [facePath, frontPath, profilePath, backPath, extraPath] =
      await Promise.all([
        this.storeBodyMassImage(patientId, 'foto_rostro', images?.face ?? null),
        this.storeBodyMassImage(
          patientId,
          'foto_cuerpo_frente',
          images?.front ?? null,
        ),
        this.storeBodyMassImage(
          patientId,
          'foto_cuerpo_perfil',
          images?.profile ?? null,
        ),
        this.storeBodyMassImage(
          patientId,
          'foto_espalda_entero',
          images?.back ?? null,
        ),
        this.storeBodyMassImage(
          patientId,
          'foto_extra',
          images?.extra ?? null,
        ),
      ]);

    const created = await this.prisma.paciente_masa_corporal.create({
      data: {
        id_paciente: patientId,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        peso: dto.peso === undefined ? null : String(dto.peso),
        cuello: dto.cuello ?? null,
        busto: dto.busto ?? null,
        cintura: dto.cintura ?? null,
        cadera: dto.cadera ?? null,
        brazo_derecho: dto.brazoDerecho ?? null,
        muslo_derecho: dto.musloDerecho ?? null,
        foto_rostro:
          facePath ?? this.sanitizeBodyMassString(dto.fotoRostro) ?? null,
        foto_cuerpo_frente:
          frontPath ?? this.sanitizeBodyMassString(dto.fotoCuerpoFrente) ?? null,
        foto_cuerpo_perfil:
          profilePath ??
          this.sanitizeBodyMassString(dto.fotoCuerpoPerfil) ??
            null,
        foto_espalda_entero:
          backPath ?? this.sanitizeBodyMassString(dto.fotoEspaldaEntero) ?? null,
        foto_extra:
          extraPath ?? this.sanitizeBodyMassString(dto.fotoExtra) ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      id: created.id,
      recordedAt: this.resolveRecordedAt(
        created.fecha,
        created.updated_at,
        created.created_at,
      ),
      value: this.toNumber(created.peso),
      rawValue: created.peso,
      unit: 'kg',
      source: 'body_mass',
    };
  }

  async updateBodyMass(
    patientId: number,
    recordId: number,
    dto: UpdateBodyMassDto,
    images?: BodyMassImageUploads,
  ): Promise<NumericVitalRecord> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_masa_corporal.findFirst({
      where: { id: recordId, id_paciente: patientId },
      select: {
        id: true,
        fecha: true,
        peso: true,
        cuello: true,
        busto: true,
        cintura: true,
        cadera: true,
        brazo_derecho: true,
        muslo_derecho: true,
        foto_rostro: true,
        foto_cuerpo_frente: true,
        foto_cuerpo_perfil: true,
        foto_espalda_entero: true,
        foto_extra: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Registro de masa corporal no encontrado');
    }

    const [facePath, frontPath, profilePath, backPath, extraPath] =
      await Promise.all([
        this.storeBodyMassImage(patientId, 'foto_rostro', images?.face ?? null),
        this.storeBodyMassImage(
          patientId,
          'foto_cuerpo_frente',
          images?.front ?? null,
        ),
        this.storeBodyMassImage(
          patientId,
          'foto_cuerpo_perfil',
          images?.profile ?? null,
        ),
        this.storeBodyMassImage(
          patientId,
          'foto_espalda_entero',
          images?.back ?? null,
        ),
        this.storeBodyMassImage(
          patientId,
          'foto_extra',
          images?.extra ?? null,
        ),
      ]);

    const cleanupPaths: string[] = [];

    const updateData: Record<string, any> = {
      fecha: this.parseDateInput(dto.fecha),
      peso:
        dto.peso === undefined
          ? undefined
          : dto.peso === null
            ? null
            : String(dto.peso),
      cuello: dto.cuello === undefined ? undefined : (dto.cuello ?? null),
      busto: dto.busto === undefined ? undefined : (dto.busto ?? null),
      cintura: dto.cintura === undefined ? undefined : (dto.cintura ?? null),
      cadera: dto.cadera === undefined ? undefined : (dto.cadera ?? null),
      brazo_derecho:
        dto.brazoDerecho === undefined
          ? undefined
          : (dto.brazoDerecho ?? null),
      muslo_derecho:
        dto.musloDerecho === undefined
          ? undefined
          : (dto.musloDerecho ?? null),
      updated_at: new Date(),
    };

    const applyImageUpdate = (
      newPath: string | undefined,
      dtoValue: string | null | undefined,
      currentValue: string | null,
      fieldName: BodyMassImageType,
    ) => {
      if (newPath !== undefined) {
        updateData[fieldName] = newPath;
        if (currentValue && currentValue !== newPath) {
          cleanupPaths.push(currentValue);
        }
        return;
      }

      if (dtoValue === undefined) {
        return;
      }

      const sanitized = this.sanitizeBodyMassString(dtoValue);
      updateData[fieldName] = sanitized;

      if (!sanitized && currentValue) {
        cleanupPaths.push(currentValue);
      }
    };

    applyImageUpdate(facePath, dto.fotoRostro, existing.foto_rostro, 'foto_rostro');
    applyImageUpdate(
      frontPath,
      dto.fotoCuerpoFrente,
      existing.foto_cuerpo_frente,
      'foto_cuerpo_frente',
    );
    applyImageUpdate(
      profilePath,
      dto.fotoCuerpoPerfil,
      existing.foto_cuerpo_perfil,
      'foto_cuerpo_perfil',
    );
    applyImageUpdate(
      backPath,
      dto.fotoEspaldaEntero,
      existing.foto_espalda_entero,
      'foto_espalda_entero',
    );
    applyImageUpdate(
      extraPath,
      dto.fotoExtra,
      existing.foto_extra,
      'foto_extra',
    );

    const updated = await this.prisma.paciente_masa_corporal.update({
      where: { id: recordId },
      data: updateData,
      select: {
        id: true,
        fecha: true,
        peso: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (cleanupPaths.length) {
      await Promise.all(
        cleanupPaths.map((path) => this.deleteBodyMassImage(path)),
      );
    }

    return {
      id: updated.id,
      recordedAt: this.resolveRecordedAt(
        updated.fecha,
        updated.updated_at,
        updated.created_at,
      ),
      value: this.toNumber(updated.peso),
      rawValue: updated.peso,
      unit: 'kg',
      source: 'body_mass',
    };
  }

  async deleteBodyMass(patientId: number, recordId: number): Promise<void> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_masa_corporal.findFirst({
      where: { id: recordId, id_paciente: patientId },
      select: {
        id: true,
        foto_rostro: true,
        foto_cuerpo_frente: true,
        foto_cuerpo_perfil: true,
        foto_espalda_entero: true,
        foto_extra: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Registro de masa corporal no encontrado');
    }

    await this.prisma.paciente_masa_corporal.delete({
      where: { id: recordId },
    });

    await Promise.all([
      this.deleteBodyMassImage(existing.foto_rostro),
      this.deleteBodyMassImage(existing.foto_cuerpo_frente),
      this.deleteBodyMassImage(existing.foto_cuerpo_perfil),
      this.deleteBodyMassImage(existing.foto_espalda_entero),
      this.deleteBodyMassImage(existing.foto_extra),
    ]);
  }

  async registerGlycemia(
    patientId: number,
    dto: CreateGlycemiaDto,
  ): Promise<NumericVitalRecord> {
    await this.ensurePatientExists(patientId);

    const created = await this.prisma.paciente_glicemia.create({
      data: {
        id_paciente: patientId,
        glicemia: dto.glicemia === undefined ? null : String(dto.glicemia),
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      id: created.id,
      recordedAt: this.resolveRecordedAt(
        created.fecha,
        created.updated_at,
        created.created_at,
      ),
      value: this.toNumber(created.glicemia),
      rawValue: created.glicemia,
      unit: 'mg/dL',
      source: 'glycemia',
    };
  }

  async updateGlycemia(
    patientId: number,
    recordId: number,
    dto: UpdateGlycemiaDto,
  ): Promise<NumericVitalRecord> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_glicemia.findFirst({
      where: { id: recordId, id_paciente: patientId },
    });

    if (!existing) {
      throw new NotFoundException('Registro de glicemia no encontrado');
    }

    const updated = await this.prisma.paciente_glicemia.update({
      where: { id: recordId },
      data: {
        glicemia: dto.glicemia === undefined ? undefined : String(dto.glicemia),
        fecha: this.parseDateInput(dto.fecha),
        updated_at: new Date(),
      },
      select: {
        id: true,
        fecha: true,
        glicemia: true,
        created_at: true,
        updated_at: true,
      },
    });

    return this.mapGlycemiaRecords([updated])[0];
  }

  async deleteGlycemia(patientId: number, recordId: number): Promise<void> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_glicemia.findFirst({
      where: { id: recordId, id_paciente: patientId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Registro de glicemia no encontrado');
    }

    await this.prisma.paciente_glicemia.delete({ where: { id: recordId } });
  }

  async registerBloodPressure(
    patientId: number,
    dto: CreateBloodPressureDto,
  ): Promise<BloodPressureRecord> {
    await this.ensurePatientExists(patientId);

    const systolic = this.toNumber(dto.sistolica);
    const diastolic = this.toNumber(dto.diastolica);
    const created = await this.prisma.paciente_tension_arterial.create({
      data: {
        id_paciente: patientId,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        sistolica: systolic === null ? null : Math.round(systolic),
        diastolica: diastolic === null ? null : Math.round(diastolic),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return {
      id: created.id,
      recordedAt: this.resolveRecordedAt(
        created.fecha,
        created.updated_at,
        created.created_at,
      ),
      systolic: this.toNumber(created.sistolica),
      diastolic: this.toNumber(created.diastolica),
      rawValue:
        created.sistolica === null || created.diastolica === null
          ? null
          : `${created.sistolica}/${created.diastolica}`,
      source: 'blood_pressure',
    };
  }

  async updateBloodPressure(
    patientId: number,
    recordId: number,
    dto: UpdateBloodPressureDto,
  ): Promise<BloodPressureRecord> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_tension_arterial.findFirst({
      where: { id: recordId, id_paciente: patientId },
    });

    if (!existing) {
      throw new NotFoundException('Registro de tension arterial no encontrado');
    }

    const systolic =
      dto.sistolica === undefined ? undefined : this.toNumber(dto.sistolica);
    const diastolic =
      dto.diastolica === undefined ? undefined : this.toNumber(dto.diastolica);

    const updated = await this.prisma.paciente_tension_arterial.update({
      where: { id: recordId },
      data: {
        fecha: this.parseDateInput(dto.fecha),
        sistolica:
          systolic === undefined
            ? undefined
            : systolic === null
              ? null
              : Math.round(systolic),
        diastolica:
          diastolic === undefined
            ? undefined
            : diastolic === null
              ? null
              : Math.round(diastolic),
        updated_at: new Date(),
      },
      select: {
        id: true,
        fecha: true,
        sistolica: true,
        diastolica: true,
        created_at: true,
        updated_at: true,
      },
    });

    return this.mapBloodPressureTableRecords([updated])[0];
  }

  async deleteBloodPressure(
    patientId: number,
    recordId: number,
  ): Promise<void> {
    await this.ensurePatientExists(patientId);

    const existing = await this.prisma.paciente_tension_arterial.findFirst({
      where: { id: recordId, id_paciente: patientId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Registro de tension arterial no encontrado');
    }

    await this.prisma.paciente_tension_arterial.delete({
      where: { id: recordId },
    });
  }

  async registerWeightByUser(
    userId: number,
    dto: CreateVitalDto,
  ): Promise<NumericVitalRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.registerWeight(patientId, dto);
  }

  async updateWeightByUser(
    userId: number,
    recordId: number,
    dto: UpdateVitalDto,
  ): Promise<NumericVitalRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.updateWeight(patientId, recordId, dto);
  }

  async deleteWeightByUser(userId: number, recordId: number): Promise<void> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.deleteWeight(patientId, recordId);
  }

  async registerPulseByUser(
    userId: number,
    dto: CreatePulseDto,
  ): Promise<NumericVitalRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.registerPulse(patientId, dto);
  }

  async updatePulseByUser(
    userId: number,
    recordId: number,
    dto: UpdatePulseDto,
  ): Promise<NumericVitalRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.updatePulse(patientId, recordId, dto);
  }

  async deletePulseByUser(userId: number, recordId: number): Promise<void> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.deletePulse(patientId, recordId);
  }

  async registerHeartRateByUser(
    userId: number,
    dto: CreateHeartRateDto,
  ): Promise<HeartRateRecoveryRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.registerHeartRate(patientId, dto);
  }

  async updateHeartRateByUser(
    userId: number,
    recordId: number,
    dto: UpdateHeartRateDto,
  ): Promise<HeartRateRecoveryRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.updateHeartRate(patientId, recordId, dto);
  }

  async deleteHeartRateByUser(userId: number, recordId: number): Promise<void> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.deleteHeartRate(patientId, recordId);
  }

  async registerBodyMassByUser(
    userId: number,
    dto: CreateBodyMassDto,
    images?: BodyMassImageUploads,
  ): Promise<NumericVitalRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.registerBodyMass(patientId, dto, images);
  }

  async updateBodyMassByUser(
    userId: number,
    recordId: number,
    dto: UpdateBodyMassDto,
    images?: BodyMassImageUploads,
  ): Promise<NumericVitalRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.updateBodyMass(patientId, recordId, dto, images);
  }

  async deleteBodyMassByUser(userId: number, recordId: number): Promise<void> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.deleteBodyMass(patientId, recordId);
  }

  async registerGlycemiaByUser(
    userId: number,
    dto: CreateGlycemiaDto,
  ): Promise<NumericVitalRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.registerGlycemia(patientId, dto);
  }

  async updateGlycemiaByUser(
    userId: number,
    recordId: number,
    dto: UpdateGlycemiaDto,
  ): Promise<NumericVitalRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.updateGlycemia(patientId, recordId, dto);
  }

  async deleteGlycemiaByUser(userId: number, recordId: number): Promise<void> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.deleteGlycemia(patientId, recordId);
  }

  async registerBloodPressureByUser(
    userId: number,
    dto: CreateBloodPressureDto,
  ): Promise<BloodPressureRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.registerBloodPressure(patientId, dto);
  }

  async updateBloodPressureByUser(
    userId: number,
    recordId: number,
    dto: UpdateBloodPressureDto,
  ): Promise<BloodPressureRecord> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.updateBloodPressure(patientId, recordId, dto);
  }

  async deleteBloodPressureByUser(
    userId: number,
    recordId: number,
  ): Promise<void> {
    const patientId = await this.resolvePatientIdByUser(userId);
    return this.deleteBloodPressure(patientId, recordId);
  }
}
