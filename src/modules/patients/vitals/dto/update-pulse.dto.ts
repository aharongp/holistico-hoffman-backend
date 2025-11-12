import { PartialType } from '@nestjs/mapped-types';
import { CreatePulseDto } from './create-pulse.dto';

export class UpdatePulseDto extends PartialType(CreatePulseDto) {}
