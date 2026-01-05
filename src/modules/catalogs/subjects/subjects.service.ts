import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type PublicSubject = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  user_created?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  tipo_instrumento?: string | null;
  id_cinta?: number | null;
};

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeString(value: unknown): string | null {
    if (value === null || typeof value === 'undefined') {
      return null;
    }

    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
  }

  private normalizeNumber(value: unknown): number | null {
    if (value === null || typeof value === 'undefined' || value === '') {
      return null;
    }

    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private buildCreateData(dto: CreateSubjectDto) {
    const nombre = this.normalizeString(dto.nombre);
    if (!nombre) {
      throw new BadRequestException('El nombre del tema es obligatorio');
    }

    return {
      nombre,
      descripcion: this.normalizeString(dto.descripcion),
      user_created: this.normalizeString(dto.user_created),
      tipo_instrumento: this.normalizeString(dto.tipo_instrumento),
      id_cinta: this.normalizeNumber(dto.id_cinta),
    };
  }

  private buildUpdateData(dto: UpdateSubjectDto) {
    const data: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(dto, 'nombre')) {
      data.nombre = this.normalizeString(dto.nombre);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'descripcion')) {
      data.descripcion = this.normalizeString(dto.descripcion);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'user_created')) {
      data.user_created = this.normalizeString(dto.user_created);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'tipo_instrumento')) {
      data.tipo_instrumento = this.normalizeString(dto.tipo_instrumento);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'id_cinta')) {
      data.id_cinta = this.normalizeNumber(dto.id_cinta);
    }

    return data;
  }

  private mapSubject<
    TEntity extends {
      id: number;
      nombre: string | null;
      descripcion: string | null;
      user_created: string | null;
      created_at: Date | null;
      updated_at: Date | null;
      tipo_instrumento: string | null;
      id_cinta: number | null;
    },
  >(record: TEntity): PublicSubject {
    return {
      id: record.id,
      nombre: record.nombre ?? null,
      descripcion: record.descripcion ?? null,
      user_created: record.user_created ?? null,
      created_at: record.created_at ?? null,
      updated_at: record.updated_at ?? null,
      tipo_instrumento: record.tipo_instrumento ?? null,
      id_cinta: record.id_cinta ?? null,
    };
  }

  async create(createSubjectDto: CreateSubjectDto): Promise<PublicSubject> {
    const data = this.buildCreateData(createSubjectDto);

    const created = await this.prisma.tema.create({
      data,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
        tipo_instrumento: true,
        id_cinta: true,
      },
    });

    return this.mapSubject(created);
  }

  async findAll(): Promise<PublicSubject[]> {
    const subjects = await this.prisma.tema.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
        tipo_instrumento: true,
        id_cinta: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return subjects.map((subject) => this.mapSubject(subject));
  }

  async findOne(id: number): Promise<PublicSubject> {
    const subject = await this.prisma.tema.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
        tipo_instrumento: true,
        id_cinta: true,
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with id ${id} not found`);
    }

    return this.mapSubject(subject);
  }

  async update(
    id: number,
    updateSubjectDto: UpdateSubjectDto,
  ): Promise<PublicSubject> {
    const data = this.buildUpdateData(updateSubjectDto);

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    try {
      const updated = await this.prisma.tema.update({
        where: { id },
        data,
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          user_created: true,
          created_at: true,
          updated_at: true,
          tipo_instrumento: true,
          id_cinta: true,
        },
      });

      return this.mapSubject(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Subject with id ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    try {
      await this.prisma.tema.delete({ where: { id } });
      return { deleted: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Subject with id ${id} not found`);
      }
      throw error;
    }
  }
}
