import { PartialType } from '@nestjs/mapped-types';
import { CreateHeartRateDto } from './create-heart-rate.dto';

export class UpdateHeartRateDto extends PartialType(CreateHeartRateDto) {}
