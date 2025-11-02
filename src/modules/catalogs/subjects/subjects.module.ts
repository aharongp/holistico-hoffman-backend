import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [SubjectsController],
  imports: [PrismaModule],
  providers: [SubjectsService],
})
export class SubjectsModule {}
