import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ProgramsController],
  imports: [PrismaModule],
  providers: [ProgramsService],
})
export class ProgramsModule {}
