export class CreateHeartRateDto {
  /** Fecha opcional en formato ISO. */
  fecha?: string;

  /** Frecuencia cardiaca en reposo (FCR). */
  fcr?: string | number;

  /** Frecuencia cardiaca 5 minutos después del entrenamiento. */
  fc5MinEntrenamiento?: string | number;

  /** Frecuencia cardiaca 10 minutos después del entrenamiento. */
  fc10MinEntrenamiento?: string | number;

  /** Frecuencia cardiaca 15 minutos después del entrenamiento. */
  fc15Min?: string | number;

  /** Frecuencia cardiaca 30 minutos después del entrenamiento. */
  fc30Min?: string | number;

  /** Frecuencia cardiaca 45 minutos después del entrenamiento. */
  fc45Min?: string | number;

  /** Tipo de sesión / entrenamiento. */
  entrenamiento?: string;
}
