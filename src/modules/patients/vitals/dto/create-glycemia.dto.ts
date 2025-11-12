export class CreateGlycemiaDto {
  /** Valor de glicemia en mg/dL. */
  glicemia: string | number;

  /** Fecha opcional en formato ISO. */
  fecha?: string;
}
