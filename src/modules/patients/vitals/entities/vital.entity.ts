export type VitalSource =
  | 'consultation'
  | 'pulse'
	| 'glycemia'
	| 'heart_rate';

export interface BaseVitalRecord {
	id: number;
	recordedAt: string | null;
	source: VitalSource;
}

export interface NumericVitalRecord extends BaseVitalRecord {
	value: number | null;
	rawValue: string | null;
	unit: string | null;
}

export interface BloodPressureRecord extends BaseVitalRecord {
	systolic: number | null;
	diastolic: number | null;
	rawValue: string | null;
}

export interface PatientVitalsSummary {
	weight: NumericVitalRecord[];
	pulse: NumericVitalRecord[];
	bloodPressure: BloodPressureRecord[];
	bodyMassIndex: NumericVitalRecord[];
	glycemia: NumericVitalRecord[];
	heartRateRecovery: HeartRateRecoveryRecord[];
}

export interface HeartRateRecoveryRecord extends BaseVitalRecord {
	resting: number | null;
	after5Minutes: number | null;
	after10Minutes: number | null;
	after15Minutes: number | null;
	after30Minutes: number | null;
	after45Minutes: number | null;
	sessionType: string | null;
}
