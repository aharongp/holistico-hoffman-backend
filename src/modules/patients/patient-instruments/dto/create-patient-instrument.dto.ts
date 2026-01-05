export class CreatePatientInstrumentDto {
  id_paciente?: number | string | null;
  patientId?: number | string | null;
  id_instrumento_tipo?: number | string | null;
  instrumentTypeId?: number | string | null;
  fecha_instrumento?: string | Date | null;
  assignedAt?: string | Date | null;
  valido_hasta?: string | Date | null;
  validUntil?: string | Date | null;
  completado?: number | boolean | null;
  completed?: number | boolean | null;
  evaluado?: number | boolean | null;
  evaluated?: number | boolean | null;
  disponible?: string | boolean | null;
  available?: string | boolean | null;
  origen?: string | null;
  origin?: string | null;
  array_tema?: string | string[] | null;
  topics?: string[] | string | null;
  user_created?: string | null;
  userCreated?: string | null;
  id_cinta?: number | string | null;
  ribbonId?: number | string | null;
}
