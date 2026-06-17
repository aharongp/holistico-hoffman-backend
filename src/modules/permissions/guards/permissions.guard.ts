import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import {
  isAdminRole,
  type PermissionKey,
} from '../permissions.constants';
import { REQUIRED_PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<PermissionKey>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user || typeof user.id === 'undefined') {
      throw new ForbiddenException('No se pudo validar permisos del usuario.');
    }

    if (isAdminRole(user?.rol ?? user?.role)) {
      return true;
    }

    const allowed = await this.permissionsService.canUser(
      Number(user.id),
      user?.rol ?? user?.role,
      requiredPermission,
    );

    if (!allowed) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    return true;
  }
}
