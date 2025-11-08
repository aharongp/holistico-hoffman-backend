import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { VitalsService } from './vitals.service';

@Controller('vitals')
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Get('patient/:patientId')
  getVitalsByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.vitalsService.getByPatient(patientId);
  }

  @Get('user/:userId')
  getVitalsByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.vitalsService.getByUserId(userId);
  }
}
