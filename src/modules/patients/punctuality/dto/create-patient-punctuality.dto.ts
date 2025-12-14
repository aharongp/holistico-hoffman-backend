export class CreatePatientPunctualityDto {
  id_paciente?: number | string | null;
  patientId?: number | string | null;
  fecha?: string | Date | null;
  date?: string | Date | null;
  actividad?: string | null;
  activity?: string | null;
  puntualidad?: number | string | null;
  punctuality?: number | string | null;
  efectividad?: number | string | null;
  effectiveness?: number | string | null;
  cumplimiento?: number | string | null;
  compliance?: number | string | null;
  efectividad_rol?: number | string | null;
  roleEffectiveness?: number | string | null;
  evaluado?: number | boolean | null;
  evaluated?: number | boolean | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}
