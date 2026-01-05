import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Patch,
  Delete,
} from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { CreateVitalDto } from './dto/create-vital.dto';
import { CreatePulseDto } from './dto/create-pulse.dto';
import { CreateHeartRateDto } from './dto/create-heart-rate.dto';
import { CreateBodyMassDto } from './dto/create-body-mass.dto';
import { CreateGlycemiaDto } from './dto/create-glycemia.dto';
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';
import { UpdatePulseDto } from './dto/update-pulse.dto';
import { UpdateHeartRateDto } from './dto/update-heart-rate.dto';
import { UpdateBodyMassDto } from './dto/update-body-mass.dto';
import { UpdateGlycemiaDto } from './dto/update-glycemia.dto';
import { UpdateBloodPressureDto } from './dto/update-blood-pressure.dto';

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

  @Post('patient/:patientId/weight')
  registerWeight(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreateVitalDto,
  ) {
    return this.vitalsService.registerWeight(patientId, dto);
  }

  @Post('user/:userId/weight')
  registerWeightByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateVitalDto,
  ) {
    return this.vitalsService.registerWeightByUser(userId, dto);
  }

  @Patch('user/:userId/weight/:recordId')
  updateWeightByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: UpdateVitalDto,
  ) {
    return this.vitalsService.updateWeightByUser(userId, recordId, dto);
  }

  @Delete('user/:userId/weight/:recordId')
  deleteWeightByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.vitalsService.deleteWeightByUser(userId, recordId);
  }

  @Post('patient/:patientId/pulse')
  registerPulse(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreatePulseDto,
  ) {
    return this.vitalsService.registerPulse(patientId, dto);
  }

  @Post('user/:userId/pulse')
  registerPulseByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreatePulseDto,
  ) {
    return this.vitalsService.registerPulseByUser(userId, dto);
  }

  @Patch('user/:userId/pulse/:recordId')
  updatePulseByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: UpdatePulseDto,
  ) {
    return this.vitalsService.updatePulseByUser(userId, recordId, dto);
  }

  @Delete('user/:userId/pulse/:recordId')
  deletePulseByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.vitalsService.deletePulseByUser(userId, recordId);
  }

  @Post('patient/:patientId/heart-rate')
  registerHeartRate(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreateHeartRateDto,
  ) {
    return this.vitalsService.registerHeartRate(patientId, dto);
  }

  @Post('user/:userId/heart-rate')
  registerHeartRateByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateHeartRateDto,
  ) {
    return this.vitalsService.registerHeartRateByUser(userId, dto);
  }

  @Patch('user/:userId/heart-rate/:recordId')
  updateHeartRateByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: UpdateHeartRateDto,
  ) {
    return this.vitalsService.updateHeartRateByUser(userId, recordId, dto);
  }

  @Delete('user/:userId/heart-rate/:recordId')
  deleteHeartRateByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.vitalsService.deleteHeartRateByUser(userId, recordId);
  }

  @Post('patient/:patientId/body-mass')
  registerBodyMass(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreateBodyMassDto,
  ) {
    return this.vitalsService.registerBodyMass(patientId, dto);
  }

  @Post('user/:userId/body-mass')
  registerBodyMassByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateBodyMassDto,
  ) {
    return this.vitalsService.registerBodyMassByUser(userId, dto);
  }

  @Patch('user/:userId/body-mass/:recordId')
  updateBodyMassByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: UpdateBodyMassDto,
  ) {
    return this.vitalsService.updateBodyMassByUser(userId, recordId, dto);
  }

  @Delete('user/:userId/body-mass/:recordId')
  deleteBodyMassByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.vitalsService.deleteBodyMassByUser(userId, recordId);
  }

  @Post('patient/:patientId/glycemia')
  registerGlycemia(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreateGlycemiaDto,
  ) {
    return this.vitalsService.registerGlycemia(patientId, dto);
  }

  @Post('user/:userId/glycemia')
  registerGlycemiaByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateGlycemiaDto,
  ) {
    return this.vitalsService.registerGlycemiaByUser(userId, dto);
  }

  @Patch('user/:userId/glycemia/:recordId')
  updateGlycemiaByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: UpdateGlycemiaDto,
  ) {
    return this.vitalsService.updateGlycemiaByUser(userId, recordId, dto);
  }

  @Delete('user/:userId/glycemia/:recordId')
  deleteGlycemiaByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.vitalsService.deleteGlycemiaByUser(userId, recordId);
  }

  @Post('patient/:patientId/blood-pressure')
  registerBloodPressure(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreateBloodPressureDto,
  ) {
    return this.vitalsService.registerBloodPressure(patientId, dto);
  }

  @Post('user/:userId/blood-pressure')
  registerBloodPressureByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateBloodPressureDto,
  ) {
    return this.vitalsService.registerBloodPressureByUser(userId, dto);
  }

  @Patch('user/:userId/blood-pressure/:recordId')
  updateBloodPressureByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: UpdateBloodPressureDto,
  ) {
    return this.vitalsService.updateBloodPressureByUser(userId, recordId, dto);
  }

  @Delete('user/:userId/blood-pressure/:recordId')
  deleteBloodPressureByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
  ) {
    return this.vitalsService.deleteBloodPressureByUser(userId, recordId);
  }
}
