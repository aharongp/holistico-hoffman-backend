import { PartialType } from '@nestjs/mapped-types';
import { CreateRibbonDto } from './create-ribbon.dto';

export class UpdateRibbonDto extends PartialType(CreateRibbonDto) {}
