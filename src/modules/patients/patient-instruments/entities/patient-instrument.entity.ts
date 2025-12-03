export interface PatientInstrumentAssignment {
	id: number;
	patientId: number | null;
	instrumentTypeId: number | null;
	instrumentTypeName: string | null;
	instrumentTypeDescription: string | null;
	assignedAt: string | null;
	createdAt: string | null;
	updatedAt: string | null;
	validUntil: string | null;
	completed: boolean;
	evaluated: boolean;
	available: boolean;
	availabilityRaw: string | null;
	origin: string | null;
	ribbonId: number | null;
	topics: string[];
}

export interface InstrumentGraphic {
	id: number;
	instrumentId: number | null;
	title: string | null;
	sentence: string | null;
	chartType: string | null;
	width: number | null;
	height: number | null;
	createdAt: string | null;
	updatedAt: string | null;
	criterionId: number | null;
}
