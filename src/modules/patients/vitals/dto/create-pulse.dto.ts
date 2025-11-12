export class CreatePulseDto {
  /** Pulso en bpm. Se acepta número o string con separador decimal. */
  pulso: string | number;

  /** Fecha opcional en formato ISO. Si se omite, se usa la fecha actual. */
  fecha?: string;
}
