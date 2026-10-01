import { StorageModule } from '../../storage/storage.module';
import { Module } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { VitalsController } from './vitals.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [VitalsController],
  imports: [PrismaModule, StorageModule],
  providers: [VitalsService],
  exports: [VitalsService],
})
export class VitalsModule {}
