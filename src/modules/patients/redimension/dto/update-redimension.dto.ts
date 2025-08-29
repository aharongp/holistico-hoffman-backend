import { PartialType } from '@nestjs/mapped-types';
import { CreateRedimensionDto } from './create-redimension.dto';

export class UpdateRedimensionDto extends PartialType(CreateRedimensionDto) {}
