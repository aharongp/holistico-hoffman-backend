import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { HistoryService } from '../history/history.service';
import { PatientMedicalHistory } from '../history/entities/history.entity';
import { UpdateHistoryDto } from '../history/dto/update-history.dto';

export type PublicPatient = {
  id: number;
  id_usuario?: number | null;
  cedula?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  genero?: string | null;
  fecha_nacimiento?: Date | null;
  fecha_ingreso?: Date | null;
  telefono?: string | null;
  direccion?: string | null;
  activo?: number | null;
  id_programa?: number | null;
  id_cinta?: number | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  contacto?: string | null;
  contacto_correo?: string | null;
  contacto_telefono?: string | null;
};

type UploadableAttachment = {
  buffer: Buffer;
  originalname?: string | null;
  mimetype?: string | null;
  size?: number | null;
};

@Injectable()
export class PatientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historyService: HistoryService,
  ) {}

  private readonly patientSelect = {
    id: true,
    cedula: true,
    id_usuario: true,
    nombres: true,
    apellidos: true,
    genero: true,
    fecha_nacimiento: true,
    fecha_ingreso: true,
    telefono: true,
    direccion: true,
    activo: true,
    id_programa: true,
    id_cinta: true,
    created_at: true,
    updated_at: true,
    contacto: true,
    contacto_correo: true,
    contacto_telefono: true,
  } as const;

  private normalizeString(value: unknown): string | null {
    if (value === null || typeof value === 'undefined') {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      const trimmed = String(value).trim();
      return trimmed.length ? trimmed : null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }

    return null;
  }

  private normalizeNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private hasRibbonIdKey(dto: any): boolean {
    if (!dto || typeof dto !== 'object') {
      return false;
    }

    return ['id_cinta', 'ribbonId', 'idCinta'].some(key => Object.prototype.hasOwnProperty.call(dto, key));
  }

  private normalizeDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private buildPatientPayload(createPatientDto: CreatePatientDto) {
    const firstName = this.normalizeString(createPatientDto.nombres ?? (createPatientDto as any).firstName);
    const lastName = this.normalizeString(createPatientDto.apellidos ?? (createPatientDto as any).lastName);
    const gender = this.normalizeString(createPatientDto.genero);
    const contactName = this.normalizeString(createPatientDto.contacto);
    const contactEmail = this.normalizeString(
      createPatientDto.contacto_correo
        ?? (createPatientDto as any).contactoCorreo
        ?? (createPatientDto as any).email
        ?? (createPatientDto as any).correo
    );
    const contactPhone = this.normalizeString(
      createPatientDto.contacto_telefono
        ?? (createPatientDto as any).contactoTelefono
        ?? (createPatientDto as any).telefono_contacto
    );
    const telefono = this.normalizeString(createPatientDto.telefono);
    const direccion = this.normalizeString(createPatientDto.direccion);
    const cedula = this.normalizeString((createPatientDto as any).cedula);
    const programId = this.normalizeNumber(createPatientDto.id_programa);
    const explicitUserId = this.normalizeNumber(createPatientDto.id_usuario ?? (createPatientDto as any).userId);
    const birthDate = this.normalizeDate(createPatientDto.fecha_nacimiento);
    const activeFlag = this.normalizeNumber(createPatientDto.activo);
    const userRole = this.normalizeString(createPatientDto.user_role ?? (createPatientDto as any).rol ?? (createPatientDto as any).role) ?? 'patient';
    const ribbonId = this.normalizeNumber(
      (createPatientDto as any).id_cinta
        ?? (createPatientDto as any).ribbonId
        ?? (createPatientDto as any).idCinta,
    );

    return {
      firstName,
      lastName,
      gender,
      contactName,
      contactEmail,
      contactPhone,
      telefono,
      direccion,
      cedula,
      programId,
      explicitUserId,
      birthDate,
      activeFlag,
      userRole,
      ribbonId,
    };
  }

  private joinNames(firstName: string | null, lastName: string | null): string {
    const parts = [firstName, lastName]
      .map(value => (value ?? '').toString().trim())
      .filter(Boolean);
    return parts.join(' ').trim();
  }

  private mapPatient(record: any): PublicPatient {
    if (!record) {
      return {
        id: 0,
        cedula: null,
        id_usuario: null,
        nombres: null,
        apellidos: null,
        genero: null,
        fecha_nacimiento: null,
  fecha_ingreso: null,
        telefono: null,
        direccion: null,
        activo: null,
        id_programa: null,
        id_cinta: null,
        created_at: null,
        updated_at: null,
        contacto: null,
        contacto_correo: null,
        contacto_telefono: null,
      };
    }

    return {
      id: record.id,
      cedula: record.cedula ?? null,
      id_usuario: record.id_usuario ?? null,
      nombres: record.nombres ?? null,
      apellidos: record.apellidos ?? null,
      genero: record.genero ?? null,
      fecha_nacimiento: record.fecha_nacimiento ?? null,
  fecha_ingreso: record.fecha_ingreso ?? null,
      telefono: record.telefono ?? null,
      direccion: record.direccion ?? null,
      activo: record.activo ?? null,
      id_programa: record.id_programa ?? null,
      id_cinta: record.id_cinta ?? null,
      created_at: record.created_at ?? null,
      updated_at: record.updated_at ?? null,
      contacto: record.contacto ?? null,
      contacto_correo: record.contacto_correo ?? null,
      contacto_telefono: record.contacto_telefono ?? null,
    };
  }

  async create(createPatientDto: CreatePatientDto): Promise<PublicPatient> {
    const {
      firstName,
      lastName,
      gender,
      contactName,
      contactEmail,
      contactPhone,
      telefono,
      direccion,
      cedula,
      programId,
      explicitUserId,
      birthDate,
      activeFlag,
      userRole,
      ribbonId,
    } = this.buildPatientPayload(createPatientDto);

    const normalizedEmail = contactEmail ? contactEmail.toLowerCase() : null;
    const ribbonIdProvided = this.hasRibbonIdKey(createPatientDto);

    const patient = await this.prisma.$transaction(async prisma => {
      let resolvedUserId = explicitUserId;

      if (!resolvedUserId && normalizedEmail) {
        const existing = await prisma.usuario.findFirst({
          where: { email: normalizedEmail },
          select: { id: true },
        });

        if (existing) {
          resolvedUserId = existing.id;
        } else {
          const username = this.joinNames(firstName, lastName) || normalizedEmail;
          const createdUser = await prisma.usuario.create({
            data: {
              email: normalizedEmail,
              username,
              password: null,
              rol: userRole,
              active: 1,
            },
            select: { id: true },
          });

          resolvedUserId = createdUser.id;
        }
      }

      const createdPatient = await prisma.paciente.create({
        data: {
          cedula: cedula ?? null,
          nombres: firstName ?? null,
          apellidos: lastName ?? null,
          genero: gender ?? null,
          fecha_nacimiento: birthDate ?? null,
          fecha_ingreso: new Date(),
          telefono: telefono ?? null,
          direccion: direccion ?? null,
          activo: activeFlag ?? 1,
          id_programa: programId ?? null,
          contacto: contactName ?? null,
          contacto_correo: normalizedEmail ?? null,
          contacto_telefono: contactPhone ?? telefono ?? null,
          id_usuario: resolvedUserId ?? null,
          id_cinta: ribbonIdProvided ? (typeof ribbonId === 'number' ? ribbonId : null) : null,
        },
        select: this.patientSelect,
      });

      return createdPatient;
    });

    return this.mapPatient(patient);
  }

  async findAll(): Promise<PublicPatient[]> {
    const patients = await this.prisma.paciente.findMany({
      select: this.patientSelect,
    });
    return patients.map(p => this.mapPatient(p));
  }

  async findOne(id: number): Promise<PublicPatient | null> {
    const p = await this.prisma.paciente.findUnique({
      where: { id },
      select: this.patientSelect,
    });
    if (!p) return null;
    return this.mapPatient(p);
  }

  async update(id: number, updatePatientDto: UpdatePatientDto): Promise<PublicPatient | null> {
    const {
      firstName,
      lastName,
      gender,
      contactName,
      contactEmail,
      contactPhone,
      telefono,
      direccion,
      cedula,
      programId,
      explicitUserId,
      birthDate,
      activeFlag,
      ribbonId,
    } = this.buildPatientPayload(updatePatientDto);

    const normalizedEmail = contactEmail ? contactEmail.toLowerCase() : contactEmail;
    const ribbonIdProvided = this.hasRibbonIdKey(updatePatientDto);

    const hasExplicitUserId = Object.prototype.hasOwnProperty.call(updatePatientDto as any, 'id_usuario')
      || Object.prototype.hasOwnProperty.call(updatePatientDto as any, 'userId');

    const updated = await this.prisma.paciente.update({
      where: { id },
      data: {
        cedula: cedula ?? undefined,
        nombres: firstName ?? undefined,
        apellidos: lastName ?? undefined,
        genero: gender ?? undefined,
        fecha_nacimiento: birthDate ?? undefined,
        telefono: telefono ?? undefined,
        direccion: direccion ?? undefined,
        activo: typeof activeFlag === 'number' ? activeFlag : undefined,
        id_programa: programId ?? undefined,
        contacto: contactName ?? undefined,
        contacto_correo: normalizedEmail ?? undefined,
        contacto_telefono: (contactPhone ?? telefono) ?? undefined,
        id_usuario: hasExplicitUserId ? (typeof explicitUserId === 'number' ? explicitUserId : null) : undefined,
        id_cinta: ribbonIdProvided ? (typeof ribbonId === 'number' ? ribbonId : null) : undefined,
      },
      select: this.patientSelect,
    });
    if (!updated) return null;
    return this.mapPatient(updated);
  }

  async assignProgram(patientId: number, rawProgramId?: number | string | null): Promise<PublicPatient> {
    const patientExists = await this.prisma.paciente.findUnique({ where: { id: patientId } });
    if (!patientExists) {
      throw new NotFoundException('El paciente especificado no existe.');
    }

    if (typeof rawProgramId === 'undefined') {
      throw new BadRequestException('Debes proporcionar un identificador de programa o null para desasignar.');
    }

    let normalizedProgramId: number | null = null;

    if (rawProgramId !== null) {
      const candidate = this.normalizeNumber(rawProgramId);
      if (candidate === null) {
        throw new BadRequestException('El identificador del programa es inválido.');
      }

      const programExists = await this.prisma.programa.findUnique({ where: { id: candidate }, select: { id: true } });
      if (!programExists) {
        throw new NotFoundException('El programa especificado no existe.');
      }

      normalizedProgramId = candidate;
    }

    const updated = await this.prisma.paciente.update({
      where: { id: patientId },
      data: {
        id_programa: normalizedProgramId,
      },
      select: this.patientSelect,
    });

    return this.mapPatient(updated);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.prisma.paciente.delete({ where: { id } });
    return { deleted: true };
  }

  async findByProgramId(programId: number | null): Promise<PublicPatient[]> {
    const patients = await this.prisma.paciente.findMany({
      where: { id_programa: programId === null ? null : programId },
      select: {
        id: true,
        cedula: true,
        id_usuario: true,
        nombres: true,
        apellidos: true,
        genero: true,
        fecha_nacimiento: true,
        telefono: true,
        direccion: true,
        activo: true,
        id_programa: true,
        id_cinta: true,
        created_at: true,
        updated_at: true,
      },
    });

    return patients.map(p => ({
      id: p.id,
      cedula: p.cedula ?? null,
      id_usuario: p.id_usuario ?? null,
      nombres: p.nombres ?? null,
      apellidos: p.apellidos ?? null,
      genero: p.genero ?? null,
      fecha_nacimiento: p.fecha_nacimiento ?? null,
      telefono: p.telefono ?? null,
      direccion: p.direccion ?? null,
      activo: p.activo ?? null,
      id_programa: p.id_programa ?? null,
      id_cinta: p.id_cinta ?? null,
      created_at: p.created_at ?? null,
      updated_at: p.updated_at ?? null,
    }));
  }

  async getMedicalHistory(patientId: number): Promise<PatientMedicalHistory> {
    return this.historyService.getFullMedicalHistory(patientId);
  }

  async getMedicalHistoryByUserId(userId: number): Promise<PatientMedicalHistory | null> {
    return this.historyService.getFullMedicalHistoryByUserId(userId);
  }

  async updateMedicalHistory(patientId: number, payload: UpdateHistoryDto): Promise<PatientMedicalHistory> {
    return this.historyService.updateFullMedicalHistory(patientId, payload);
  }

  async updateMedicalHistoryByUserId(userId: number, payload: UpdateHistoryDto): Promise<PatientMedicalHistory> {
    return this.historyService.updateFullMedicalHistoryByUserId(userId, payload);
  }

  async uploadAttachment(patientId: number, file: UploadableAttachment) {
    return this.historyService.saveMedicalAttachment(patientId, file);
  }

  async uploadAttachmentByUserId(userId: number, file: UploadableAttachment) {
    const patientRecord = await this.prisma.paciente.findFirst({ where: { id_usuario: userId } });
    if (!patientRecord) {
      throw new NotFoundException('Patient not found for the provided user');
    }
    return this.uploadAttachment(patientRecord.id, file);
  }

  async getAttachments(patientId: number) {
    return this.historyService.getMedicalAttachments(patientId);
  }

  async getAllAttachments() {
    return this.historyService.getAllMedicalAttachments();
  }

  async getAttachmentFile(attachmentId: number) {
    return this.historyService.getAttachmentFile(attachmentId);
  }

  async getAttachmentsByUserId(userId: number) {
    const patientRecord = await this.prisma.paciente.findFirst({ where: { id_usuario: userId } });
    if (!patientRecord) {
      return [] as any[];
    }
    return this.getAttachments(patientRecord.id);
  }
}
