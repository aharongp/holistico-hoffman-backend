import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [QuestionsController],
  imports: [PrismaModule],
  providers: [QuestionsService],
})
export class QuestionsModule {}
