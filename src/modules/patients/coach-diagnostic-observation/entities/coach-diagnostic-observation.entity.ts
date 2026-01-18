export interface CoachDiagnosticObservation {
	id: number;
	patientId: number | null;
	instrumentId: number | null;
	topicId: number | null;
	appliedAt: string | null;
	comment: string | null;
	coach: string | null;
	createdAt: string | null;
	updatedAt: string | null;
}
