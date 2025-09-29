import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [TopicsController],  
  imports: [PrismaModule],
  providers: [TopicsService],
})
export class TopicsModule {}
