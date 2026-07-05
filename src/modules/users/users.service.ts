import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { buildDefaultPasswordHash } from './user-password.util';
import { PatientService } from '../patients/patient/patient.service';

export type PublicUser = {
  id: number;
  email?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  rol?: string | null;
  created_at?: Date | null;
  last_login?: Date | null;
  active?: number | null;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly patientService: PatientService,
  ) {}

  private joinNames(firstName: string, lastName: string): string {
    const parts = [firstName, lastName]
      .map((part) => part.trim())
      .filter(Boolean);
    return parts.join(' ').trim();
  }

  private extractNames(
    username?: string | null,
    fallback?: { firstName?: string | null; lastName?: string | null },
  ): { firstName: string | null; lastName: string | null } {
    if (username && username.trim()) {
      const trimmed = username.trim();
      const segments = trimmed.split(/\s+/);
      if (segments.length === 1) {
        return { firstName: segments[0], lastName: fallback?.lastName ?? null };
      }
      return {
        firstName: segments[0],
        lastName: segments.slice(1).join(' ') || (fallback?.lastName ?? null),
      };
    }
    return {
      firstName: fallback?.firstName ?? null,
      lastName: fallback?.lastName ?? null,
    };
  }

  private mapUser<
    TEntity extends {
      id: number;
      email: string | null;
      username: string | null;
      rol: string | null;
      created_at: Date | null;
      updated_at: Date | null;
      active: number | null;
    },
  >(
    record: TEntity,
    fallbackNames?: { firstName?: string | null; lastName?: string | null },
  ): PublicUser {
    const { firstName, lastName } = this.extractNames(
      record.username,
      fallbackNames,
    );
    return {
      id: record.id,
      email: record.email,
      username: record.username,
      firstName,
      lastName,
      rol: record.rol ?? null,
      created_at: record.created_at ?? null,
      last_login: record.updated_at ?? null,
      active: record.active ?? null,
    };
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        rol: true,
        created_at: true,
        remember_token: false,
        updated_at: true,
        active: true,
      },
    });

    return users.map((u) => this.mapUser(u));
  }

  async findOne(id: number): Promise<PublicUser | null> {
    const u = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        rol: true,
        created_at: true,
        updated_at: true,
        active: true,
      },
    });
    if (!u) return null;
    return this.mapUser(u);
  }

  async create(createUserDto: CreateUserDto): Promise<PublicUser> {
    const rawFirstName =
      createUserDto.firstName ?? (createUserDto as any).first_name ?? '';
    const rawLastName =
      createUserDto.lastName ?? (createUserDto as any).last_name ?? '';
    const rawEmail = createUserDto.email ?? (createUserDto as any).correo ?? '';
    const rawRole =
      createUserDto.role ??
      (createUserDto as any).rol ??
      (createUserDto as any).role ??
      '';

    const firstName = rawFirstName.toString().trim();
    const lastName = rawLastName.toString().trim();
    const email = rawEmail.toString().trim().toLowerCase();
    const role = rawRole.toString().trim();

    if (!firstName) {
      throw new BadRequestException('El nombre es obligatorio');
    }

    if (!lastName) {
      throw new BadRequestException('El apellido es obligatorio');
    }

    if (!email) {
      throw new BadRequestException('El correo electrónico es obligatorio');
    }

    if (!role) {
      throw new BadRequestException('El rol es obligatorio');
    }

    const username = this.joinNames(firstName, lastName);
    const normalizedRole = role.toLowerCase();
    const shouldCreatePatient =
      normalizedRole === 'patient' || normalizedRole === 'paciente';

    const created = await this.prisma.usuario.create({
      data: {
        email,
        username,
        password: buildDefaultPasswordHash(),
        rol: role,
        active: 1,
      },
      select: {
        id: true,
        email: true,
        username: true,
        rol: true,
        created_at: true,
        updated_at: true,
        active: true,
      },
    });

    if (shouldCreatePatient) {
      try {
        await this.patientService.create({
          id_usuario: created.id,
          nombres: firstName,
          apellidos: lastName,
          contacto_correo: email,
          contacto: username,
          activo: 1,
          user_role: role,
        } as any);
      } catch (error) {
        await this.prisma.usuario.delete({ where: { id: created.id } }).catch(() => undefined);
        throw error;
      }
    }

    return this.mapUser(created, { firstName, lastName });
  }

  async update(id: number, data: any): Promise<PublicUser | null> {
    const updated = await this.prisma.usuario.update({
      where: { id },
      data: {
        email: data.email,
        username: data.username,
        rol: data.role ?? data.rol,
        active: data.isActive ?? data.active,
      },
      select: {
        id: true,
        email: true,
        username: true,
        rol: true,
        created_at: true,
        updated_at: true,
        active: true,
      },
    });
    if (!updated) return null;
    return {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      firstName: (updated as any).nombres ?? null,
      lastName: (updated as any).apellidos ?? null,
      rol: updated.rol ?? null,
      created_at: updated.created_at ?? null,
      last_login: updated.updated_at ?? null,
      active: updated.active ?? null,
    };
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw`DELETE FROM usuario_menu WHERE id_usuario = ${id}`;

        await transaction.paciente.updateMany({
          where: { id_usuario: id },
          data: { id_usuario: null },
        });

        await transaction.instrumento_usuario.updateMany({
          where: { id_usuario: id },
          data: { id_usuario: null },
        });

        await transaction.usuario.delete({ where: { id } });
      });
      return { deleted: true };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Usuario no encontrado');
      }
      throw error;
    }
  }
}
