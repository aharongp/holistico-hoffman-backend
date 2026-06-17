import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionsModule } from '../../permissions/permissions.module';

@Module({
  controllers: [ProgramsController],
  imports: [PrismaModule, PermissionsModule],
  providers: [ProgramsService],
})
export class ProgramsModule {}
