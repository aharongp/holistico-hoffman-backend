import { PartialType } from '@nestjs/mapped-types';
import { CreateGlycemiaDto } from './create-glycemia.dto';

export class UpdateGlycemiaDto extends PartialType(CreateGlycemiaDto) {}
