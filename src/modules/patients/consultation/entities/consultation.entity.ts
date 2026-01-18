export interface Consultation {
	id: number;
	patientId: number | null;
	reason: string | null;
	date: string | null;
	weight: string | null;
	bodyMassIndex: string | null;
	bodyFat: string | null;
	pulse: string | null;
	maxHeartRate: string | null;
	bloodPressure: string | null;
	arm: string | null;
	thigh: string | null;
	waist: string | null;
	hip: string | null;
	chest: string | null;
	neck: string | null;
	finding: string | null;
	diagnosis: string | null;
	recommendation: string | null;
	observation: string | null;
	breathing: string | null;
	evolution: string | null;
	coachRecommendation: string | null;
	indications: string | null;
	createdAt: string | null;
	updatedAt: string | null;
}
