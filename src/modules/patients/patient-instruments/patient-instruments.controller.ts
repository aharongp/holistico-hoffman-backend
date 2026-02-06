import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  AggregatedResultsDateOptions,
  PatientInstrumentsService,
} from './patient-instruments.service';
import { CreatePatientInstrumentDto } from './dto/create-patient-instrument.dto';
import { UpdatePatientInstrumentDto } from './dto/update-patient-instrument.dto';
import { SubmitPatientInstrumentResponseDto } from './dto/submit-patient-instrument-response.dto';

@Controller('patient-instruments')
export class PatientInstrumentsController {
  constructor(
    private readonly patientInstrumentsService: PatientInstrumentsService,
  ) {}

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

  @Get('responses/patient/:patientId')
  findResponsesByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.patientInstrumentsService.findResponsesByPatient(patientId);
  }

  @Get('responses/user/:userId')
  findResponsesByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.patientInstrumentsService.findResponsesByUser(userId);
  }

  @Get('results/patient/:patientId')
  findAggregatedResultsByPatient(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query?: Record<string, string | undefined>,
  ) {
    const normalize = (value?: string): string | null =>
      value?.trim?.() ? value.trim() : null;
    const options: AggregatedResultsDateOptions = {
      attitudinalDate: normalize(query?.attitudinalDate),
      firmnessAdaptabilityDate: normalize(query?.firmnessAdaptabilityDate),
      diagnosticsDate: normalize(query?.diagnosticsDate),
      testsDate: normalize(query?.testsDate),
      dailyReviewDate: normalize(query?.dailyReviewDate),
      wellnessLifeDate: normalize(query?.wellnessLifeDate),
      wellnessHealthDate: normalize(query?.wellnessHealthDate),
      wellnessRegiflexDate: normalize(query?.wellnessRegiflexDate),
    };
    return this.patientInstrumentsService.findAggregatedResultsByPatient(
      patientId,
      options,
    );
  }

  @Get('results/user/:userId')
  findAggregatedResultsByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query?: Record<string, string | undefined>,
  ) {
    const normalize = (value?: string): string | null =>
      value?.trim?.() ? value.trim() : null;
    const options: AggregatedResultsDateOptions = {
      attitudinalDate: normalize(query?.attitudinalDate),
      firmnessAdaptabilityDate: normalize(query?.firmnessAdaptabilityDate),
      diagnosticsDate: normalize(query?.diagnosticsDate),
      testsDate: normalize(query?.testsDate),
      dailyReviewDate: normalize(query?.dailyReviewDate),
      wellnessLifeDate: normalize(query?.wellnessLifeDate),
      wellnessHealthDate: normalize(query?.wellnessHealthDate),
      wellnessRegiflexDate: normalize(query?.wellnessRegiflexDate),
    };
    return this.patientInstrumentsService.findAggregatedResultsByUser(
      userId,
      options,
    );
  }

  @Post(':id/responses')
  submitResponses(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    submitPatientInstrumentResponseDto: SubmitPatientInstrumentResponseDto,
  ) {
    return this.patientInstrumentsService.submitResponses(
      id,
      submitPatientInstrumentResponseDto,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.patientInstrumentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePatientInstrumentDto: UpdatePatientInstrumentDto,
  ) {
    return this.patientInstrumentsService.update(
      id,
      updatePatientInstrumentDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.patientInstrumentsService.remove(id);
  }
}
