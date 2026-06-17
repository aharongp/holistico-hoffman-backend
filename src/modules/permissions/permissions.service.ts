import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_PERMISSIONS_BY_ROLE,
  DOCTOR_COACH_ROLES,
  isAdminRole,
  isPermissionKey,
  parsePermissionKey,
  PERMISSION_CATALOG,
  PERMISSION_RESOURCES,
  PERMISSION_SCOPE_MENU,
  PERMISSION_SCOPE_OPTION,
  type PermissionKey,
} from './permissions.constants';

type PermissionRow = {
  menu: string | null;
  opcion: string | null;
};

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  getCatalog() {
    return {
      resources: PERMISSION_CATALOG,
      allPermissionKeys: ALL_PERMISSION_KEYS,
    };
  }

  private async readRawUserPermissions(userId: number): Promise<{
    hasCustomConfiguration: boolean;
    permissionKeys: PermissionKey[];
  }> {
    const rows = await this.prisma.$queryRaw<PermissionRow[]>`
      SELECT menu, opcion
      FROM usuario_menu
      WHERE id_usuario = ${userId}
    `;

    let hasCustomConfiguration = false;
    const permissionSet = new Set<PermissionKey>();

    rows.forEach((row) => {
      const menu = (row.menu ?? '').toString().trim().toLowerCase();
      const option = (row.opcion ?? '').toString().trim().toLowerCase();

      if (!menu) {
        return;
      }

      if (menu === PERMISSION_SCOPE_MENU && option === PERMISSION_SCOPE_OPTION) {
        hasCustomConfiguration = true;
        return;
      }

      const key = `${menu}.${option}`;
      if (isPermissionKey(key)) {
        permissionSet.add(key);
      }
    });

    return {
      hasCustomConfiguration,
      permissionKeys: Array.from(permissionSet),
    };
  }

  getDefaultPermissionsByRole(role: string | null | undefined): PermissionKey[] {
    const normalizedRole = (role ?? '').toString().trim().toLowerCase();
    return DEFAULT_PERMISSIONS_BY_ROLE[normalizedRole] ?? [];
  }

  async getEffectivePermissionsForUser(
    userId: number,
    role: string | null | undefined,
  ): Promise<{ permissionKeys: PermissionKey[]; hasCustomConfiguration: boolean }> {
    if (isAdminRole(role)) {
      return {
        permissionKeys: ALL_PERMISSION_KEYS,
        hasCustomConfiguration: true,
      };
    }

    const raw = await this.readRawUserPermissions(userId);
    if (raw.hasCustomConfiguration) {
      return raw;
    }

    return {
      permissionKeys: this.getDefaultPermissionsByRole(role),
      hasCustomConfiguration: false,
    };
  }

  async canUser(
    userId: number,
    role: string | null | undefined,
    permissionKey: PermissionKey,
  ): Promise<boolean> {
    if (isAdminRole(role)) {
      return true;
    }

    const effective = await this.getEffectivePermissionsForUser(userId, role);
    return effective.permissionKeys.includes(permissionKey);
  }

  async listPermissionTargets() {
    const users = await this.prisma.usuario.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        rol: true,
        active: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return users
      .map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: (user.rol ?? '').toString().trim().toLowerCase(),
        active: user.active,
      }))
      .filter((user) => DOCTOR_COACH_ROLES.has(user.role));
  }

  async getPermissionsForTargetUser(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        rol: true,
        active: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const normalizedRole = (user.rol ?? '').toString().trim().toLowerCase();
    if (!DOCTOR_COACH_ROLES.has(normalizedRole)) {
      throw new BadRequestException('Solo se pueden gestionar permisos para usuarios con rol doctor o coach.');
    }

    const effective = await this.getEffectivePermissionsForUser(user.id, user.rol);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: normalizedRole,
        active: user.active,
      },
      permissionKeys: effective.permissionKeys,
      hasCustomConfiguration: effective.hasCustomConfiguration,
      availablePermissionKeys: ALL_PERMISSION_KEYS,
    };
  }

  async replacePermissionsForTargetUser(
    targetUserId: number,
    permissionKeys: string[],
    updatedBy: string | null,
  ) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        rol: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const normalizedRole = (user.rol ?? '').toString().trim().toLowerCase();
    if (!DOCTOR_COACH_ROLES.has(normalizedRole)) {
      throw new BadRequestException('Solo se pueden gestionar permisos para usuarios con rol doctor o coach.');
    }

    const normalizedKeys = Array.from(
      new Set(
        permissionKeys
          .map((key) => (key ?? '').toString().trim().toLowerCase())
          .filter(Boolean),
      ),
    );

    const invalidKeys = normalizedKeys.filter((key) => !isPermissionKey(key));
    if (invalidKeys.length > 0) {
      throw new BadRequestException(
        `Permisos inválidos: ${invalidKeys.join(', ')}`,
      );
    }

    const parsed = normalizedKeys
      .map((key) => ({ key, parsed: parsePermissionKey(key) }))
      .filter((item): item is { key: PermissionKey; parsed: NonNullable<ReturnType<typeof parsePermissionKey>> } => item.parsed !== null);

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM usuario_menu
        WHERE id_usuario = ${targetUserId}
          AND (
            menu = ${PERMISSION_SCOPE_MENU}
            OR menu IN (${Prisma.join(PERMISSION_RESOURCES)})
          )
      `;

      await tx.$executeRaw`
        INSERT INTO usuario_menu (id_usuario, menu, opcion, user_created, created_at, updated_at)
        VALUES (
          ${targetUserId},
          ${PERMISSION_SCOPE_MENU},
          ${PERMISSION_SCOPE_OPTION},
          ${updatedBy ?? 'system'},
          ${now},
          ${now}
        )
      `;

      for (const item of parsed) {
        await tx.$executeRaw`
          INSERT INTO usuario_menu (id_usuario, menu, opcion, user_created, created_at, updated_at)
          VALUES (
            ${targetUserId},
            ${item.parsed.resource},
            ${item.parsed.action},
            ${updatedBy ?? 'system'},
            ${now},
            ${now}
          )
        `;
      }
    });

    return this.getPermissionsForTargetUser(targetUserId);
  }
}
