export class CreateVitalDto {
	/** Peso en kg. Puede ser número o texto con decimal (ej: '72.5') */
	peso: string;

	/** Fecha opcional en formato ISO (ej: '2025-11-11'). Si no se proporciona se usará la fecha actual */
	fecha?: string;
}
