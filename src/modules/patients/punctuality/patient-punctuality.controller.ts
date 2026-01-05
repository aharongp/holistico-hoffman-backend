import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PatientPunctualityService } from './patient-punctuality.service';
import { UpdatePatientPunctualityDto } from './dto/update-patient-punctuality.dto';
import { CreatePatientPunctualityDto } from './dto/create-patient-punctuality.dto';

@Controller('patient-punctuality')
export class PatientPunctualityController {
  constructor(
    private readonly patientPunctualityService: PatientPunctualityService,
  ) {}

  @Post()
  create(@Body() createPatientPunctualityDto: CreatePatientPunctualityDto) {
    return this.patientPunctualityService.create(createPatientPunctualityDto);
  }

  @Get()
  findAll() {
    return this.patientPunctualityService.findAll();
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.patientPunctualityService.findByPatient(patientId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const record = await this.patientPunctualityService.findOne(id);
    if (!record) {
      throw new NotFoundException('Registro de puntualidad no encontrado');
    }

    return record;
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatientPunctualityDto: UpdatePatientPunctualityDto,
  ) {
    return this.patientPunctualityService.update(
      id,
      updatePatientPunctualityDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.patientPunctualityService.remove(id);
  }
}
