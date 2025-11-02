export interface PatientPersonalHistory {
	birthPlace: string | null;
	birthTime: string | null;
	birthDate: string | null;
	maritalStatus: string | null;
	profession: string | null;
	occupation: string | null;
}

export interface PatientContactHistory {
	phone: string | null;
	address: string | null;
	companyAddress: string | null;
	closeFamily: string | null;
	relationship: string | null;
	familyPhone: string | null;
	emergencyContact: string | null;
	emergencyEmail: string | null;
	emergencyPhone: string | null;
}

export interface PatientTreatingDoctorHistory {
	treatingDoctor: string | null;
	specialty: string | null;
	currentMedication: string | null;
}

export interface PatientFamilyPathologyHistory {
	cancer: string | null;
	tuberculosis: string | null;
	diabetes: string | null;
	asthma: string | null;
	highBloodPressure: string | null;
	epilepsy: string | null;
	mentalIllness: string | null;
	suicide: string | null;
	bloodDisease: string | null;
	vascularDisease: string | null;
	arthritis: string | null;
	syphilis: string | null;
	others: string | null;
}

export interface PatientFamilyContextHistory {
	fatherAge: string | null;
	motherAge: string | null;
	fatherStatus: string | null;
	motherStatus: string | null;
	siblingsCount: string | null;
	siblingPosition: string | null;
	childrenCount: string | null;
	livesWith: string | null;
}

export interface PatientFamilyHistory {
	pathologies: PatientFamilyPathologyHistory;
	context: PatientFamilyContextHistory;
}

export interface PatientImmunizationHistory {
	bcg: boolean;
	polio: boolean;
	measles: boolean;
	typhoid: boolean;
	triple: boolean;
	tetanus: boolean;
	cholera: boolean;
	yellowFever: boolean;
	otherImmunization: string | null;
}

export interface PatientGynecologicalHistory {
	developmentAge: string | null;
	menstruation: string | null;
	menstrualCycle: string | null;
	flow: string | null;
	birthControlMethod: string | null;
	pregnancies: string | null;
	labors: string | null;
	cesareans: string | null;
	births: string | null;
	abortions: string | null;
	menopauseAge: string | null;
}

export interface PatientLifestyleHistory {
	sport: string | null;
	sportFrequency: string | null;
	workingHours: string | null;
	jobSatisfaction: string | null;
	jobStability: string | null;
	rest: string | null;
	freeTime: string | null;
	workSharing: string | null;
	leisure: string | null;
	pets: string | null;
	plants: string | null;
	technology: string | null;
	creed: string | null;
	consumption: string | null;
	friendships: string | null;
	partner: string | null;
	family: string | null;
	spirituality: string | null;
}

export interface PatientClinicalBackgroundHistory {
	otherDisease: string | null;
	surgeries: string | null;
	injuries: string | null;
	therapies: string | null;
	allergies: string | null;
	currentIllness: string | null;
	otherAlteration: string | null;
	breathing: string | null;
	appetite: string | null;
	aversions: string | null;
	intolerances: string | null;
	drinks: string | null;
	addictions: string | null;
	evacuation: string | null;
	vitality: string | null;
	sleep: string | null;
	skinManifestation: string | null;
	sweatingTemperature: string | null;
	urination: string | null;
	sexuality: string | null;
	psychiatricCondition: string | null;
	physicalCondition: string | null;
	bloodGroup: string | null;
	biotype: string | null;
}

export interface PatientMedicalAttachment {
	id: number;
	file: string | null;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface PatientMedicalConsultation {
	id: number;
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
}

export interface PatientCoachConsultation {
	id: number;
	date: string | null;
	coach: string | null;
	observation: string | null;
	reason: string | null;
}

export interface PatientDiseaseHistoryEntry {
	id: number;
	disease: string | null;
	status: string | null;
	onset: string | null;
	updatedAt: string | null;
}

export interface PatientMedicalHistory {
	personal: PatientPersonalHistory | null;
	contacts: PatientContactHistory | null;
	treatingDoctor: PatientTreatingDoctorHistory | null;
	family: PatientFamilyHistory | null;
	immunizations: PatientImmunizationHistory | null;
	gynecological: PatientGynecologicalHistory | null;
	lifestyle: PatientLifestyleHistory | null;
	clinicalBackground: PatientClinicalBackgroundHistory | null;
	attachments: PatientMedicalAttachment[];
	consultations: PatientMedicalConsultation[];
	coachConsultations: PatientCoachConsultation[];
	diseases: PatientDiseaseHistoryEntry[];
}

export type History = PatientMedicalHistory;
