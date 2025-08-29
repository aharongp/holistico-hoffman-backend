import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientInstrumentDto } from './create-patient-instrument.dto';

export class UpdatePatientInstrumentDto extends PartialType(CreatePatientInstrumentDto) {}
