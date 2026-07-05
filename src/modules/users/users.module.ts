import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PatientModule } from '../patients/patient/patient.module';

@Module({
  controllers: [UsersController],
  imports: [PrismaModule, PermissionsModule, PatientModule],
  providers: [UsersService],
})
export class UsersModule {}
