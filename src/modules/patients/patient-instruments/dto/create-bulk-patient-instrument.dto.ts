export class BulkItemDto {
  instrumentTypeId?: number | string | null;
  id_instrumento_tipo?: number | string | null;
  array_tema?: string | string[] | null;
  topics?: string[] | string | null;
  disponible?: string | boolean | null;
  available?: string | boolean | null;
}

export class CreateBulkPatientInstrumentDto {
  patientIds?: Array<number | string | null>;
  instrumentTypeIds?: Array<number | string | null>;
  items?: BulkItemDto[];

  fecha_instrumento?: string | Date | null;
  assignedAt?: string | Date | null;
  valido_hasta?: string | Date | null;
  validUntil?: string | Date | null;

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
