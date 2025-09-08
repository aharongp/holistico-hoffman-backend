import { Injectable } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PrismaService } from '../../../prisma/prisma.service';

export type PublicPatient = {
  id: number;
  cedula?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  genero?: string | null;
  fecha_nacimiento?: Date | null;
  telefono?: string | null;
  direccion?: string | null;
  activo?: number | null;
  id_programa?: number | null;
  created_at?: Date | null;
  updated_at?: Date | null;
};

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPatientDto: CreatePatientDto): Promise<PublicPatient> {
    const created = await this.prisma.paciente.create({
      data: {
        cedula: (createPatientDto as any).cedula ?? null,
        nombres: (createPatientDto as any).nombres ?? null,
        apellidos: (createPatientDto as any).apellidos ?? null,
        genero: (createPatientDto as any).genero ?? null,
        fecha_nacimiento: (createPatientDto as any).fecha_nacimiento ?? null,
        telefono: (createPatientDto as any).telefono ?? null,
        direccion: (createPatientDto as any).direccion ?? null,
        activo: (createPatientDto as any).activo ?? 1,
        id_programa: (createPatientDto as any).id_programa ?? null,
      },
      select: {
        id: true,
        cedula: true,
        nombres: true,
        apellidos: true,
        genero: true,
        fecha_nacimiento: true,
        telefono: true,
        direccion: true,
        activo: true,
        id_programa: true,
        created_at: true,
        updated_at: true,
      },
    });
    return {
      id: created.id,
      cedula: created.cedula ?? null,
      nombres: created.nombres ?? null,
      apellidos: created.apellidos ?? null,
      genero: created.genero ?? null,
      fecha_nacimiento: created.fecha_nacimiento ?? null,
      telefono: created.telefono ?? null,
      direccion: created.direccion ?? null,
      activo: created.activo ?? null,
      id_programa: created.id_programa ?? null,
      created_at: created.created_at ?? null,
      updated_at: created.updated_at ?? null,
    };
  }

  async findAll(): Promise<PublicPatient[]> {
    const patients = await this.prisma.paciente.findMany({
      select: {
        id: true,
        cedula: true,
        nombres: true,
        apellidos: true,
        genero: true,
        fecha_nacimiento: true,
        telefono: true,
        direccion: true,
        activo: true,
        id_programa: true,
        created_at: true,
        updated_at: true,
      },
    });
    return patients.map(p => ({
      id: p.id,
      cedula: p.cedula ?? null,
      nombres: p.nombres ?? null,
      apellidos: p.apellidos ?? null,
      genero: p.genero ?? null,
      fecha_nacimiento: p.fecha_nacimiento ?? null,
      telefono: p.telefono ?? null,
      direccion: p.direccion ?? null,
      activo: p.activo ?? null,
      id_programa: p.id_programa ?? null,
      created_at: p.created_at ?? null,
      updated_at: p.updated_at ?? null,
    }));
  }

  async findOne(id: number): Promise<PublicPatient | null> {
    const p = await this.prisma.paciente.findUnique({
      where: { id },
      select: {
        id: true,
        cedula: true,
        nombres: true,
        apellidos: true,
        genero: true,
        fecha_nacimiento: true,
        telefono: true,
        direccion: true,
        activo: true,
        id_programa: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!p) return null;
    return {
      id: p.id,
      cedula: p.cedula ?? null,
      nombres: p.nombres ?? null,
      apellidos: p.apellidos ?? null,
      genero: p.genero ?? null,
      fecha_nacimiento: p.fecha_nacimiento ?? null,
      telefono: p.telefono ?? null,
      direccion: p.direccion ?? null,
      activo: p.activo ?? null,
      id_programa: p.id_programa ?? null,
      created_at: p.created_at ?? null,
      updated_at: p.updated_at ?? null,
    };
  }

  async update(id: number, updatePatientDto: UpdatePatientDto): Promise<PublicPatient | null> {
    const updated = await this.prisma.paciente.update({
      where: { id },
      data: {
        cedula: (updatePatientDto as any).cedula,
        nombres: (updatePatientDto as any).nombres,
        apellidos: (updatePatientDto as any).apellidos,
        genero: (updatePatientDto as any).genero,
        fecha_nacimiento: (updatePatientDto as any).fecha_nacimiento,
        telefono: (updatePatientDto as any).telefono,
        direccion: (updatePatientDto as any).direccion,
        activo: (updatePatientDto as any).activo,
        id_programa: (updatePatientDto as any).id_programa,
      },
      select: {
        id: true,
        cedula: true,
        nombres: true,
        apellidos: true,
        genero: true,
        fecha_nacimiento: true,
        telefono: true,
        direccion: true,
        activo: true,
        id_programa: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!updated) return null;
    return {
      id: updated.id,
      cedula: updated.cedula ?? null,
      nombres: updated.nombres ?? null,
      apellidos: updated.apellidos ?? null,
      genero: updated.genero ?? null,
      fecha_nacimiento: updated.fecha_nacimiento ?? null,
      telefono: updated.telefono ?? null,
      direccion: updated.direccion ?? null,
      activo: updated.activo ?? null,
      id_programa: updated.id_programa ?? null,
      created_at: updated.created_at ?? null,
      updated_at: updated.updated_at ?? null,
    };
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.prisma.paciente.delete({ where: { id } });
    return { deleted: true };
  }
}
