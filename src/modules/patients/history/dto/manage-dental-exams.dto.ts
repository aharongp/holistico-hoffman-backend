export const DENTAL_EXAM_STRING_FIELDS = [
  'primero_si',
  'segundo_si',
  'tercero_si',
  'cuarto_si',
  'quinto_si',
  'sexto_si',
  'septimo_si',
  'octavo_si',
  'primero_sd',
  'segundo_sd',
  'tercero_sd',
  'cuarto_sd',
  'quinto_sd',
  'sexto_sd',
  'septimo_sd',
  'octavo_sd',
  'primero_iiz',
  'segundo_iiz',
  'tercero_iiz',
  'cuarto_iiz',
  'quinto_iiz',
  'sexto_iiz',
  'septimo_iiz',
  'octavo_iiz',
  'primero_id',
  'segundo_id',
  'tercero_id',
  'cuarto_id',
  'quinto_id',
  'sexto_id',
  'septimo_id',
  'octavo_id',
] as const;

export type DentalExamStringField = (typeof DENTAL_EXAM_STRING_FIELDS)[number];

export type UpsertPatientDentalExamDto = Partial<
  Record<DentalExamStringField, string | null | undefined>
>;

export const DENTAL_EXAM_PRESENCE_FIELDS = DENTAL_EXAM_STRING_FIELDS;

export type UpsertPatientDentalPresenceDto = Partial<
  Record<DentalExamStringField, boolean | number | null | undefined>
>;

export interface UpsertPatientOcularExamDto {
  fecha?: string | Date | null;
  motivo?: string | null;
  ojo_derecho?: string | null;
  observacion_derecho?: string | null;
  comentario?: string | null;
  ojo_izquierdo?: string | null;
  observacion_izquierdo?: string | null;
}
