import { Module } from '@nestjs/common';
import { RibbonService } from './ribbon.service';
import { RibbonController } from './ribbon.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RibbonController],
  providers: [RibbonService],
  exports: [RibbonService],
})
export class RibbonModule {}
