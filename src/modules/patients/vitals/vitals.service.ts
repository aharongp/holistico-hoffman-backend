import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BloodPressureRecord,
  HeartRateRecoveryRecord,
  NumericVitalRecord,
  PatientVitalsSummary,
} from './entities/vital.entity';

@Injectable()
export class VitalsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private sortByDateDesc<T extends { recordedAt: string | null }>(records: T[]): T[] {
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

  private mapWeightRecords(
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
      recordedAt: this.toIso(entry.fecha),
      value: entry.pulso === null || entry.pulso === undefined ? null : this.toNumber(entry.pulso),
      rawValue: entry.pulso === null || entry.pulso === undefined ? null : String(entry.pulso),
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

  private mapBodyMassIndexRecords(
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

  private mapGlycemiaRecords(
    glycemiaEntries: Array<{
      id: number;
      fecha: Date | null;
      glicemia: string | null;
    }>,
  ): NumericVitalRecord[] {
    return glycemiaEntries.map<NumericVitalRecord>((entry) => ({
      id: entry.id,
      recordedAt: this.toIso(entry.fecha),
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
    }>,
  ): HeartRateRecoveryRecord[] {
    return heartRateEntries.map<HeartRateRecoveryRecord>((entry) => ({
      id: entry.id,
      recordedAt: this.toIso(entry.fecha),
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
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const [consultations, pulseEntries, glycemiaEntries, heartRateEntries] = await Promise.all([
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
        },
      }),
      this.prisma.paciente_glicemia.findMany({
        where: { id_paciente: patientId },
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          fecha: true,
          glicemia: true,
        },
      }),
      this.prisma.$queryRaw<Array<{
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
      }>>`
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
          entrenamiento
        FROM paciente_frecuencia_cardiaca
        WHERE id_paciente = ${patientId}
        ORDER BY fecha DESC
      `,
    ]);

    return {
      weight: this.sortByDateDesc(this.mapWeightRecords(consultations)),
      pulse: this.sortByDateDesc(this.mapPulseRecords(consultations, pulseEntries)),
      bloodPressure: this.sortByDateDesc(this.mapBloodPressureRecords(consultations)),
      bodyMassIndex: this.sortByDateDesc(this.mapBodyMassIndexRecords(consultations)),
      glycemia: this.sortByDateDesc(this.mapGlycemiaRecords(glycemiaEntries)),
      heartRateRecovery: this.sortByDateDesc(this.mapHeartRateRecords(heartRateEntries)),
    };
  }

  async getByUserId(userId: number): Promise<PatientVitalsSummary> {
    const patient = await this.prisma.paciente.findFirst({
      where: { id_usuario: userId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado para el usuario proporcionado');
    }

    return this.getByPatient(patient.id);
  }
}
