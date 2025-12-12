export class CreatePatientDto {
	/** Identificador del usuario ya existente que se asociará al paciente. */
	id_usuario?: number | string | null;

	/** Nombres del paciente. */
	nombres?: string | null;

	/** Apellidos del paciente. */
	apellidos?: string | null;

	/** Genero del paciente (male, female, other). */
	genero?: string | null;

	/** Fecha de nacimiento en formato ISO o Date. */
	fecha_nacimiento?: string | Date | null;

	/** Numero de telefono principal. */
	telefono?: string | null;

	/** Direccion principal. */
	direccion?: string | null;

	/** Estado activo (1 activo, 0 inactivo). */
	activo?: number | null;

	/** Programa asociado. */
	id_programa?: number | string | null;

	/** Identificador de la cinta asignada. */
	id_cinta?: number | string | null;

	/** Nombre de contacto alterno. */
	contacto?: string | null;

	/** Correo de contacto (tambien usado para crear el usuario). */
	contacto_correo?: string | null;

	/** Telefono de contacto alterno. */
	contacto_telefono?: string | null;

	/** Rol deseado para el usuario creado automaticamente. */
	user_role?: string | null;
}
