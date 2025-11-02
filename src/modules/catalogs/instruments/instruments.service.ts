import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { CreateInstrumentTypeDto } from './dto/create-instrument-type.dto';
import { UpdateInstrumentTypeDto } from './dto/update-instrument-type.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type PublicInstrument = {
  id: number;
  id_instrumento_tipo?: number | null;
  id_tema?: number | null;
  descripcion?: string | null;
  recurso?: string | null;
  activo?: number | null;
  user_created?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  disponible?: string | null;
  resultados?: string | null;
  color_respuesta?: number | null;
};

export type PublicInstrumentType = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  user_created?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  id_criterio?: number | null;
};

const INSTRUMENT_SELECT = {
  id: true,
  id_instrumento_tipo: true,
  id_tema: true,
  descripcion: true,
  recurso: true,
  activo: true,
  user_created: true,
  created_at: true,
  updated_at: true,
  disponible: true,
  resultados: true,
  color_respuesta: true,
} satisfies Prisma.instrumentoSelect;

type InstrumentRecord = Prisma.instrumentoGetPayload<{ select: typeof INSTRUMENT_SELECT }>;

type InstrumentTypeRecord = Prisma.instrumento_tipoGetPayload<{
  select: {
    id: true;
    nombre: true;
    descripcion: true;
    user_created: true;
    created_at: true;
    updated_at: true;
    id_criterio: true;
  };
}>;

@Injectable()
export class InstrumentsService {
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

  private normalizeActiveFlag(value: unknown): number {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'number') {
      return value ? 1 : 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return 1;
      if (['1', 'true', 'activo', 'yes', 'si', 'sí'].includes(normalized)) {
        return 1;
      }
      if (['0', 'false', 'inactivo', 'no'].includes(normalized)) {
        return 0;
      }
      const numeric = Number(normalized);
      if (Number.isFinite(numeric)) {
        return numeric ? 1 : 0;
      }
    }

