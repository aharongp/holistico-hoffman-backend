export class CreateBodyMassDto {
  /** Peso en kg. */
  peso: string | number;

  /** Fecha opcional en formato ISO. */
  fecha?: string;

  cuello?: string;
  busto?: string;
  cintura?: string;
  cadera?: string;
  brazoDerecho?: string;
  musloDerecho?: string;
  fotoRostro?: string;
  fotoCuerpoFrente?: string;
  fotoCuerpoPerfil?: string;
  fotoEspaldaEntero?: string;
  fotoExtra?: string;
}
