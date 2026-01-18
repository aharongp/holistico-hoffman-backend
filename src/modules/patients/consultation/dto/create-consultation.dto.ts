export class CreateConsultationDto {
	id_paciente!: number | string;
	motivo?: string | null;
	fecha?: string | Date | null;
	peso?: string | number | null;
	imc?: string | number | null;
	gc?: string | number | null;
	pulso?: string | number | null;
	fcm?: string | number | null;
	tension?: string | null;
	brazo?: string | number | null;
	muslo?: string | number | null;
	cintura?: string | number | null;
	cadera?: string | number | null;
	busto_pecho?: string | number | null;
	cuello?: string | number | null;
	hallazgo?: string | null;
	diagnostico?: string | null;
	recomendacion?: string | null;
	observacion?: string | null;
	respiracion?: string | null;
	evolucion?: string | null;
	recomendacion_coach?: string | null;
	indicaciones?: string | null;
}
