import { Module } from '@nestjs/common';
import { OcularService } from './ocular.service';
import { OcularController } from './ocular.controller';

@Module({
  controllers: [OcularController],
  providers: [OcularService],
})
export class OcularModule {}
