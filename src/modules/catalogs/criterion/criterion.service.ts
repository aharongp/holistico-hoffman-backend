import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type PublicCriterion = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  user_created?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
};

@Injectable()
export class CriterionService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeString(value: unknown): string | null {
    if (value === null || typeof value === 'undefined') {
      return null;
    }

    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
  }

  private buildCreateData(dto: CreateCriterionDto) {
    const nombre = this.normalizeString(dto.nombre);
    if (!nombre) {
      throw new BadRequestException('El nombre del criterio es obligatorio');
    }

    return {
      nombre,
      descripcion: this.normalizeString(dto.descripcion),
      user_created: this.normalizeString(dto.user_created),
    };
  }

  private buildUpdateData(dto: UpdateCriterionDto) {
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

    return data;
  }

  private mapCriterion<TEntity extends {
    id: number;
    nombre: string | null;
    descripcion: string | null;
    user_created: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  }>(record: TEntity): PublicCriterion {
    return {
      id: record.id,
      nombre: record.nombre ?? null,
      descripcion: record.descripcion ?? null,
      user_created: record.user_created ?? null,
      created_at: record.created_at ?? null,
      updated_at: record.updated_at ?? null,
    };
  }

  async create(createCriterionDto: CreateCriterionDto): Promise<PublicCriterion> {
    const data = this.buildCreateData(createCriterionDto);

    const created = await this.prisma.criterio.create({
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

    return this.mapCriterion(created);
  }

  async findAll(): Promise<PublicCriterion[]> {
    const criteria = await this.prisma.criterio.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return criteria.map((criterion) => this.mapCriterion(criterion));
  }

  async findOne(id: number): Promise<PublicCriterion> {
    const criterion = await this.prisma.criterio.findUnique({
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

    if (!criterion) {
      throw new NotFoundException(`Criterion with id ${id} not found`);
    }

    return this.mapCriterion(criterion);
  }

  async update(id: number, updateCriterionDto: UpdateCriterionDto): Promise<PublicCriterion> {
    const data = this.buildUpdateData(updateCriterionDto);

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    try {
      const updated = await this.prisma.criterio.update({
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

      return this.mapCriterion(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Criterion with id ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    try {
      await this.prisma.criterio.delete({ where: { id } });
      return { deleted: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Criterion with id ${id} not found`);
      }
      throw error;
    }
  }
}
