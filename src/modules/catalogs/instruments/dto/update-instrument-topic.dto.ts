import { PartialType } from '@nestjs/mapped-types';
import { CreateInstrumentTopicDto } from './create-instrument-topic.dto';

export class UpdateInstrumentTopicDto extends PartialType(CreateInstrumentTopicDto) {}
