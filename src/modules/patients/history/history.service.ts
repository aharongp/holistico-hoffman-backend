import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import type { ReadStream } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { Prisma, paciente, paciente_antecedente } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateHistoryDto } from './dto/update-history.dto';
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
  PatientMedicalAttachmentWithPatient,
  PatientMedicalConsultation,
  PatientMedicalHistory,
  PatientPersonalHistory,
  PatientTreatingDoctorHistory,
} from './entities/history.entity';

type UploadedAttachmentFile = {
  buffer: Buffer;
  originalname?: string | null;
  mimetype?: string | null;
  size?: number | null;
};

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

const normalizeLabelKey = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
};

const DISEASE_KEY_TO_LABEL: Record<string, string> = {
  sarampion: 'Sarampion',
  lechina: 'Lechina',
  escarlatina: 'Escarlatina',
  difteria: 'Difteria',
  tosferina: 'Tosferina',
  paperas: 'Paperas',
  polio: 'Polio',
  tetano: 'Tetano',
  disenteria: 'Disenteria',
  parasitos: 'Parasitos',
  meningitis: 'Meningitis',
  asma: 'Asma',
  acne: 'Acne',
  forunculosis: 'Forunculosis',
  eczema: 'Eczema',
  psoriasis: 'Psoriasis',
  alergia: 'Alergia',
  sinusitis: 'Sinusitis',
  anginas: 'Anginas',
  bronquitis: 'Bronquitis',
  diabetes: 'Diabetes',
  enfermedadtiroidea: 'Enfermedad Tiroidea',
  enfermedadcardiaca: 'Enfermedad Cardiaca',
  enfermedadneurologica: 'Enfermedad Neurologica',
  enfermedadmental: 'Enfermedad Mental',
  epilepsia: 'Epilepsia',
  litiasisrenal: 'Litiasis Renal',
  litiasisvesicular: 'Litiasis Vesicular',
  hepatitis: 'Hepatitis',
  nefritis: 'Nefritis',
  gastritis: 'Gastritis',
  ulcera: 'Ulcera',
  lepra: 'Lepra',
  tbc: 'TBC',
  sifilis: 'Sifilis',
  blenorragia: 'Blenorragia',
  otravenera: 'Otra Venerea',
  fiebrereumatica: 'Fiebre Reumatica',
  artritis: 'Artritis',
  enfermedadmuscular: 'Enfermedad Muscular',
  gota: 'Gota',
  cancer: 'Cancer',
};

