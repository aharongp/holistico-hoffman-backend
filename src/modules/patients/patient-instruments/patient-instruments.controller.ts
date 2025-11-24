import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { PatientInstrumentsService } from './patient-instruments.service';
import { CreatePatientInstrumentDto } from './dto/create-patient-instrument.dto';
import { UpdatePatientInstrumentDto } from './dto/update-patient-instrument.dto';

@Controller('patient-instruments')
export class PatientInstrumentsController {
  constructor(private readonly patientInstrumentsService: PatientInstrumentsService) {}

  @Post()
  create(@Body() createPatientInstrumentDto: CreatePatientInstrumentDto) {
    return this.patientInstrumentsService.create(createPatientInstrumentDto);
  }

  @Get()
  findAll() {
    return this.patientInstrumentsService.findAll();
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.patientInstrumentsService.findByPatient(patientId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.patientInstrumentsService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patientInstrumentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePatientInstrumentDto: UpdatePatientInstrumentDto) {
    return this.patientInstrumentsService.update(id, updatePatientInstrumentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.patientInstrumentsService.remove(id);
  }
}
