export class CreateBloodPressureDto {
  /** Presión sistólica. */
  sistolica: string | number;

  /** Presión diastólica. */
  diastolica: string | number;

  /** Fecha opcional en formato ISO. */
  fecha?: string;
}
