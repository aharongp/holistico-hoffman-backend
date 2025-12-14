export interface PatientPunctualityRecord {
  id: number;
  patientId: number | null;
  date: string | null;
  activity: string | null;
  punctuality: number | null;
  effectiveness: number | null;
  compliance: number | null;
  roleEffectiveness: number | null;
  evaluated: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}
