import { PartialType } from '@nestjs/mapped-types';
import { CreateDentalDto } from './create-dental.dto';

export class UpdateDentalDto extends PartialType(CreateDentalDto) {}
