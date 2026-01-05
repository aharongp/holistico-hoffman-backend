import { PartialType } from '@nestjs/mapped-types';
import { CreateInstrumentTypeDto } from './create-instrument-type.dto';

export class UpdateInstrumentTypeDto extends PartialType(
  CreateInstrumentTypeDto,
) {}
