export class CreateQuestionDto {
  id_instrumento?: number | string | null;
  instrumentId?: number | string | null;
  id_topico?: number | string | null;
  topicId?: number | string | null;
  nombre?: string | null;
  name?: string | null;
  user_created?: string | null;
  userCreated?: string | null;
  tipo_respuesta?: string | null;
  responseType?: string | null;
  orden?: number | string | null;
  order?: number | string | null;
  habilitada?: number | boolean | null;
  isEnabled?: number | boolean | null;
}
