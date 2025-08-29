import { PartialType } from '@nestjs/mapped-types';
import { CreateCosmobiologyDto } from './create-cosmobiology.dto';

export class UpdateCosmobiologyDto extends PartialType(CreateCosmobiologyDto) {}
