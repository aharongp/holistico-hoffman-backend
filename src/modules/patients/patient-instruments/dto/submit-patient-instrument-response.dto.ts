import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitInstrumentAnswerDto {
  @IsOptional()
  @IsNumber()
  questionId?: number | null;

  @IsOptional()
  @IsString()
  questionText?: string | null;

  @IsOptional()
  @IsNumber()
  order?: number | null;

  @IsOptional()
  @IsString()
  value?: string | null;

  @IsOptional()
  @IsString()
  label?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selections?: string[];

  @IsOptional()
  @IsString()
  rawValue?: string | null;

  @IsOptional()
  @IsString()
  theme?: string | null;

  @IsOptional()
  @IsString()
  topic?: string | null;
}

export class SubmitPatientInstrumentResponseDto {
  @IsOptional()
  @IsNumber()
  instrumentId?: number | null;

  @IsOptional()
  @IsNumber()
  instrumentTypeId?: number | null;

  @IsOptional()
  @IsNumber()
  patientId?: number | null;

  @IsOptional()
  @IsString()
  instrumentTypeName?: string | null;

  @IsOptional()
  @IsString()
  instrumentName?: string | null;

  @IsOptional()
  @IsString()
  theme?: string | null;

  @IsOptional()
  @IsString()
  topic?: string | null;

  @IsOptional()
  @IsBoolean()
  markAsCompleted?: boolean;

  @IsOptional()
  @IsBoolean()
  saveOnly?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubmitInstrumentAnswerDto)
  answers!: SubmitInstrumentAnswerDto[];
}
