export class UpdatePatientProgramDto {
  /** Identificador del programa a asignar. */
  programId?: number | string | null;

  /** Campo alternativo permitido por compatibilidad. */
  id_programa?: number | string | null;
}
