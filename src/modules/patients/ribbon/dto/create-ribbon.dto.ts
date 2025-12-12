import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateRibbonDto {
	@IsOptional()
	@IsString()
	nombre?: string;

	@IsOptional()
	@IsString()
	color?: string;

	@IsOptional()
	@IsInt()
	orden?: number;

	@IsOptional()
	@IsString()
	descripcion?: string;

	@IsOptional()
	@IsString()
	userCreated?: string;

	@IsOptional()
	@IsString()
	bgColor?: string;

	@IsOptional()
	@IsInt()
	siguienteCinta?: number;

	@IsOptional()
	@IsString()
	hexadecimal?: string;

	@IsOptional()
	@IsString()
	hilo?: string;

	@IsOptional()
	@IsInt()
	cinta?: number;
}
