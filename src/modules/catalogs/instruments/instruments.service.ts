import { Injectable } from '@nestjs/common';
import { CreateInstrumentDto } from './dto/create-instrument.dto';
import { UpdateInstrumentDto } from './dto/update-instrument.dto';
import { PrismaService } from '../../../prisma/prisma.service';

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

@Injectable()
export class InstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInstrumentDto: CreateInstrumentDto): Promise<PublicInstrument> {
    const created = await this.prisma.instrumento.create({
      data: {
        id_instrumento_tipo: (createInstrumentDto as any).id_instrumento_tipo ?? null,
        id_tema: (createInstrumentDto as any).id_tema ?? null,
        descripcion: (createInstrumentDto as any).descripcion ?? null,
        recurso: (createInstrumentDto as any).recurso ?? null,
        activo: (createInstrumentDto as any).activo ?? 1,
        user_created: (createInstrumentDto as any).user_created ?? null,
        disponible: (createInstrumentDto as any).disponible ?? null,
        resultados: (createInstrumentDto as any).resultados ?? null,
        color_respuesta: (createInstrumentDto as any).color_respuesta ?? 0,
      },
      select: {
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
      },
    });
    return {
      id: created.id,
      id_instrumento_tipo: created.id_instrumento_tipo ?? null,
      id_tema: created.id_tema ?? null,
      descripcion: created.descripcion ?? null,
      recurso: created.recurso ?? null,
      activo: created.activo ?? null,
      user_created: created.user_created ?? null,
      created_at: created.created_at ?? null,
      updated_at: created.updated_at ?? null,
      disponible: created.disponible ?? null,
      resultados: created.resultados ?? null,
      color_respuesta: created.color_respuesta ?? null,
    };
  }

  async findAll(): Promise<PublicInstrument[]> {
    const instruments = await this.prisma.instrumento.findMany({
      select: {
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
      },
    });
    return instruments.map(i => ({
      id: i.id,
      id_instrumento_tipo: i.id_instrumento_tipo ?? null,
      id_tema: i.id_tema ?? null,
      descripcion: i.descripcion ?? null,
      recurso: i.recurso ?? null,
      activo: i.activo ?? null,
      user_created: i.user_created ?? null,
      created_at: i.created_at ?? null,
      updated_at: i.updated_at ?? null,
      disponible: i.disponible ?? null,
      resultados: i.resultados ?? null,
      color_respuesta: i.color_respuesta ?? null,
    }));
  }

  async findOne(id: number): Promise<PublicInstrument | null> {
    const i = await this.prisma.instrumento.findUnique({
      where: { id },
      select: {
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
      },
    });
    if (!i) return null;
    return {
      id: i.id,
      id_instrumento_tipo: i.id_instrumento_tipo ?? null,
      id_tema: i.id_tema ?? null,
      descripcion: i.descripcion ?? null,
      recurso: i.recurso ?? null,
      activo: i.activo ?? null,
      user_created: i.user_created ?? null,
      created_at: i.created_at ?? null,
      updated_at: i.updated_at ?? null,
      disponible: i.disponible ?? null,
      resultados: i.resultados ?? null,
      color_respuesta: i.color_respuesta ?? null,
    };
  }

  async update(id: number, updateInstrumentDto: UpdateInstrumentDto): Promise<PublicInstrument | null> {
    const updated = await this.prisma.instrumento.update({
      where: { id },
      data: {
        id_instrumento_tipo: (updateInstrumentDto as any).id_instrumento_tipo,
        id_tema: (updateInstrumentDto as any).id_tema,
        descripcion: (updateInstrumentDto as any).descripcion,
        recurso: (updateInstrumentDto as any).recurso,
        activo: (updateInstrumentDto as any).activo,
        disponible: (updateInstrumentDto as any).disponible,
        resultados: (updateInstrumentDto as any).resultados,
        color_respuesta: (updateInstrumentDto as any).color_respuesta,
      },
      select: {
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
      },
    });
    if (!updated) return null;
    return {
      id: updated.id,
      id_instrumento_tipo: updated.id_instrumento_tipo ?? null,
      id_tema: updated.id_tema ?? null,
      descripcion: updated.descripcion ?? null,
      recurso: updated.recurso ?? null,
      activo: updated.activo ?? null,
      user_created: updated.user_created ?? null,
      created_at: updated.created_at ?? null,
      updated_at: updated.updated_at ?? null,
      disponible: updated.disponible ?? null,
      resultados: updated.resultados ?? null,
      color_respuesta: updated.color_respuesta ?? null,
    };
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
    return types.map(t => ({
      id: t.id,
      nombre: t.nombre ?? null,
      descripcion: t.descripcion ?? null,
      user_created: t.user_created ?? null,
      created_at: t.created_at ?? null,
      updated_at: t.updated_at ?? null,
      id_criterio: t.id_criterio ?? null,
    }));
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
    return types.map(t => ({
      id: t.id,
      nombre: t.nombre ?? null,
      descripcion: t.descripcion ?? null,
      user_created: t.user_created ?? null,
      created_at: t.created_at ?? null,
      updated_at: t.updated_at ?? null,
      id_criterio: t.id_criterio ?? null,
    }));
  }

  // Return instruments that belong to a given instrument type id
  async findByType(typeId: number): Promise<PublicInstrument[]> {
    const instruments = await this.prisma.instrumento.findMany({
      where: { id_instrumento_tipo: typeId },
      select: {
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
      },
    });
    return instruments.map(i => ({
      id: i.id,
      id_instrumento_tipo: i.id_instrumento_tipo ?? null,
      id_tema: i.id_tema ?? null,
      descripcion: i.descripcion ?? null,
      recurso: i.recurso ?? null,
      activo: i.activo ?? null,
      user_created: i.user_created ?? null,
      created_at: i.created_at ?? null,
      updated_at: i.updated_at ?? null,
      disponible: i.disponible ?? null,
      resultados: i.resultados ?? null,
      color_respuesta: i.color_respuesta ?? null,
    }));
  }
}
