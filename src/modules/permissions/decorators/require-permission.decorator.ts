import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '../permissions.constants';

export const REQUIRED_PERMISSION_KEY = 'requiredPermissionKey';

export const RequirePermission = (permissionKey: PermissionKey) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permissionKey);
