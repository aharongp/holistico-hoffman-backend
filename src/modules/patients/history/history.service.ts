import { Injectable } from '@nestjs/common';
import { paciente, paciente_antecedente } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PatientClinicalBackgroundHistory,
  PatientCoachConsultation,
  PatientContactHistory,
  PatientDiseaseHistoryEntry,
  PatientFamilyHistory,
  PatientGynecologicalHistory,
  PatientImmunizationHistory,
  PatientLifestyleHistory,
  PatientMedicalAttachment,
  PatientMedicalConsultation,
  PatientMedicalHistory,
  PatientPersonalHistory,
  PatientTreatingDoctorHistory,
} from './entities/history.entity';

const toIsoString = (value: Date | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  return value.toISOString();
};

const toTimeString = (value: Date | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const iso = value.toISOString();
  const [, time = null] = iso.split('T');
  if (!time) {
    return iso;
  }
  return time.replace('Z', '').split('.')[0];
};

const toStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
};

const toBoolean = (value: number | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  return Number(value) === 1;
};

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  private async loadPatient(patientId: number): Promise<paciente | null> {
    return this.prisma.paciente.findUnique({ where: { id: patientId } });
  }

  private async loadPatientByUserId(userId: number): Promise<paciente | null> {
    return this.prisma.paciente.findFirst({ where: { id_usuario: userId } });
  }

  private async loadAntecedent(patientId: number): Promise<paciente_antecedente | null> {
    return this.prisma.paciente_antecedente.findFirst({ where: { id_paciente: patientId } });
  }

  private mapPersonal(patient: paciente | null): PatientPersonalHistory | null {
    if (!patient) {
      return null;
    }

    return {
      birthPlace: toStringOrNull(patient.lugar_nacimiento),
      birthTime: toTimeString(patient.hora_nacimiento as Date | null | undefined),
      birthDate: toIsoString(patient.fecha_nacimiento as Date | null | undefined),
      maritalStatus: toStringOrNull(patient.estado_civil),
      profession: toStringOrNull(patient.profesion),
      occupation: toStringOrNull(patient.ocupacion),
    };
  }

  private mapContacts(patient: paciente | null): PatientContactHistory | null {
    if (!patient) {
      return null;
    }

    return {
      phone: toStringOrNull(patient.telefono),
      address: toStringOrNull(patient.direccion),
      companyAddress: toStringOrNull(patient.empresa_direccion),
      closeFamily: toStringOrNull(patient.familiar_cercano),
      relationship: toStringOrNull(patient.familiar_cercano_parentesco),
      familyPhone: toStringOrNull(patient.familiar_cercano_telefono),
      emergencyContact: toStringOrNull(patient.contacto),
      emergencyEmail: toStringOrNull(patient.contacto_correo),
      emergencyPhone: toStringOrNull(patient.contacto_telefono),
    };
  }

  private mapTreatingDoctor(patient: paciente | null): PatientTreatingDoctorHistory | null {
    if (!patient) {
      return null;
    }

    return {
      treatingDoctor: toStringOrNull(patient.medico_tratante),
      specialty: toStringOrNull(patient.medico_tratante_especialidad),
      currentMedication: toStringOrNull(patient.medicacion),
    };
  }

  private mapFamily(antecedent: paciente_antecedente | null): PatientFamilyHistory | null {
    if (!antecedent) {
      return null;
    }

    return {
      pathologies: {
        cancer: toStringOrNull(antecedent.cancer),
        tuberculosis: toStringOrNull(antecedent.tuberculosis),
        diabetes: toStringOrNull(antecedent.diabetes),
        asthma: toStringOrNull(antecedent.asma),
        highBloodPressure: toStringOrNull(antecedent.tension_alta),
        epilepsy: toStringOrNull(antecedent.epilepsia),
        mentalIllness: toStringOrNull(antecedent.enfermedad_mental),
        suicide: toStringOrNull(antecedent.suicidio),
        bloodDisease: toStringOrNull(antecedent.enfermedad_sangre),
        vascularDisease: toStringOrNull(antecedent.enfermedad_vasos),
        arthritis: toStringOrNull(antecedent.artritis),
        syphilis: toStringOrNull(antecedent.sifilis),
        others: toStringOrNull(antecedent.otras),
      },
      context: {
        fatherAge: toStringOrNull(antecedent.padre_edad),
        motherAge: toStringOrNull(antecedent.madre_edad),
        fatherStatus: toStringOrNull(antecedent.padre_fallecido),
        motherStatus: null,
        siblingsCount: toStringOrNull(antecedent.numero_hermano),
        siblingPosition: toStringOrNull(antecedent.posicion_ocupa),
        childrenCount: toStringOrNull(antecedent.numero_hijo),
        livesWith: toStringOrNull(antecedent.vive_quien),
      },
    };
  }

  private mapImmunizations(antecedent: paciente_antecedente | null): PatientImmunizationHistory | null {
    if (!antecedent) {
      return null;
    }

    return {
      bcg: toBoolean(antecedent.bcg),
      polio: toBoolean(antecedent.polio),
      measles: toBoolean(antecedent.sarampion),
      typhoid: toBoolean(antecedent.tifus),
      triple: toBoolean(antecedent.triple),
      tetanus: toBoolean(antecedent.tetano),
      cholera: toBoolean(antecedent.colera),
      yellowFever: toBoolean(antecedent.fiebre_amarilla),
      otherImmunization: toStringOrNull(antecedent.otra_inmunizacion),
    };
  }

  private mapGynecological(antecedent: paciente_antecedente | null): PatientGynecologicalHistory | null {
    if (!antecedent) {
      return null;
    }

    return {
      developmentAge: toStringOrNull(antecedent.edad_desarrollo),
      menstruation: toStringOrNull(antecedent.menstruacion),
      menstrualCycle: toStringOrNull(antecedent.ciclo_menstrual),
      flow: toStringOrNull(antecedent.flujo),
      birthControlMethod: toStringOrNull(antecedent.metodo_control_natal),
      pregnancies: toStringOrNull(antecedent.numero_embarazo),
      labors: toStringOrNull(antecedent.numero_parto),
      cesareans: toStringOrNull(antecedent.numero_cesarea),
      births: toStringOrNull(antecedent.numero_nacimiento),
      abortions: toStringOrNull(antecedent.numero_aborto),
      menopauseAge: toStringOrNull(antecedent.edad_menopausia),
    };
  }

  private mapLifestyle(antecedent: paciente_antecedente | null): PatientLifestyleHistory | null {
    if (!antecedent) {
      return null;
    }

    return {
      sport: toStringOrNull(antecedent.deporte),
      sportFrequency: toStringOrNull(antecedent.deporte_frecuencia),
      workingHours: toStringOrNull(antecedent.hora_laborable),
      jobSatisfaction: toStringOrNull(antecedent.trabajo_satisface),
      jobStability: toStringOrNull(antecedent.trabajo_estabilidad),
      rest: toStringOrNull(antecedent.descansa),
      freeTime: toStringOrNull(antecedent.tiempo_libre),
      workSharing: toStringOrNull(antecedent.trabajo_comparte),
      leisure: toStringOrNull(antecedent.distraccion),
      pets: toStringOrNull(antecedent.animal_domestico),
      plants: toStringOrNull(antecedent.plantas),
      technology: toStringOrNull(antecedent.tecnologia),
      creed: toStringOrNull(antecedent.credo_religioso),
      consumption: toStringOrNull(antecedent.consumo),
      friendships: toStringOrNull(antecedent.amistad),
      partner: toStringOrNull(antecedent.pareja),
      family: toStringOrNull(antecedent.familia),
      spirituality: toStringOrNull(antecedent.espiritualidad),
    };
  }

  private mapClinicalBackground(antecedent: paciente_antecedente | null): PatientClinicalBackgroundHistory | null {
    if (!antecedent) {
      return null;
    }

    return {
      otherDisease: toStringOrNull(antecedent.otra_enfermedad),
      surgeries: toStringOrNull(antecedent.operacion),
      injuries: toStringOrNull(antecedent.herida),
      therapies: toStringOrNull(antecedent.terapia),
      allergies: toStringOrNull(antecedent.alergia),
      currentIllness: toStringOrNull(antecedent.enfermedad_actual),
      otherAlteration: toStringOrNull(antecedent.otra_alteracion),
      breathing: toStringOrNull(antecedent.respiracion),
      appetite: toStringOrNull(antecedent.apetito_comida),
      aversions: toStringOrNull(antecedent.aversion),
      intolerances: toStringOrNull(antecedent.intolerancia),
      drinks: toStringOrNull(antecedent.bebida),
      addictions: toStringOrNull(antecedent.adiccion),
      evacuation: toStringOrNull(antecedent.evacuacion),
      vitality: toStringOrNull(antecedent.vitalidad),
      sleep: toStringOrNull(antecedent.dormir),
      skinManifestation: toStringOrNull(antecedent.manifestacion_cutanea),
      sweatingTemperature: toStringOrNull(antecedent.sudoracion_temperatura),
      urination: toStringOrNull(antecedent.miccion),
      sexuality: toStringOrNull(antecedent.sexualidad),
      psychiatricCondition: toStringOrNull(antecedent.condicion_psiquica),
      physicalCondition: toStringOrNull(antecedent.condicion_fisica),
      bloodGroup: toStringOrNull(antecedent.grupo_sanguineo),
      biotype: toStringOrNull(antecedent.biotipo),
    };
  }

  async getPersonalHistory(patientId: number): Promise<PatientPersonalHistory | null> {
    const patient = await this.loadPatient(patientId);
    return this.mapPersonal(patient);
  }

  async getContactHistory(patientId: number): Promise<PatientContactHistory | null> {
    const patient = await this.loadPatient(patientId);
    return this.mapContacts(patient);
  }

  async getTreatingDoctorHistory(patientId: number): Promise<PatientTreatingDoctorHistory | null> {
    const patient = await this.loadPatient(patientId);
    return this.mapTreatingDoctor(patient);
  }

  async getFamilyHistory(patientId: number): Promise<PatientFamilyHistory | null> {
    const antecedent = await this.loadAntecedent(patientId);
    return this.mapFamily(antecedent);
  }

  async getImmunizationHistory(patientId: number): Promise<PatientImmunizationHistory | null> {
    const antecedent = await this.loadAntecedent(patientId);
    return this.mapImmunizations(antecedent);
  }

  async getGynecologicalHistory(patientId: number): Promise<PatientGynecologicalHistory | null> {
    const antecedent = await this.loadAntecedent(patientId);
    return this.mapGynecological(antecedent);
  }

  async getLifestyleHistory(patientId: number): Promise<PatientLifestyleHistory | null> {
    const antecedent = await this.loadAntecedent(patientId);
    return this.mapLifestyle(antecedent);
  }

  async getClinicalBackgroundHistory(patientId: number): Promise<PatientClinicalBackgroundHistory | null> {
    const antecedent = await this.loadAntecedent(patientId);
    return this.mapClinicalBackground(antecedent);
  }

  async getMedicalAttachments(patientId: number): Promise<PatientMedicalAttachment[]> {
    const attachments = await this.prisma.paciente_historia.findMany({
      where: { id_paciente: patientId },
      orderBy: { created_at: 'desc' },
    });

    return attachments.map((item) => ({
      id: item.id,
      file: toStringOrNull(item.archivo),
      createdAt: toIsoString(item.created_at as Date | null | undefined),
      updatedAt: toIsoString(item.updated_at as Date | null | undefined),
    }));
  }

  async getMedicalConsultations(patientId: number): Promise<PatientMedicalConsultation[]> {
    const consultations = await this.prisma.paciente_consulta.findMany({
      where: { id_paciente: patientId },
      orderBy: { fecha: 'desc' },
    });

    return consultations.map((item) => ({
      id: item.id,
      reason: toStringOrNull(item.motivo),
      date: toIsoString(item.fecha as Date | null | undefined),
      weight: toStringOrNull(item.peso),
      bodyMassIndex: toStringOrNull(item.imc),
      bodyFat: toStringOrNull(item.gc),
      pulse: toStringOrNull(item.pulso),
      maxHeartRate: toStringOrNull(item.fcm),
      bloodPressure: toStringOrNull(item.tension),
      arm: toStringOrNull(item.brazo),
      thigh: toStringOrNull(item.muslo),
      waist: toStringOrNull(item.cintura),
      hip: toStringOrNull(item.cadera),
      chest: toStringOrNull(item.busto_pecho),
      neck: toStringOrNull(item.cuello),
      finding: toStringOrNull(item.hallazgo),
      diagnosis: toStringOrNull(item.diagnostico),
      recommendation: toStringOrNull(item.recomendacion),
      observation: toStringOrNull(item.observacion),
      breathing: toStringOrNull(item.respiracion),
      evolution: toStringOrNull(item.evolucion),
      coachRecommendation: toStringOrNull(item.recomendacion_coach),
      indications: toStringOrNull(item.indicaciones),
    }));
  }

  async getCoachConsultations(patientId: number): Promise<PatientCoachConsultation[]> {
    const consultations = await this.prisma.paciente_consulta_coach.findMany({
      where: { id_paciente: patientId },
      orderBy: { fecha: 'desc' },
    });

    return consultations.map((item) => ({
      id: item.id,
      date: toIsoString(item.fecha as Date | null | undefined),
      coach: toStringOrNull(item.coach),
      observation: toStringOrNull(item.observacion),
      reason: toStringOrNull(item.motivo),
    }));
  }

  async getDiseaseHistory(patientId: number): Promise<PatientDiseaseHistoryEntry[]> {
    const diseases = await this.prisma.paciente_enfermedad.findMany({
      where: { id_paciente: patientId }
    });

    return diseases.map((item) => ({
      id: item.id,
      disease: toStringOrNull(item.enfermedad),
      status: toStringOrNull(item.estatus),
      onset: toStringOrNull(item.inicio),
      updatedAt: toIsoString(item.updated_at as Date | null | undefined),
    }));
  }

  async getFullMedicalHistory(patientId: number): Promise<PatientMedicalHistory> {
    const [patientRecord, antecedentRecord, attachments, consultations, coachConsultations, diseases] = await Promise.all([
      this.loadPatient(patientId),
      this.loadAntecedent(patientId),
      this.getMedicalAttachments(patientId),
      this.getMedicalConsultations(patientId),
      this.getCoachConsultations(patientId),
      this.getDiseaseHistory(patientId),
    ]);

    return {
      personal: this.mapPersonal(patientRecord),
      contacts: this.mapContacts(patientRecord),
      treatingDoctor: this.mapTreatingDoctor(patientRecord),
      family: this.mapFamily(antecedentRecord),
      immunizations: this.mapImmunizations(antecedentRecord),
      gynecological: this.mapGynecological(antecedentRecord),
      lifestyle: this.mapLifestyle(antecedentRecord),
      clinicalBackground: this.mapClinicalBackground(antecedentRecord),
      attachments,
      consultations,
      coachConsultations,
      diseases,
    };
  }

  async getFullMedicalHistoryByUserId(userId: number): Promise<PatientMedicalHistory | null> {
    const patientRecord = await this.loadPatientByUserId(userId);
    if (!patientRecord) {
      return null;
    }

    const patientId = patientRecord.id;
    const [antecedentRecord, attachments, consultations, coachConsultations, diseases] = await Promise.all([
      this.loadAntecedent(patientId),
      this.getMedicalAttachments(patientId),
      this.getMedicalConsultations(patientId),
      this.getCoachConsultations(patientId),
      this.getDiseaseHistory(patientId),
    ]);

    return {
      personal: this.mapPersonal(patientRecord),
      contacts: this.mapContacts(patientRecord),
      treatingDoctor: this.mapTreatingDoctor(patientRecord),
      family: this.mapFamily(antecedentRecord),
      immunizations: this.mapImmunizations(antecedentRecord),
      gynecological: this.mapGynecological(antecedentRecord),
      lifestyle: this.mapLifestyle(antecedentRecord),
      clinicalBackground: this.mapClinicalBackground(antecedentRecord),
      attachments,
      consultations,
      coachConsultations,
      diseases,
    };
  }
}
