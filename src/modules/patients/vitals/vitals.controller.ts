import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { MulterField } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
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
import { memoryStorage } from 'multer';
import type { Express } from 'express';

const BODY_MASS_UPLOAD_FIELDS: MulterField[] = [
  { name: 'fotoRostro', maxCount: 1 },
  { name: 'fotoCuerpoFrente', maxCount: 1 },
  { name: 'fotoCuerpoPerfil', maxCount: 1 },
  { name: 'fotoEspaldaEntero', maxCount: 1 },
  { name: 'fotoExtra', maxCount: 1 },
];

const BODY_MASS_UPLOAD_INTERCEPTOR = FileFieldsInterceptor(
  BODY_MASS_UPLOAD_FIELDS,
  {
    storage: memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  },
);

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
  @UseInterceptors(BODY_MASS_UPLOAD_INTERCEPTOR)
  registerBodyMass(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: CreateBodyMassDto,
    @UploadedFiles()
    files?: {
      fotoRostro?: Express.Multer.File[];
      fotoCuerpoFrente?: Express.Multer.File[];
      fotoCuerpoPerfil?: Express.Multer.File[];
      fotoEspaldaEntero?: Express.Multer.File[];
      fotoExtra?: Express.Multer.File[];
    },
  ) {
    return this.vitalsService.registerBodyMass(patientId, dto, {
      face: files?.fotoRostro?.[0] ?? null,
      front: files?.fotoCuerpoFrente?.[0] ?? null,
      profile: files?.fotoCuerpoPerfil?.[0] ?? null,
      back: files?.fotoEspaldaEntero?.[0] ?? null,
      extra: files?.fotoExtra?.[0] ?? null,
    });
  }

  @Post('user/:userId/body-mass')
  @UseInterceptors(BODY_MASS_UPLOAD_INTERCEPTOR)
  registerBodyMassByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: CreateBodyMassDto,
    @UploadedFiles()
    files?: {
      fotoRostro?: Express.Multer.File[];
      fotoCuerpoFrente?: Express.Multer.File[];
      fotoCuerpoPerfil?: Express.Multer.File[];
      fotoEspaldaEntero?: Express.Multer.File[];
      fotoExtra?: Express.Multer.File[];
    },
  ) {
    return this.vitalsService.registerBodyMassByUser(userId, dto, {
      face: files?.fotoRostro?.[0] ?? null,
      front: files?.fotoCuerpoFrente?.[0] ?? null,
      profile: files?.fotoCuerpoPerfil?.[0] ?? null,
      back: files?.fotoEspaldaEntero?.[0] ?? null,
      extra: files?.fotoExtra?.[0] ?? null,
    });
  }

  @Patch('user/:userId/body-mass/:recordId')
  @UseInterceptors(BODY_MASS_UPLOAD_INTERCEPTOR)
  updateBodyMassByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('recordId', ParseIntPipe) recordId: number,
    @Body() dto: UpdateBodyMassDto,
    @UploadedFiles()
    files?: {
      fotoRostro?: Express.Multer.File[];
      fotoCuerpoFrente?: Express.Multer.File[];
      fotoCuerpoPerfil?: Express.Multer.File[];
      fotoEspaldaEntero?: Express.Multer.File[];
      fotoExtra?: Express.Multer.File[];
    },
  ) {
    return this.vitalsService.updateBodyMassByUser(userId, recordId, dto, {
      face: files?.fotoRostro?.[0] ?? null,
      front: files?.fotoCuerpoFrente?.[0] ?? null,
      profile: files?.fotoCuerpoPerfil?.[0] ?? null,
      back: files?.fotoEspaldaEntero?.[0] ?? null,
      extra: files?.fotoExtra?.[0] ?? null,
    });
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
