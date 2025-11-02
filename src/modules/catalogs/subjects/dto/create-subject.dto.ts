export class CreateSubjectDto {
	nombre!: string;
	descripcion?: string | null;
	user_created?: string | null;
	tipo_instrumento?: string | null;
	id_cinta?: number | null;
}
