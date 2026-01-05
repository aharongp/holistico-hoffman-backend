import {
  PatientClinicalBackgroundHistory,
  PatientContactHistory,
  PatientFamilyHistory,
  PatientGynecologicalHistory,
  PatientImmunizationHistory,
  PatientLifestyleHistory,
  PatientPersonalHistory,
  PatientTreatingDoctorHistory,
} from '../entities/history.entity';

type NullableSection<T> = {
  [K in keyof T]?: T[K] | null | undefined;
};

type PartialImmunizationHistory = Partial<
  Record<
    keyof PatientImmunizationHistory,
    boolean | number | string | null | undefined
  >
>;

type DiseaseRecord = Record<string, string | null | undefined>;

type DiseaseArrayEntry = {
  key?: string | null;
  disease?: string | null;
  status?: string | null;
  onset?: string | null;
  value?: string | null;
  detail?: string | null;
};

type DiseasesPayload = DiseaseRecord | DiseaseArrayEntry[];

type AlterationsPayload = Record<string, boolean | null | undefined>;

export interface CreateHistoryDto {
  personal?: NullableSection<PatientPersonalHistory>;
  contacts?: NullableSection<PatientContactHistory>;
  treatingDoctor?: NullableSection<PatientTreatingDoctorHistory>;
  family?: {
    pathologies?: NullableSection<PatientFamilyHistory['pathologies']>;
    context?: NullableSection<PatientFamilyHistory['context']>;
  };
  immunizations?: PartialImmunizationHistory;
  gynecological?: NullableSection<PatientGynecologicalHistory>;
  lifestyle?: NullableSection<PatientLifestyleHistory>;
  clinicalBackground?: NullableSection<PatientClinicalBackgroundHistory>;
  diseases?: DiseasesPayload;
  alterations?: AlterationsPayload;
}
