import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, cinta } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRibbonDto } from './dto/create-ribbon.dto';
import { UpdateRibbonDto } from './dto/update-ribbon.dto';
import { Ribbon } from './entities/ribbon.entity';

@Injectable()
export class RibbonService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRibbonDto: CreateRibbonDto): Promise<Ribbon> {
    const data = this.buildWriteData(createRibbonDto);
    const now = new Date();

    if (typeof data.created_at === 'undefined') {
      data.created_at = now;
    }

    data.updated_at = now;

    const ribbon = await this.prisma.cinta.create({ data });
    return this.mapRibbon(ribbon);
  }

  async findAll(): Promise<Ribbon[]> {
    const ribbons = await this.prisma.cinta.findMany({
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    });

    return ribbons.map((record) => this.mapRibbon(record));
  }

  async findOne(id: number): Promise<Ribbon> {
    const ribbon = await this.getRibbonOrThrow(id);
    return this.mapRibbon(ribbon);
  }

  async update(id: number, updateRibbonDto: UpdateRibbonDto): Promise<Ribbon> {
    await this.getRibbonOrThrow(id);

    const data = this.buildWriteData(updateRibbonDto);
    data.updated_at = new Date();

    const ribbon = await this.prisma.cinta.update({
      where: { id },
      data,
    });

    return this.mapRibbon(ribbon);
  }

  async remove(id: number): Promise<Ribbon> {
    await this.getRibbonOrThrow(id);

    const ribbon = await this.prisma.cinta.delete({ where: { id } });
    return this.mapRibbon(ribbon);
  }

  private async getRibbonOrThrow(id: number): Promise<cinta> {
    const ribbon = await this.prisma.cinta.findUnique({ where: { id } });
    if (!ribbon) {
      throw new NotFoundException(`La cinta con id ${id} no existe.`);
    }
    return ribbon;
  }

  private buildWriteData(
    dto: Partial<CreateRibbonDto>,
  ): Prisma.cintaCreateInput & Prisma.cintaUpdateInput {
    const data: Record<string, unknown> = {};
    const source = dto as Record<string, unknown>;

    if (Object.prototype.hasOwnProperty.call(source, 'nombre')) {
      data.nombre = this.normalizeString(source.nombre);
    }
    if (Object.prototype.hasOwnProperty.call(source, 'color')) {
      data.color = this.normalizeString(source.color);
    }
    if (Object.prototype.hasOwnProperty.call(source, 'orden')) {
      data.orden = this.normalizeInteger(source.orden);
    }
    if (Object.prototype.hasOwnProperty.call(source, 'descripcion')) {
      data.descripcion = this.normalizeString(source.descripcion);
    }
    if (Object.prototype.hasOwnProperty.call(source, 'userCreated')) {
      data.user_created = this.normalizeString(source.userCreated);
    }
    if (Object.prototype.hasOwnProperty.call(source, 'bgColor')) {
      data.bg_color = this.normalizeString(source.bgColor);
    }
    if (Object.prototype.hasOwnProperty.call(source, 'siguienteCinta')) {
      data.siguiente_cinta = this.normalizeInteger(source.siguienteCinta);
    }
    if (Object.prototype.hasOwnProperty.call(source, 'hexadecimal')) {
      data.hexadecimal = this.normalizeString(source.hexadecimal);
    }
    if (Object.prototype.hasOwnProperty.call(source, 'hilo')) {
      data.hilo = this.normalizeString(source.hilo);
    }
    if (Object.prototype.hasOwnProperty.call(source, 'cinta')) {
      data.cinta = this.normalizeInteger(source.cinta);
    }

    return data as Prisma.cintaCreateInput & Prisma.cintaUpdateInput;
  }

  private normalizeString(value: unknown): string | null {
    if (value === null || typeof value === 'undefined') {
      return null;
    }

    const normalized = String(value).trim();
    return normalized.length ? normalized : null;
  }

  private normalizeInteger(value: unknown): number | null {
    if (value === null || typeof value === 'undefined') {
      return null;
    }

    const parsed =
      typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Math.trunc(parsed);
  }

  private mapRibbon(record: cinta): Ribbon {
    return {
      id: record.id,
      nombre: record.nombre ?? null,
      color: record.color ?? null,
      orden: record.orden ?? null,
      descripcion: record.descripcion ?? null,
      userCreated: record.user_created ?? null,
      createdAt: record.created_at ?? null,
      updatedAt: record.updated_at ?? null,
      bgColor: record.bg_color ?? null,
      siguienteCinta: record.siguiente_cinta ?? null,
      hexadecimal: record.hexadecimal ?? null,
      hilo: record.hilo ?? null,
      cinta: record.cinta ?? null,
    };
  }
}
