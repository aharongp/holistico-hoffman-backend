import { PartialType } from '@nestjs/mapped-types';
import { CreateOcularDto } from './create-ocular.dto';

export class UpdateOcularDto extends PartialType(CreateOcularDto) {}
