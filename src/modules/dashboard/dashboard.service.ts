import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PatientService } from '../patients/patient/patient.service';

export type GenderDistributionItem = {
  gender: string;
  count: number;
  percentage: number;
};

export type DashboardSummary = {
  totals: {
    patients: number;
    users: number;
    instruments: number;
  };
  patientGenderDistribution: GenderDistributionItem[];
  patientsByProgram: PatientsByProgramItem[];
};

export type PatientsByProgramItem = {
  programId: number | null;
  programName: string;
  count: number;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientService: PatientService,
  ) {}

  async getPatientCount(): Promise<number> {
    return this.prisma.paciente.count();
  }

  async getUserCount(): Promise<number> {
    return this.prisma.usuario.count();
  }

  async getInstrumentCount(): Promise<number> {
    return this.prisma.instrumento.count();
  }

  async getPatientGenderDistribution(): Promise<GenderDistributionItem[]> {
    const patients = await this.prisma.paciente.findMany({
      select: { genero: true },
    });

    if (!patients.length) {
      return [];
    }

    const normalize = (
      value: string | null | undefined,
    ): 'male' | 'female' | 'other' => {
      const normalized = (value ?? '').toString().trim().toLowerCase();
      if (['male', 'masculino', 'm', 'h', 'hombre'].includes(normalized)) {
        return 'male';
      }
      if (['female', 'femenino', 'f', 'mujer'].includes(normalized)) {
        return 'female';
      }
      return 'other';
    };

    const labels: Record<'male' | 'female' | 'other', string> = {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Sin especificar',
    };

    const counts: Record<'male' | 'female' | 'other', number> = {
      male: 0,
      female: 0,
      other: 0,
    };

    patients.forEach((patient) => {
      const key = normalize(patient.genero);
      counts[key] += 1;
    });

    const total = patients.length;

    return (Object.keys(counts) as Array<'male' | 'female' | 'other'>)
      .map((key) => ({
        gender: labels[key],
        count: counts[key],
        percentage: total
          ? Number(((counts[key] / total) * 100).toFixed(2))
          : 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  async getPatientsByProgram(): Promise<PatientsByProgramItem[]> {
    const programs = await this.prisma.programa.findMany({
      select: {
        id: true,
        nombre: true,
      },
    });

    const programEntries = await Promise.all(
      programs.map(async (program) => {
        const patients = await this.patientService.findByProgramId(program.id);
        return {
          programId: program.id,
          programName: program.nombre ?? `Programa ${program.id}`,
          count: patients.length,
        } as PatientsByProgramItem;
      }),
    );

    const withoutProgramPatients =
      await this.patientService.findByProgramId(null);
    const entries = [...programEntries];

    if (withoutProgramPatients.length) {
      entries.push({
        programId: null,
        programName: 'Sin programa',
        count: withoutProgramPatients.length,
      });
    }

    return entries.sort((a, b) => b.count - a.count);
  }

  async getSummary(): Promise<DashboardSummary> {
    const [
      patients,
      users,
      instruments,
      patientGenderDistribution,
      patientsByProgram,
    ] = await Promise.all([
      this.getPatientCount(),
      this.getUserCount(),
      this.getInstrumentCount(),
      this.getPatientGenderDistribution(),
      this.getPatientsByProgram(),
    ]);

    return {
      totals: {
        patients,
        users,
        instruments,
      },
      patientGenderDistribution,
      patientsByProgram,
    };
  }
}
