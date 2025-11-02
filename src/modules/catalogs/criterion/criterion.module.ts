import { Module } from '@nestjs/common';
import { CriterionService } from './criterion.service';
import { CriterionController } from './criterion.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [CriterionController],
  imports: [PrismaModule],
  providers: [CriterionService],
})
export class CriterionModule {}
