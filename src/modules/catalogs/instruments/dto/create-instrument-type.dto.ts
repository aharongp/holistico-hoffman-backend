export class CreateInstrumentTypeDto {
	nombre!: string;
	descripcion?: string | null;
	user_created?: string | null;
	id_criterio?: number | string | null;
}