    return 1;
  }

  private normalizeColorFlag(value: unknown): number {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'number') {
      return value === 1 ? 1 : 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return 0;
      if (['1', 'true', 'yes', 'si', 'sí'].includes(normalized)) {
        return 1;
      }
      if (['0', 'false', 'no'].includes(normalized)) {
        return 0;
      }
      const numeric = Number(normalized);
      if (Number.isFinite(numeric)) {
        return numeric === 1 ? 1 : 0;
      }
    }

    return 0;
  }

  private normalizeResultDelivery(value: unknown): 'sistema' | 'programado' | null {
    if (value === null || typeof value === 'undefined') {
      return null;
    }

    const normalized = String(value).trim().toLowerCase();
    if (!normalized || normalized === 'null' || normalized === 'ninguno' || normalized === 'none') {
      return null;
    }

    if (normalized === 'sistema' || normalized === 'programado') {
      return normalized;
    }

    throw new BadRequestException('El valor de resultados solo puede ser "sistema" o "programado"');
  }

  private buildCreateData(dto: CreateInstrumentDto): Prisma.instrumentoCreateInput {
    const idInstrumentType = this.normalizeNumber(dto.id_instrumento_tipo ?? dto.instrumentTypeId);
    const idTema = this.normalizeNumber(dto.id_tema ?? dto.subjectId);

    return {
      id_instrumento_tipo: idInstrumentType,
      id_tema: idTema,
      descripcion: this.normalizeString(dto.descripcion ?? dto.description),
      recurso: this.normalizeString(dto.recurso ?? dto.resource),
      activo: this.normalizeActiveFlag(dto.activo ?? dto.isActive),
      user_created: this.normalizeString(dto.user_created ?? dto.userCreated),
      disponible: this.normalizeString(dto.disponible ?? dto.availability),
      resultados: this.normalizeResultDelivery(dto.resultados ?? dto.resultDelivery),
      color_respuesta: this.normalizeColorFlag(dto.color_respuesta ?? dto.colorResponse),
    };
  }

  private buildUpdateData(dto: UpdateInstrumentDto): Prisma.instrumentoUpdateInput {
    const data: Prisma.instrumentoUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(dto, 'id_instrumento_tipo') || Object.prototype.hasOwnProperty.call(dto, 'instrumentTypeId')) {
      data.id_instrumento_tipo = this.normalizeNumber(dto.id_instrumento_tipo ?? dto.instrumentTypeId);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'id_tema') || Object.prototype.hasOwnProperty.call(dto, 'subjectId')) {
      data.id_tema = this.normalizeNumber(dto.id_tema ?? dto.subjectId);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'descripcion') || Object.prototype.hasOwnProperty.call(dto, 'description')) {
      data.descripcion = this.normalizeString(dto.descripcion ?? dto.description);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'recurso') || Object.prototype.hasOwnProperty.call(dto, 'resource')) {
      data.recurso = this.normalizeString(dto.recurso ?? dto.resource);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'activo') || Object.prototype.hasOwnProperty.call(dto, 'isActive')) {
      data.activo = this.normalizeActiveFlag(dto.activo ?? dto.isActive);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'user_created') || Object.prototype.hasOwnProperty.call(dto, 'userCreated')) {
      data.user_created = this.normalizeString(dto.user_created ?? dto.userCreated);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'disponible') || Object.prototype.hasOwnProperty.call(dto, 'availability')) {
      data.disponible = this.normalizeString(dto.disponible ?? dto.availability);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'resultados') || Object.prototype.hasOwnProperty.call(dto, 'resultDelivery')) {
      data.resultados = this.normalizeResultDelivery(dto.resultados ?? dto.resultDelivery);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'color_respuesta') || Object.prototype.hasOwnProperty.call(dto, 'colorResponse')) {
      data.color_respuesta = this.normalizeColorFlag(dto.color_respuesta ?? dto.colorResponse);
    }

    return data;
  }

  private mapInstrument(record: InstrumentRecord): PublicInstrument {
    return {
      id: record.id,
      id_instrumento_tipo: record.id_instrumento_tipo ?? null,
      id_tema: record.id_tema ?? null,
      descripcion: record.descripcion ?? null,
      recurso: record.recurso ?? null,
      activo: record.activo ?? null,
      user_created: record.user_created ?? null,
      created_at: record.created_at ?? null,
      updated_at: record.updated_at ?? null,
      disponible: record.disponible ?? null,
      resultados: record.resultados ?? null,
      color_respuesta: record.color_respuesta ?? null,
    };
  }

  private mapInstrumentType(record: InstrumentTypeRecord): PublicInstrumentType {
    return {
      id: record.id,
      nombre: record.nombre ?? null,
      descripcion: record.descripcion ?? null,
      user_created: record.user_created ?? null,
      created_at: record.created_at ?? null,
      updated_at: record.updated_at ?? null,
      id_criterio: record.id_criterio ?? null,
    };
  }

  private normalizeTypeStrings(value: unknown): string | null {
    if (value === null || typeof value === 'undefined') {
      return null;
    }

    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
  }

  private normalizeTypeNumber(value: unknown): number | null {
    if (value === null || typeof value === 'undefined' || value === '') {
      return null;
    }

    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private buildTypeCreateData(dto: CreateInstrumentTypeDto): Prisma.instrumento_tipoCreateInput {
    const nombre = this.normalizeTypeStrings(dto.nombre);
    if (!nombre) {
      throw new BadRequestException('El nombre del tipo de instrumento es obligatorio');
    }

    return {
      nombre,
      descripcion: this.normalizeTypeStrings(dto.descripcion),
      user_created: this.normalizeTypeStrings(dto.user_created),
      id_criterio: this.normalizeTypeNumber(dto.id_criterio),
    };
  }

  private buildTypeUpdateData(dto: UpdateInstrumentTypeDto): Prisma.instrumento_tipoUpdateInput {
    const data: Prisma.instrumento_tipoUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(dto, 'nombre')) {
      const nombre = this.normalizeTypeStrings(dto.nombre);
      if (!nombre) {
        throw new BadRequestException('El nombre del tipo de instrumento es obligatorio');
      }
      data.nombre = nombre;
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'descripcion')) {
      data.descripcion = this.normalizeTypeStrings(dto.descripcion);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'user_created')) {
      data.user_created = this.normalizeTypeStrings(dto.user_created);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'id_criterio')) {
      data.id_criterio = this.normalizeTypeNumber(dto.id_criterio);
    }

    return data;
  }

  async create(createInstrumentDto: CreateInstrumentDto): Promise<PublicInstrument> {
    const data = this.buildCreateData(createInstrumentDto);

    const created = await this.prisma.instrumento.create({
      data,
      select: INSTRUMENT_SELECT,
    });

    return this.mapInstrument(created);
  }

  async findAll(): Promise<PublicInstrument[]> {
    const instruments = await this.prisma.instrumento.findMany({
      select: INSTRUMENT_SELECT,
    });
    return instruments.map(i => this.mapInstrument(i));
  }

  async findOne(id: number): Promise<PublicInstrument | null> {
    const i = await this.prisma.instrumento.findUnique({
      where: { id },
      select: INSTRUMENT_SELECT,
    });
    if (!i) return null;
    return this.mapInstrument(i);
  }

  async update(id: number, updateInstrumentDto: UpdateInstrumentDto): Promise<PublicInstrument | null> {
    const data = this.buildUpdateData(updateInstrumentDto);
    const updated = await this.prisma.instrumento.update({
      where: { id },
      data,
      select: INSTRUMENT_SELECT,
    });
    if (!updated) return null;
    return this.mapInstrument(updated);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.prisma.instrumento.delete({ where: { id } });
    return { deleted: true };
  }

  // Return all instrument types
  async findTypes(): Promise<PublicInstrumentType[]> {
    const types = await this.prisma.instrumento_tipo.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
        id_criterio: true,
      },
    });
    return types.map(t => this.mapInstrumentType(t));
  }

  // Return instrument types created by a specific user (matches user_created)
  async findTypesByUser(user: string): Promise<PublicInstrumentType[]> {
    const types = await this.prisma.instrumento_tipo.findMany({
      where: { user_created: user },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
        id_criterio: true,
      },
    });
    return types.map(t => this.mapInstrumentType(t));
  }

  // Return instruments that belong to a given instrument type id
  async findByType(typeId: number): Promise<PublicInstrument[]> {
    const instruments = await this.prisma.instrumento.findMany({
      where: { id_instrumento_tipo: typeId },
      select: INSTRUMENT_SELECT,
    });
    return instruments.map(i => this.mapInstrument(i));
  }

  async createType(dto: CreateInstrumentTypeDto): Promise<PublicInstrumentType> {
    const data = this.buildTypeCreateData(dto);
    const created = await this.prisma.instrumento_tipo.create({
      data,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
        id_criterio: true,
      },
    });
    return this.mapInstrumentType(created);
  }

  async updateType(id: number, dto: UpdateInstrumentTypeDto): Promise<PublicInstrumentType> {
    const data = this.buildTypeUpdateData(dto);
    const updated = await this.prisma.instrumento_tipo.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        created_at: true,
        updated_at: true,
        id_criterio: true,
      },
    });
    return this.mapInstrumentType(updated);
  }

  async removeType(id: number): Promise<{ deleted: boolean }> {
    await this.prisma.instrumento_tipo.delete({ where: { id } });
    return { deleted: true };
  }
}
