import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsGuard],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
