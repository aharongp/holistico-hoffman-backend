import { PartialType } from '@nestjs/mapped-types';
import { CreateBodyMassDto } from './create-body-mass.dto';

export class UpdateBodyMassDto extends PartialType(CreateBodyMassDto) {}
