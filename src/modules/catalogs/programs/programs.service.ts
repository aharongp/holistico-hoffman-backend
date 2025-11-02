import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { CreateProgramActivityDto } from './dto/create-program-activity.dto';
import { UpdateProgramActivityDto } from './dto/update-program-activity.dto';
import { PrismaService } from '../../../prisma/prisma.service';

export type PublicProgram = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  user_created?: string | null;
};

export type PublicActivity = {
  id: number;
  nombre?: string | null;
  descripcion?: string | null;
  dia?: string | null;
  hora?: string | null;
  user_created?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
};

export type PublicProgramDetails = PublicProgram & {
  activities: PublicActivity[];
};

const DAY_ABBREVIATIONS: Record<string, string> = {
  mon: 'Mon',
  monday: 'Mon',
  lunes: 'Mon',
  tue: 'Tue',
  tuesday: 'Tue',
  martes: 'Tue',
  wed: 'Wed',
  wednesday: 'Wed',
  miercoles: 'Wed',
  miércoles: 'Wed',
  thu: 'Thu',
  thursday: 'Thu',
  jueves: 'Thu',
  fri: 'Fri',
  friday: 'Fri',
  viernes: 'Fri',
  sat: 'Sat',
  saturday: 'Sat',
  sabado: 'Sat',
  sábado: 'Sat',
  sun: 'Sun',
  sunday: 'Sun',
  domingo: 'Sun',
};

const ALLOWED_DAY_CODES = new Set(Object.values(DAY_ABBREVIATIONS));

@Injectable()
export class ProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  private formatTimeValue(value: Date | null | undefined): string | null {
    if (!value) {
      return null;
    }
    const hours = value.getUTCHours().toString().padStart(2, '0');
    const minutes = value.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private mapActivity(activity: {
    id: number;
    nombre: string | null;
    descripcion: string | null;
    dia: string | null;
    hora: Date | null;
    user_created: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  }): PublicActivity {
    return {
      id: activity.id,
      nombre: activity.nombre ?? null,
      descripcion: activity.descripcion ?? null,
      dia: activity.dia ?? null,
      hora: this.formatTimeValue(activity.hora),
      user_created: activity.user_created ?? null,
      created_at: activity.created_at ?? null,
      updated_at: activity.updated_at ?? null,
    };
  }

