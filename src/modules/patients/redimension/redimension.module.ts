import { Module } from '@nestjs/common';
import { RedimensionService } from './redimension.service';
import { RedimensionController } from './redimension.controller';

@Module({
  controllers: [RedimensionController],
  providers: [RedimensionService],
})
export class RedimensionModule {}
