import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

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

    return users.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      firstName: (u as any).nombres ?? null,
      lastName: (u as any).apellidos ?? null,
      rol: u.rol ?? null,
      created_at: u.created_at ?? null,
      last_login: u.updated_at ?? null,
      active: u.active ?? null,
    }));
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
    return {
      id: u.id,
      email: u.email,
      username: u.username,
      firstName: (u as any).nombres ?? null,
      lastName: (u as any).apellidos ?? null,
      rol: u.rol ?? null,
      created_at: u.created_at ?? null,
      last_login: u.updated_at ?? null,
      active: u.active ?? null,
    };
  }

  async create(data: any): Promise<PublicUser> {
    // minimal create mapping; expects fields like email, username, nombres, apellidos, rol
    const created = await this.prisma.usuario.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password ?? null,
        rol: data.role ?? data.rol ?? null,
        active: data.isActive ?? 1,
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
    return {
      id: created.id,
      email: created.email,
      username: created.username,
      firstName: (created as any).nombres ?? null,
      lastName: (created as any).apellidos ?? null,
      rol: created.rol ?? null,
      created_at: created.created_at ?? null,
      last_login: created.updated_at ?? null,
      active: created.active ?? null,
    };
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
    await this.prisma.usuario.delete({ where: { id } });
    return { deleted: true };
  }
}
