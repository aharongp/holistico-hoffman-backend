import { Injectable } from '@nestjs/common';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { PrismaService } from '../../../prisma/prisma.service';

export type PublicTopic = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  user_created?: string | null;
  tipo_instrumento?: string | null;
  id_cinta?: number | null;
  created_at?: Date | null;
  updated_at?: Date | null;
};

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTopicDto: CreateTopicDto): Promise<PublicTopic> {
    const created = await this.prisma.tema.create({
      data: {
        nombre: (createTopicDto as any).nombre ?? null,
        descripcion: (createTopicDto as any).descripcion ?? null,
        user_created: (createTopicDto as any).user_created ?? null,
        tipo_instrumento: (createTopicDto as any).tipo_instrumento ?? null,
        id_cinta: (createTopicDto as any).id_cinta ?? null,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        tipo_instrumento: true,
        id_cinta: true,
        created_at: true,
        updated_at: true,
      },
    });
    return {
      id: created.id,
      nombre: created.nombre ?? null,
      descripcion: created.descripcion ?? null,
      user_created: created.user_created ?? null,
      tipo_instrumento: created.tipo_instrumento ?? null,
      id_cinta: created.id_cinta ?? null,
      created_at: created.created_at ?? null,
      updated_at: created.updated_at ?? null,
    };
  }

  async findAll(): Promise<PublicTopic[]> {
    const rows = await this.prisma.tema.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        tipo_instrumento: true,
        id_cinta: true,
        created_at: true,
        updated_at: true,
      },
    });
    return rows.map(r => ({
      id: r.id,
      nombre: r.nombre ?? null,
      descripcion: r.descripcion ?? null,
      user_created: r.user_created ?? null,
      tipo_instrumento: r.tipo_instrumento ?? null,
      id_cinta: r.id_cinta ?? null,
      created_at: r.created_at ?? null,
      updated_at: r.updated_at ?? null,
    }));
  }

  async findOne(id: number): Promise<PublicTopic | null> {
    const t = await this.prisma.tema.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        tipo_instrumento: true,
        id_cinta: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!t) return null;
    return {
      id: t.id,
      nombre: t.nombre ?? null,
      descripcion: t.descripcion ?? null,
      user_created: t.user_created ?? null,
      tipo_instrumento: t.tipo_instrumento ?? null,
      id_cinta: t.id_cinta ?? null,
      created_at: t.created_at ?? null,
      updated_at: t.updated_at ?? null,
    };
  }

  async update(id: number, updateTopicDto: UpdateTopicDto): Promise<PublicTopic | null> {
    const updated = await this.prisma.tema.update({
      where: { id },
      data: {
        nombre: (updateTopicDto as any).nombre,
        descripcion: (updateTopicDto as any).descripcion,
        tipo_instrumento: (updateTopicDto as any).tipo_instrumento,
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        user_created: true,
        tipo_instrumento: true,
        id_cinta: true,
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
      tipo_instrumento: updated.tipo_instrumento ?? null,
      id_cinta: updated.id_cinta ?? null,
      created_at: updated.created_at ?? null,
      updated_at: updated.updated_at ?? null,
    };
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.prisma.tema.delete({ where: { id } });
    return { deleted: true };
  }
}
