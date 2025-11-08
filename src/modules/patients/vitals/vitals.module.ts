import { Module } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { VitalsController } from './vitals.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [VitalsController],
  imports: [PrismaModule],
  providers: [VitalsService],
  exports: [VitalsService],
})
export class VitalsModule {}