@Injectable()
export class HistoryService {
  private readonly historyAssetsDir = (() => {
    const candidates = [
      join(process.cwd(), 'src', 'assets', 'historia'),
      join(process.cwd(), 'dist', 'assets', 'historia'),
      join(__dirname, '..', '..', '..', 'assets', 'historia'),
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return candidates[0];
  })();

  constructor(private readonly prisma: PrismaService) {}

  private resolveAttachmentPath(relativePath: string): string {
    const sanitized = relativePath.replace(/^[\\/]+/, '');
    const absolutePath = resolve(this.historyAssetsDir, sanitized);
    const diff = relative(this.historyAssetsDir, absolutePath);
    if (diff.startsWith('..') || diff.includes('..')) {
      throw new NotFoundException('Attachment path is invalid');
    }
    return absolutePath;
  }

  private guessMimeType(filename: string): string {
    const extension = extname(filename).toLowerCase();
    switch (extension) {
      case '.pdf':
        return 'application/pdf';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.doc':
        return 'application/msword';
      case '.docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case '.xls':
        return 'application/vnd.ms-excel';
      case '.xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case '.txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  private guessExtension(mimeType: string | undefined | null): string {
    if (!mimeType) {
      return '';
    }

    switch (mimeType.toLowerCase()) {
      case 'application/pdf':
        return '.pdf';
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'application/msword':
        return '.doc';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return '.docx';
      case 'application/vnd.ms-excel':
        return '.xls';
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return '.xlsx';
      case 'text/plain':
        return '.txt';
      default:
        return '';
    }
  }

  private async loadPatient(patientId: number): Promise<paciente | null> {
    return this.prisma.paciente.findUnique({ where: { id: patientId } });
  }

  private async loadPatientByUserId(userId: number): Promise<paciente | null> {
    return this.prisma.paciente.findFirst({ where: { id_usuario: userId } });
  }

  private async loadAntecedent(patientId: number): Promise<paciente_antecedente | null> {
    return this.prisma.paciente_antecedente.findFirst({ where: { id_paciente: patientId } });
  }

  private sanitizeString(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      const normalized = String(value).trim();
      return normalized.length > 0 ? normalized : null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    return null;
  }

  private sanitizeDateValue(value: unknown): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const iso = trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00.000Z`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private sanitizeTimeValue(value: unknown): Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const normalized = trimmed.length === 5 ? `${trimmed}:00` : trimmed;
      const date = new Date(`1970-01-01T${normalized}Z`);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private sanitizeImmunizationValue(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'number') {
      return value ? 1 : 0;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      if (trimmed === '') {
        return null;
      }
      if (trimmed === '1' || trimmed === 'true' || trimmed === 'yes' || trimmed === 'si') {
        return 1;
      }
      if (trimmed === '0' || trimmed === 'false' || trimmed === 'no') {
        return 0;
      }
    }

    return null;
  }

  private hasData(data: Record<string, unknown>): boolean {
    return Object.keys(data).length > 0;
  }

  private getDiseaseLabelFromKey(normalizedKey: string, fallbackLabel?: string | null): string {
    if (fallbackLabel) {
      const sanitized = this.sanitizeString(fallbackLabel);
      if (sanitized) {
        return sanitized;
      }
    }

    return DISEASE_KEY_TO_LABEL[normalizedKey] ?? normalizedKey;
  }

  private buildPatientUpdateData(payload: UpdateHistoryDto | undefined): Record<string, any> {
    const data: Record<string, any> = {};
    if (!payload) {
      return data;
    }

    const { personal, contacts, treatingDoctor } = payload;

    if (personal) {
      if (personal.birthPlace !== undefined) {
        data.lugar_nacimiento = this.sanitizeString(personal.birthPlace);
      }
      if (personal.birthTime !== undefined) {
        data.hora_nacimiento = this.sanitizeTimeValue(personal.birthTime);
      }
      if (personal.birthDate !== undefined) {
        data.fecha_nacimiento = this.sanitizeDateValue(personal.birthDate);
      }
      if (personal.maritalStatus !== undefined) {
        data.estado_civil = this.sanitizeString(personal.maritalStatus);
      }
      if (personal.profession !== undefined) {
        data.profesion = this.sanitizeString(personal.profession);
      }
      if (personal.occupation !== undefined) {
        data.ocupacion = this.sanitizeString(personal.occupation);
      }
    }

    if (contacts) {
      if (contacts.phone !== undefined) {
        data.telefono = this.sanitizeString(contacts.phone);
      }
      if (contacts.address !== undefined) {
        data.direccion = this.sanitizeString(contacts.address);
      }
      if (contacts.companyAddress !== undefined) {
        data.empresa_direccion = this.sanitizeString(contacts.companyAddress);
      }
      if (contacts.closeFamily !== undefined) {
        data.familiar_cercano = this.sanitizeString(contacts.closeFamily);
      }
      if (contacts.relationship !== undefined) {
        data.familiar_cercano_parentesco = this.sanitizeString(contacts.relationship);
      }
      if (contacts.familyPhone !== undefined) {
        data.familiar_cercano_telefono = this.sanitizeString(contacts.familyPhone);
      }
      if (contacts.emergencyContact !== undefined) {
        data.contacto = this.sanitizeString(contacts.emergencyContact);
      }
      if (contacts.emergencyEmail !== undefined) {
        data.contacto_correo = this.sanitizeString(contacts.emergencyEmail);
      }
      if (contacts.emergencyPhone !== undefined) {
        data.contacto_telefono = this.sanitizeString(contacts.emergencyPhone);
      }
    }

    if (treatingDoctor) {
      if (treatingDoctor.treatingDoctor !== undefined) {
        data.medico_tratante = this.sanitizeString(treatingDoctor.treatingDoctor);
      }
      if (treatingDoctor.specialty !== undefined) {
        data.medico_tratante_especialidad = this.sanitizeString(treatingDoctor.specialty);
      }
      if (treatingDoctor.currentMedication !== undefined) {
        data.medicacion = this.sanitizeString(treatingDoctor.currentMedication);
      }
    }

    return data;
  }

  private buildAntecedentData(payload: UpdateHistoryDto | undefined): Record<string, any> {
    const data: Record<string, any> = {};
    if (!payload) {
      return data;
    }

    const { family, immunizations, gynecological, lifestyle, clinicalBackground } = payload;

    if (family?.pathologies) {
      const { pathologies } = family;
      if (pathologies.cancer !== undefined) {
        data.cancer = this.sanitizeString(pathologies.cancer);
      }
      if (pathologies.tuberculosis !== undefined) {
        data.tuberculosis = this.sanitizeString(pathologies.tuberculosis);
      }
      if (pathologies.diabetes !== undefined) {
        data.diabetes = this.sanitizeString(pathologies.diabetes);
      }
      if (pathologies.asthma !== undefined) {
        data.asma = this.sanitizeString(pathologies.asthma);
      }
      if (pathologies.highBloodPressure !== undefined) {
        data.tension_alta = this.sanitizeString(pathologies.highBloodPressure);
      }
      if (pathologies.epilepsy !== undefined) {
        data.epilepsia = this.sanitizeString(pathologies.epilepsy);
      }
      if (pathologies.mentalIllness !== undefined) {
        data.enfermedad_mental = this.sanitizeString(pathologies.mentalIllness);
      }
      if (pathologies.suicide !== undefined) {
        data.suicidio = this.sanitizeString(pathologies.suicide);
      }
      if (pathologies.bloodDisease !== undefined) {
        data.enfermedad_sangre = this.sanitizeString(pathologies.bloodDisease);
      }
      if (pathologies.vascularDisease !== undefined) {
        data.enfermedad_vasos = this.sanitizeString(pathologies.vascularDisease);
      }
      if (pathologies.arthritis !== undefined) {
        data.artritis = this.sanitizeString(pathologies.arthritis);
      }
      if (pathologies.syphilis !== undefined) {
        data.sifilis = this.sanitizeString(pathologies.syphilis);
      }
      if (pathologies.others !== undefined) {
        data.otras = this.sanitizeString(pathologies.others);
      }
    }

    if (family?.context) {
      const { context } = family;
      if (context.fatherAge !== undefined) {
        data.padre_edad = this.sanitizeString(context.fatherAge);
      }
      if (context.motherAge !== undefined) {
        data.madre_edad = this.sanitizeString(context.motherAge);
      }
      if (context.fatherStatus !== undefined) {
        data.padre_fallecido = this.sanitizeString(context.fatherStatus);
      }
      if (context.siblingsCount !== undefined) {
        data.numero_hermano = this.sanitizeString(context.siblingsCount);
      }
      if (context.siblingPosition !== undefined) {
        data.posicion_ocupa = this.sanitizeString(context.siblingPosition);
      }
      if (context.childrenCount !== undefined) {
        data.numero_hijo = this.sanitizeString(context.childrenCount);
      }
      if (context.livesWith !== undefined) {
        data.vive_quien = this.sanitizeString(context.livesWith);
      }
    }

    if (immunizations) {
      if (immunizations.bcg !== undefined) {
        data.bcg = this.sanitizeImmunizationValue(immunizations.bcg);
      }
      if (immunizations.polio !== undefined) {
        data.polio = this.sanitizeImmunizationValue(immunizations.polio);
      }
      if (immunizations.measles !== undefined) {
        data.sarampion = this.sanitizeImmunizationValue(immunizations.measles);
      }
      if (immunizations.typhoid !== undefined) {
        data.tifus = this.sanitizeImmunizationValue(immunizations.typhoid);
      }
      if (immunizations.triple !== undefined) {
        data.triple = this.sanitizeImmunizationValue(immunizations.triple);
      }
      if (immunizations.tetanus !== undefined) {
        data.tetano = this.sanitizeImmunizationValue(immunizations.tetanus);
      }
      if (immunizations.cholera !== undefined) {
        data.colera = this.sanitizeImmunizationValue(immunizations.cholera);
      }
      if (immunizations.yellowFever !== undefined) {
        data.fiebre_amarilla = this.sanitizeImmunizationValue(immunizations.yellowFever);
      }
      if (immunizations.otherImmunization !== undefined) {
        data.otra_inmunizacion = this.sanitizeString(immunizations.otherImmunization);
      }
    }

    if (gynecological) {
      if (gynecological.developmentAge !== undefined) {
        data.edad_desarrollo = this.sanitizeString(gynecological.developmentAge);
      }
      if (gynecological.menstruation !== undefined) {
        data.menstruacion = this.sanitizeString(gynecological.menstruation);
      }
      if (gynecological.menstrualCycle !== undefined) {
        data.ciclo_menstrual = this.sanitizeString(gynecological.menstrualCycle);
      }
      if (gynecological.flow !== undefined) {
        data.flujo = this.sanitizeString(gynecological.flow);
      }
      if (gynecological.birthControlMethod !== undefined) {
        data.metodo_control_natal = this.sanitizeString(gynecological.birthControlMethod);
      }
      if (gynecological.pregnancies !== undefined) {
        data.numero_embarazo = this.sanitizeString(gynecological.pregnancies);
      }
      if (gynecological.labors !== undefined) {
        data.numero_parto = this.sanitizeString(gynecological.labors);
      }
      if (gynecological.cesareans !== undefined) {
        data.numero_cesarea = this.sanitizeString(gynecological.cesareans);
      }
      if (gynecological.births !== undefined) {
        data.numero_nacimiento = this.sanitizeString(gynecological.births);
      }
      if (gynecological.abortions !== undefined) {
        data.numero_aborto = this.sanitizeString(gynecological.abortions);
      }
      if (gynecological.menopauseAge !== undefined) {
        data.edad_menopausia = this.sanitizeString(gynecological.menopauseAge);
      }
    }

    if (lifestyle) {
      if (lifestyle.sport !== undefined) {
        data.deporte = this.sanitizeString(lifestyle.sport);
      }
      if (lifestyle.sportFrequency !== undefined) {
        data.deporte_frecuencia = this.sanitizeString(lifestyle.sportFrequency);
      }
      if (lifestyle.workingHours !== undefined) {
        data.hora_laborable = this.sanitizeString(lifestyle.workingHours);
      }
      if (lifestyle.jobSatisfaction !== undefined) {
        data.trabajo_satisface = this.sanitizeString(lifestyle.jobSatisfaction);
      }
      if (lifestyle.jobStability !== undefined) {
        data.trabajo_estabilidad = this.sanitizeString(lifestyle.jobStability);
      }
      if (lifestyle.rest !== undefined) {
        data.descansa = this.sanitizeString(lifestyle.rest);
      }
      if (lifestyle.freeTime !== undefined) {
        data.tiempo_libre = this.sanitizeString(lifestyle.freeTime);
      }
      if (lifestyle.workSharing !== undefined) {
        data.trabajo_comparte = this.sanitizeString(lifestyle.workSharing);
      }
      if (lifestyle.leisure !== undefined) {
        data.distraccion = this.sanitizeString(lifestyle.leisure);
      }
      if (lifestyle.pets !== undefined) {
        data.animal_domestico = this.sanitizeString(lifestyle.pets);
      }
      if (lifestyle.plants !== undefined) {
        data.plantas = this.sanitizeString(lifestyle.plants);
      }
      if (lifestyle.technology !== undefined) {
        data.tecnologia = this.sanitizeString(lifestyle.technology);
      }
      if (lifestyle.creed !== undefined) {
        data.credo_religioso = this.sanitizeString(lifestyle.creed);
      }
      if (lifestyle.consumption !== undefined) {
        data.consumo = this.sanitizeString(lifestyle.consumption);
      }
      if (lifestyle.friendships !== undefined) {
        data.amistad = this.sanitizeString(lifestyle.friendships);
      }
      if (lifestyle.partner !== undefined) {
        data.pareja = this.sanitizeString(lifestyle.partner);
      }
      if (lifestyle.family !== undefined) {
        data.familia = this.sanitizeString(lifestyle.family);
      }
      if (lifestyle.spirituality !== undefined) {
        data.espiritualidad = this.sanitizeString(lifestyle.spirituality);
      }
    }

    if (clinicalBackground) {
      if (clinicalBackground.otherDisease !== undefined) {
        data.otra_enfermedad = this.sanitizeString(clinicalBackground.otherDisease);
      }
      if (clinicalBackground.surgeries !== undefined) {
        data.operacion = this.sanitizeString(clinicalBackground.surgeries);
      }
      if (clinicalBackground.injuries !== undefined) {
        data.herida = this.sanitizeString(clinicalBackground.injuries);
      }
      if (clinicalBackground.therapies !== undefined) {
        data.terapia = this.sanitizeString(clinicalBackground.therapies);
      }
      if (clinicalBackground.allergies !== undefined) {
        data.alergia = this.sanitizeString(clinicalBackground.allergies);
      }
      if (clinicalBackground.currentIllness !== undefined) {
        data.enfermedad_actual = this.sanitizeString(clinicalBackground.currentIllness);
      }
      if (clinicalBackground.otherAlteration !== undefined) {
        data.otra_alteracion = this.sanitizeString(clinicalBackground.otherAlteration);
      }
      if (clinicalBackground.breathing !== undefined) {
        data.respiracion = this.sanitizeString(clinicalBackground.breathing);
      }
      if (clinicalBackground.appetite !== undefined) {
        data.apetito_comida = this.sanitizeString(clinicalBackground.appetite);
      }
      if (clinicalBackground.aversions !== undefined) {
        data.aversion = this.sanitizeString(clinicalBackground.aversions);
      }
      if (clinicalBackground.intolerances !== undefined) {
        data.intolerancia = this.sanitizeString(clinicalBackground.intolerances);
      }
      if (clinicalBackground.drinks !== undefined) {
        data.bebida = this.sanitizeString(clinicalBackground.drinks);
      }
      if (clinicalBackground.addictions !== undefined) {
        data.adiccion = this.sanitizeString(clinicalBackground.addictions);
      }
      if (clinicalBackground.evacuation !== undefined) {
        data.evacuacion = this.sanitizeString(clinicalBackground.evacuation);
      }
      if (clinicalBackground.vitality !== undefined) {
        data.vitalidad = this.sanitizeString(clinicalBackground.vitality);
      }
      if (clinicalBackground.sleep !== undefined) {
        data.dormir = this.sanitizeString(clinicalBackground.sleep);
      }
      if (clinicalBackground.skinManifestation !== undefined) {
        data.manifestacion_cutanea = this.sanitizeString(clinicalBackground.skinManifestation);
      }
      if (clinicalBackground.sweatingTemperature !== undefined) {
        data.sudoracion_temperatura = this.sanitizeString(clinicalBackground.sweatingTemperature);
      }
      if (clinicalBackground.urination !== undefined) {
        data.miccion = this.sanitizeString(clinicalBackground.urination);
      }
      if (clinicalBackground.sexuality !== undefined) {
        data.sexualidad = this.sanitizeString(clinicalBackground.sexuality);
      }
      if (clinicalBackground.psychiatricCondition !== undefined) {
        data.condicion_psiquica = this.sanitizeString(clinicalBackground.psychiatricCondition);
      }
      if (clinicalBackground.physicalCondition !== undefined) {
        data.condicion_fisica = this.sanitizeString(clinicalBackground.physicalCondition);
      }
      if (clinicalBackground.bloodGroup !== undefined) {
        data.grupo_sanguineo = this.sanitizeString(clinicalBackground.bloodGroup);
      }
      if (clinicalBackground.biotype !== undefined) {
        data.biotipo = this.sanitizeString(clinicalBackground.biotype);
      }
    }

    return data;
  }

  private normalizeDiseasesPayload(
    diseases: UpdateHistoryDto['diseases'],
  ): Array<{ normalizedKey: string; label: string; detail: string | null }> {
    if (!diseases) {
      return [];
    }

    const entries: Array<{ normalizedKey: string; label: string; detail: string | null }> = [];

    const pushEntry = (keyCandidate: unknown, detailCandidate: unknown, labelCandidate?: unknown) => {
      const rawKey = this.sanitizeString(keyCandidate);
      if (!rawKey) {
        return;
      }

      const normalizedKey = normalizeLabelKey(rawKey);
      if (!normalizedKey) {
        return;
      }

      const detail = this.sanitizeString(detailCandidate);
      const label = this.getDiseaseLabelFromKey(normalizedKey, this.sanitizeString(labelCandidate));

      entries.push({ normalizedKey, label, detail });
    };

    if (Array.isArray(diseases)) {
      diseases.forEach((entry) => {
        if (!entry) {
          return;
        }
        const keyCandidate = entry.key ?? entry.disease;
        const detailCandidate = entry.detail ?? entry.status ?? entry.value ?? entry.onset;
        const labelCandidate = entry.disease ?? entry.key ?? null;
        pushEntry(keyCandidate, detailCandidate, labelCandidate);
      });
    } else {
      Object.entries(diseases).forEach(([key, value]) => {
        pushEntry(key, value, key);
      });
    }

    return entries;
  }

  private async syncDiseaseHistory(
    tx: Prisma.TransactionClient,
    patientId: number,
    diseases: UpdateHistoryDto['diseases'] | undefined,
  ): Promise<void> {
    const entries = this.normalizeDiseasesPayload(diseases);
    if (entries.length === 0) {
      return;
    }

    const existing = await tx.paciente_enfermedad.findMany({ where: { id_paciente: patientId } });
    const existingMap = new Map<string, typeof existing[number]>();
    existing.forEach((item) => {
      const normalized = normalizeLabelKey(item.enfermedad ?? '');
      if (normalized) {
        existingMap.set(normalized, item);
      }
    });

    const timestamp = new Date();

    for (const entry of entries) {
      const existingEntry = existingMap.get(entry.normalizedKey);

      if (!entry.detail) {
        if (existingEntry) {
          await tx.paciente_enfermedad.delete({ where: { id: existingEntry.id } });
        }
        continue;
      }

      if (existingEntry) {
        await tx.paciente_enfermedad.update({
          where: { id: existingEntry.id },
          data: {
            estatus: entry.detail,
            updated_at: timestamp,
          },
        });
      } else {
        await tx.paciente_enfermedad.create({
          data: {
            id_paciente: patientId,
            enfermedad: entry.label,
            estatus: entry.detail,
            inicio: null,
            created_at: timestamp,
            updated_at: timestamp,
          },
        });
      }
    }
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

  async saveMedicalAttachment(patientId: number, file: UploadedAttachmentFile): Promise<PatientMedicalAttachment> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('El archivo proporcionado está vacío o es inválido.');
    }

    const patient = await this.loadPatient(patientId);
    if (!patient) {
      throw new NotFoundException('Paciente no encontrado.');
    }

    let extension = extname(file.originalname ?? '').toLowerCase();
    if (!extension || !/^\.[a-z0-9]{1,10}$/.test(extension)) {
      extension = this.guessExtension(file.mimetype);
    }

    const randomName = randomBytes(6).toString('hex');
    const filename = `${randomName}${extension || ''}`;
    const relativePath = `${patientId}/${filename}`;
    const absolutePath = this.resolveAttachmentPath(relativePath);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    const timestamp = new Date();
    const created = await this.prisma.paciente_historia.create({
      data: {
        id_paciente: patientId,
        archivo: relativePath.replace(/\\/g, '/'),
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    return {
      id: created.id,
      file: toStringOrNull(created.archivo),
      createdAt: toIsoString(created.created_at as Date | null | undefined),
      updatedAt: toIsoString(created.updated_at as Date | null | undefined),
    };
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

  async getAllMedicalAttachments(): Promise<PatientMedicalAttachmentWithPatient[]> {
    const attachments = await this.prisma.paciente_historia.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        id_paciente: true,
        archivo: true,
        created_at: true,
        updated_at: true,
      },
    });

    const patientIds = Array.from(
      new Set(attachments.map((item) => item.id_paciente).filter((id): id is number => typeof id === 'number')),
    );

    const patients = await this.prisma.paciente.findMany({
      where: { id: { in: patientIds } },
      select: { id: true, id_usuario: true },
    });

    const patientIdToUserId = new Map<number, number | null>();
    patients.forEach((patient) => {
      patientIdToUserId.set(patient.id, patient.id_usuario ?? null);
    });

    return attachments.map((item) => ({
      id: item.id,
      patientId: item.id_paciente ?? null,
      userId: item.id_paciente ? patientIdToUserId.get(item.id_paciente) ?? null : null,
      file: toStringOrNull(item.archivo),
      createdAt: toIsoString(item.created_at as Date | null | undefined),
      updatedAt: toIsoString(item.updated_at as Date | null | undefined),
    }));
  }

  async getAttachmentFile(
    attachmentId: number,
  ): Promise<{ stream: ReadStream; filename: string; mimeType: string; patientId: number | null; userId: number | null; relativePath: string }>
  {
    const record = await this.prisma.paciente_historia.findUnique({
      where: { id: attachmentId },
    });

    if (!record) {
      throw new NotFoundException('Attachment not found');
    }

    const relativePath = (record.archivo ?? '').trim();
    if (!relativePath) {
      throw new NotFoundException('Attachment file not available');
    }

    const absolutePath = this.resolveAttachmentPath(relativePath);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Attachment file not found on disk');
    }

    const filename = basename(absolutePath);
    const mimeType = this.guessMimeType(filename);
    const stream = createReadStream(absolutePath);

    let userId: number | null = null;
    const patientId = record.id_paciente ?? null;
    if (patientId) {
      const patient = await this.prisma.paciente.findUnique({
        where: { id: patientId },
        select: { id_usuario: true },
      });
      userId = patient?.id_usuario ?? null;
    }

    return {
      stream,
      filename,
      mimeType,
      patientId,
      userId,
      relativePath,
    };
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

  async updateFullMedicalHistory(patientId: number, payload: UpdateHistoryDto = {}): Promise<PatientMedicalHistory> {
    const existingPatient = await this.loadPatient(patientId);
    if (!existingPatient) {
      throw new NotFoundException('Patient not found');
    }

    await this.prisma.$transaction(async (tx) => {
      const patientData = this.buildPatientUpdateData(payload);
      if (this.hasData(patientData)) {
        await tx.paciente.update({
          where: { id: patientId },
          data: {
            ...patientData,
            updated_at: new Date(),
          },
        });
      }

      const antecedentData = this.buildAntecedentData(payload);
      if (this.hasData(antecedentData)) {
        const antecedentRecord = await tx.paciente_antecedente.findFirst({ where: { id_paciente: patientId } });
        const timestamp = new Date();

        if (antecedentRecord) {
          await tx.paciente_antecedente.update({
            where: { id: antecedentRecord.id },
            data: {
              ...antecedentData,
              updated_at: timestamp,
            },
          });
        } else {
          await tx.paciente_antecedente.create({
            data: {
              id_paciente: patientId,
              ...antecedentData,
              created_at: timestamp,
              updated_at: timestamp,
            },
          });
        }
      }

      await this.syncDiseaseHistory(tx, patientId, payload.diseases);
    });

    return this.getFullMedicalHistory(patientId);
  }

  async updateFullMedicalHistoryByUserId(userId: number, payload: UpdateHistoryDto = {}): Promise<PatientMedicalHistory> {
    const patientRecord = await this.loadPatientByUserId(userId);
    if (!patientRecord) {
      throw new NotFoundException('Patient not found for the provided user');
    }

    return this.updateFullMedicalHistory(patientRecord.id, payload);
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
