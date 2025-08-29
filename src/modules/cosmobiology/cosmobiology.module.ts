import { Module } from '@nestjs/common';
import { CosmobiologyService } from './cosmobiology.service';
import { CosmobiologyController } from './cosmobiology.controller';

@Module({
  controllers: [CosmobiologyController],
  providers: [CosmobiologyService],
})
export class CosmobiologyModule {}
