import { Injectable } from '@nestjs/common';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { PrismaService } from '../../../prisma/prisma.service';

export type PublicProgram = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  user_created?: string | null;
};

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProgramDto: CreateProgramDto): Promise<PublicProgram> {
    const created = await this.prisma.programa.create({
      data: {
        nombre: (createProgramDto as any).nombre ?? null,
        descripcion: (createProgramDto as any).descripcion ?? null,
        user_created: (createProgramDto as any).user_created ?? null,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
      },
    });
    return {
      id: created.id,
      nombre: created.nombre ?? null,
      descripcion: created.descripcion ?? null,
      user_created: created.user_created ?? null,
      created_at: created.created_at ?? null,
      updated_at: created.updated_at ?? null,
    };
  }

  async findAll(): Promise<PublicProgram[]> {
    const programs = await this.prisma.programa.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
      },
    });
    return programs.map(p => ({
      id: p.id,
      nombre: p.nombre ?? null,
      descripcion: p.descripcion ?? null,
      user_created: p.user_created ?? null,
      created_at: p.created_at ?? null,
      updated_at: p.updated_at ?? null,
    }));
  }

  async findOne(id: number): Promise<PublicProgram | null> {
    const p = await this.prisma.programa.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!p) return null;
    return {
      id: p.id,
      nombre: p.nombre ?? null,
      descripcion: p.descripcion ?? null,
      user_created: p.user_created ?? null,
      created_at: p.created_at ?? null,
      updated_at: p.updated_at ?? null,
    };
  }

  async update(id: number, updateProgramDto: UpdateProgramDto): Promise<PublicProgram | null> {
    const updated = await this.prisma.programa.update({
      where: { id },
      data: {
        nombre: (updateProgramDto as any).nombre,
        descripcion: (updateProgramDto as any).descripcion,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!updated) return null;
    return {
      id: updated.id,
      nombre: updated.nombre ?? null,
      descripcion: updated.descripcion ?? null,
      user_created: updated.user_created ?? null,
      created_at: updated.created_at ?? null,
      updated_at: updated.updated_at ?? null,
    };
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.prisma.programa.delete({ where: { id } });
    return { deleted: true };
  }
}
