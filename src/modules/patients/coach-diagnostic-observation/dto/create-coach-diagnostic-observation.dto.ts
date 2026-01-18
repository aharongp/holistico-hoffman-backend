export class CreateCoachDiagnosticObservationDto {
	id_paciente!: number | string;
	id_instrumento?: number | string | null;
	fecha_aplicado?: string | Date | null;
	id_topico?: number | string | null;
	comentario?: string | null;
	coach?: string | null;
}