  private mapProgram(program: {
    id: number;
    nombre: string | null;
    descripcion: string | null;
    user_created: string | null;
    created_at: Date | null;
    updated_at: Date | null;
  }): PublicProgram {
    return {
      id: program.id,
      nombre: program.nombre ?? null,
      descripcion: program.descripcion ?? null,
      user_created: program.user_created ?? null,
      created_at: program.created_at ?? null,
      updated_at: program.updated_at ?? null,
    };
  }

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
    return programs.map(p => this.mapProgram(p));
  }

  async findOne(id: number): Promise<PublicProgramDetails | null> {
    const program = await this.prisma.programa.findUnique({
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
    if (!program) return null;

    const activities = await this.prisma.actividad.findMany({
      where: {
        id_programa: id,
      },
      orderBy: [
        { dia: 'asc' as const },
        { hora: 'asc' as const },
        { created_at: 'asc' as const },
      ],
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        dia: true,
        hora: true,
        user_created: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      ...this.mapProgram(program),
      activities: activities.map(activity => this.mapActivity(activity)),
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
      return this.mapProgram(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Programa con id ${id} no existe`);
      }
      throw error;
    }
  }

  async findActivities(id: number): Promise<PublicActivity[]> {
    const activities = await this.prisma.actividad.findMany({
      where: { id_programa: id },
      orderBy: [
        { dia: 'asc' as const },
        { hora: 'asc' as const },
        { created_at: 'asc' as const },
      ],
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        dia: true,
        hora: true,
        user_created: true,
        created_at: true,
        updated_at: true,
      },
    });
    return activities.map(activity => this.mapActivity(activity));
  }

  async addActivityToProgram(id: number, dto: CreateProgramActivityDto): Promise<PublicActivity> {
    const existing = await this.prisma.programa.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Programa con id ${id} no existe`);
    }

    const rawName = (dto as any).nombre ?? (dto as any).name ?? null;
    const rawDescription = (dto as any).descripcion ?? (dto as any).description ?? null;
    const rawDay = (dto as any).dia ?? (dto as any).day ?? null;
    const rawTime = (dto as any).hora ?? (dto as any).time ?? null;
    const rawUserCreated = (dto as any).user_created ?? (dto as any).userCreated ?? null;

    const nombre = typeof rawName === 'string' ? rawName.trim() : null;
    if (!nombre) {
      throw new BadRequestException('El nombre de la actividad es obligatorio');
    }

    const descripcion = typeof rawDescription === 'string' ? rawDescription.trim() : null;
    const dia = this.normalizeDay(typeof rawDay === 'string' ? rawDay : null);
    const userCreated = typeof rawUserCreated === 'string' ? rawUserCreated.trim() || null : null;

    let hora: Date | null = null;
    if (typeof rawTime === 'string' && rawTime.trim()) {
      hora = this.parseTime(rawTime);
    }

    const created = await this.prisma.actividad.create({
      data: {
        nombre,
        descripcion,
        dia,
        hora,
        id_programa: id,
        user_created: userCreated,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        dia: true,
        hora: true,
        user_created: true,
        created_at: true,
        updated_at: true,
      },
    });

    return this.mapActivity(created);
  }

  private normalizeDay(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    const lookupKey = normalized.toLowerCase();
    const mapped = DAY_ABBREVIATIONS[lookupKey];
    if (mapped) {
      return mapped;
    }

    const upperCased = normalized.charAt(0).toUpperCase() + normalized.slice(1, 3).toLowerCase();
    if (ALLOWED_DAY_CODES.has(upperCased)) {
      return upperCased;
    }

    throw new BadRequestException('El día de la actividad es inválido. Usa Mon, Tue, Wed, Thu, Fri, Sat o Sun.');
  }

  private parseTime(rawTime: string): Date {
    const normalized = rawTime.trim();
    const match = normalized.match(/^([0-1]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      throw new BadRequestException('El formato de hora debe ser HH:mm');
    }
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
  }

  async updateActivityOnProgram(id: number, activityId: number, dto: UpdateProgramActivityDto): Promise<PublicActivity> {
    const activity = await this.prisma.actividad.findUnique({
      where: { id: activityId },
      select: {
        id_programa: true,
      },
    });

    if (!activity || activity.id_programa !== id) {
      throw new NotFoundException(`Actividad ${activityId} no encontrada para el programa ${id}`);
    }

    const data: Prisma.actividadUpdateInput = {
      updated_at: new Date(),
    };

    if (Object.prototype.hasOwnProperty.call(dto, 'nombre')) {
      const rawName = (dto as any).nombre ?? (dto as any).name ?? null;
      const nombre = typeof rawName === 'string' ? rawName.trim() : null;
      if (!nombre) {
        throw new BadRequestException('El nombre de la actividad es obligatorio');
      }
      data.nombre = nombre;
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'descripcion')) {
      const rawDescription = (dto as any).descripcion ?? (dto as any).description ?? null;
      data.descripcion = typeof rawDescription === 'string' ? rawDescription.trim() || null : null;
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'dia')) {
      const rawDay = (dto as any).dia ?? (dto as any).day ?? null;
      data.dia = this.normalizeDay(typeof rawDay === 'string' ? rawDay : null);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'hora')) {
      const rawTime = (dto as any).hora ?? (dto as any).time ?? null;
      if (rawTime === null) {
        data.hora = null;
      } else if (typeof rawTime === 'string' && rawTime.trim()) {
        data.hora = this.parseTime(rawTime);
      } else {
        data.hora = null;
      }
    }

    const updated = await this.prisma.actividad.update({
      where: { id: activityId },
      data,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        dia: true,
        hora: true,
        user_created: true,
        created_at: true,
        updated_at: true,
      },
    });

    return this.mapActivity(updated);
  }

  async removeActivityFromProgram(id: number, activityId: number): Promise<{ deleted: boolean; id: number }> {
    const activity = await this.prisma.actividad.findUnique({
      where: { id: activityId },
      select: { id_programa: true },
    });

    if (!activity || activity.id_programa !== id) {
      throw new NotFoundException(`Actividad ${activityId} no encontrada para el programa ${id}`);
    }

    await this.prisma.actividad.delete({ where: { id: activityId } });

    return { deleted: true, id: activityId };
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
