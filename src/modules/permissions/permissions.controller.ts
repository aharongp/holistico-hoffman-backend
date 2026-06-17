import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsService } from './permissions.service';
import { isAdminRole } from './permissions.constants';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  private assertAdmin(user: any) {
    if (!isAdminRole(user?.rol ?? user?.role)) {
      throw new ForbiddenException('Solo administradores pueden gestionar permisos.');
    }
  }

  @Get('catalog')
  getCatalog(@Req() req: any) {
    this.assertAdmin(req.user);
    return this.permissionsService.getCatalog();
  }

  @Get('users/targets')
  getPermissionTargets(@Req() req: any) {
    this.assertAdmin(req.user);
    return this.permissionsService.listPermissionTargets();
  }

  @Get('users/:userId')
  getPermissionsByUser(@Req() req: any, @Param('userId', ParseIntPipe) userId: number) {
    this.assertAdmin(req.user);
    return this.permissionsService.getPermissionsForTargetUser(userId);
  }

  @Put('users/:userId')
  replacePermissionsByUser(
    @Req() req: any,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserPermissionsDto,
  ) {
    this.assertAdmin(req.user);

    const updatedBy = [req.user?.nombres, req.user?.apellidos]
      .map((part: unknown) => (part ?? '').toString().trim())
      .filter(Boolean)
      .join(' ')
      .trim() || req.user?.username || req.user?.email || 'system';

    return this.permissionsService.replacePermissionsForTargetUser(
      userId,
      dto.permissionKeys ?? [],
      updatedBy,
    );
  }

  @Get('me')
  getMyPermissions(@Req() req: any) {
    return this.permissionsService.getEffectivePermissionsForUser(
      Number(req.user.id),
      req.user?.rol ?? req.user?.role,
    );
  }
}
