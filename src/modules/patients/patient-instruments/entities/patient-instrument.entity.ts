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

export interface PatientInstrumentResponse {
  id: number;
  patientId: number | null;
  patientInstrumentId: number | null;
  instrumentId: number | null;
  instrumentTypeId: number | null;
  topicId: number | null;
  criterionId: number | null;
  questionId: number | null;
  theme: string | null;
  topic: string | null;
  question: string | null;
  answer: string | null;
  competence: string | null;
  type: string | null;
  order: number | null;
  saved: boolean;
  evaluated: boolean;
  answerDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
