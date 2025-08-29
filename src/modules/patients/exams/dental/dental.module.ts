import { Module } from '@nestjs/common';
import { DentalService } from './dental.service';
import { DentalController } from './dental.controller';

@Module({
  controllers: [DentalController],
  providers: [DentalService],
})
export class DentalModule {}
