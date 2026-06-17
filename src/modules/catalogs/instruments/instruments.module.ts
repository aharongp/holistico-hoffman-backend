import { Module } from '@nestjs/common';
import { InstrumentsService } from './instruments.service';
import { InstrumentsController } from './instruments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PermissionsModule } from '../../permissions/permissions.module';

@Module({
  controllers: [InstrumentsController],
  imports: [PrismaModule, PermissionsModule],
  providers: [InstrumentsService],
})
export class InstrumentsModule {}
