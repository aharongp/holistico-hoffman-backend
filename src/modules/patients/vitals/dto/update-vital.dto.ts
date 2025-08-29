import { PartialType } from '@nestjs/mapped-types';
import { CreateVitalDto } from './create-vital.dto';

export class UpdateVitalDto extends PartialType(CreateVitalDto) {}
