export class CreateInstrumentDto {
  id_instrumento_tipo?: number | string | null;
  instrumentTypeId?: number | string | null;
  id_tema?: number | string | null;
  subjectId?: number | string | null;
  descripcion?: string | null;
  description?: string | null;
  recurso?: string | null;
  resource?: string | null;
  activo?: number | boolean | null;
  isActive?: number | boolean | null;
  user_created?: string | null;
  userCreated?: string | null;
  disponible?: string | null;
  availability?: string | null;
  resultados?: string | null;
  resultDelivery?: string | null;
  color_respuesta?: number | boolean | null;
  colorResponse?: number | boolean | null;
}
