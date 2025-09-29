import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    const rawName = (createProgramDto as any).nombre ?? (createProgramDto as any).name ?? null;
    const rawDescription = (createProgramDto as any).descripcion ?? (createProgramDto as any).description ?? null;
    const rawUserCreated = (createProgramDto as any).user_created ?? (createProgramDto as any).userCreated ?? null;

    const nombre = typeof rawName === 'string' ? rawName.trim() : null;
    if (!nombre) {
      throw new BadRequestException('El nombre del programa es obligatorio');
    }

    const descripcion = typeof rawDescription === 'string' ? rawDescription.trim() : null;
    const userCreated = typeof rawUserCreated === 'string' ? rawUserCreated.trim() : null;

    const created = await this.prisma.programa.create({
      data: {
        nombre,
        descripcion,
        user_created: userCreated,
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
    const rawName = (updateProgramDto as any).nombre ?? (updateProgramDto as any).name;
    const rawDescription = (updateProgramDto as any).descripcion ?? (updateProgramDto as any).description;

    const data: Record<string, any> = {};

    if (typeof rawName !== 'undefined') {
      const nombre = typeof rawName === 'string' ? rawName.trim() : rawName;
      data.nombre = nombre === '' ? null : nombre;
    }

    if (typeof rawDescription !== 'undefined') {
      const descripcion = typeof rawDescription === 'string' ? rawDescription.trim() : rawDescription;
      data.descripcion = descripcion === '' ? null : descripcion;
    }

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    try {
      const updated = await this.prisma.programa.update({
        where: { id },
        data,
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Programa con id ${id} no existe`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<{ deleted: boolean; id: number }> {
    try {
      await this.prisma.programa.delete({ where: { id } });
      return { deleted: true, id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Programa con id ${id} no existe`);
      }
      throw error;
    }
  }
}
