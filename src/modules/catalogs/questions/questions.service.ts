import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { UpdateAnswerDto } from './dto/update-answer.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export type PublicQuestion = {
  id: number;
  id_instrumento?: number | null;
  id_topico?: number | null;
  nombre?: string | null;
  user_created?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
  tipo_respuesta?: string | null;
  orden?: number | null;
  habilitada?: number | null;
};

export type PublicAnswer = {
  id: number;
  id_pregunta?: number | null;
  nombre?: string | null;
  valor?: string | null;
  color?: string | null;
  user_created?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
};

const QUESTION_SELECT = {
  id: true,
  id_instrumento: true,
  id_topico: true,
  nombre: true,
  user_created: true,
  created_at: true,
  updated_at: true,
  tipo_respuesta: true,
  orden: true,
  habilitada: true,
} satisfies Prisma.preguntaSelect;

type QuestionRecord = Prisma.preguntaGetPayload<{ select: typeof QUESTION_SELECT }>;

const ANSWER_SELECT = {
  id: true,
  id_pregunta: true,
  nombre: true,
  valor: true,
  color: true,
  user_created: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.respuestaSelect;

type AnswerRecord = Prisma.respuestaGetPayload<{ select: typeof ANSWER_SELECT }>;

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeString(value: unknown): string | null {
    if (value === null || typeof value === 'undefined') {
      return null;
    }

    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : null;
  }

  private normalizeNumber(value: unknown): number | null {
    if (value === null || typeof value === 'undefined' || value === '') {
      return null;
    }

    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private normalizeEnabledFlag(value: unknown): number {
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'number') {
      return value ? 1 : 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return 1;
      if (['1', 'true', 'habilitada', 'enabled', 'si', 'sí', 'yes'].includes(normalized)) {
        return 1;
      }
      if (['0', 'false', 'inhabilitada', 'disabled', 'no'].includes(normalized)) {
        return 0;
      }
      const numeric = Number(normalized);
      if (Number.isFinite(numeric)) {
        return numeric ? 1 : 0;
      }
    }

    return 1;
  }

  private buildCreateData(dto: CreateQuestionDto): Prisma.preguntaCreateInput {
    const nombre = this.normalizeString(dto.nombre ?? dto.name);
    if (!nombre) {
      throw new BadRequestException('El nombre de la pregunta es obligatorio');
    }

    return {
      id_instrumento: this.normalizeNumber(dto.id_instrumento ?? dto.instrumentId),
      id_topico: this.normalizeNumber(dto.id_topico ?? dto.topicId),
      nombre,
      user_created: this.normalizeString(dto.user_created ?? dto.userCreated),
      tipo_respuesta: this.normalizeString(dto.tipo_respuesta ?? dto.responseType),
      orden: this.normalizeNumber(dto.orden ?? dto.order),
      habilitada: this.normalizeEnabledFlag(dto.habilitada ?? dto.isEnabled),
    };
  }

  private buildUpdateData(dto: UpdateQuestionDto): Prisma.preguntaUpdateInput {
    const data: Prisma.preguntaUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(dto, 'id_instrumento') || Object.prototype.hasOwnProperty.call(dto, 'instrumentId')) {
      data.id_instrumento = this.normalizeNumber(dto.id_instrumento ?? dto.instrumentId);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'id_topico') || Object.prototype.hasOwnProperty.call(dto, 'topicId')) {
      data.id_topico = this.normalizeNumber(dto.id_topico ?? dto.topicId);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'nombre') || Object.prototype.hasOwnProperty.call(dto, 'name')) {
      const nombre = this.normalizeString(dto.nombre ?? dto.name);
      if (!nombre) {
        throw new BadRequestException('El nombre de la pregunta es obligatorio');
      }
      data.nombre = nombre;
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'user_created') || Object.prototype.hasOwnProperty.call(dto, 'userCreated')) {
      data.user_created = this.normalizeString(dto.user_created ?? dto.userCreated);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'tipo_respuesta') || Object.prototype.hasOwnProperty.call(dto, 'responseType')) {
      data.tipo_respuesta = this.normalizeString(dto.tipo_respuesta ?? dto.responseType);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'orden') || Object.prototype.hasOwnProperty.call(dto, 'order')) {
      data.orden = this.normalizeNumber(dto.orden ?? dto.order);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'habilitada') || Object.prototype.hasOwnProperty.call(dto, 'isEnabled')) {
      data.habilitada = this.normalizeEnabledFlag(dto.habilitada ?? dto.isEnabled);
    }

    return data;
  }

  private mapQuestion(record: QuestionRecord): PublicQuestion {
    return {
      id: record.id,
      id_instrumento: record.id_instrumento ?? null,
      id_topico: record.id_topico ?? null,
      nombre: record.nombre ?? null,
      user_created: record.user_created ?? null,
      created_at: record.created_at ?? null,
      updated_at: record.updated_at ?? null,
      tipo_respuesta: record.tipo_respuesta ?? null,
      orden: record.orden ?? null,
      habilitada: record.habilitada ?? null,
    };
  }

  private mapAnswer(record: AnswerRecord): PublicAnswer {
    return {
      id: record.id,
      id_pregunta: record.id_pregunta ?? null,
      nombre: record.nombre ?? null,
      valor: record.valor ?? null,
      color: record.color ?? null,
      user_created: record.user_created ?? null,
      created_at: record.created_at ?? null,
      updated_at: record.updated_at ?? null,
    };
  }

  private buildCreateAnswerData(questionId: number, dto: CreateAnswerDto): Prisma.respuestaCreateInput {
    const nombre = this.normalizeString(dto.nombre ?? dto.name);
    if (!nombre) {
      throw new BadRequestException('El nombre de la respuesta es obligatorio');
    }

    return {
      id_pregunta: questionId,
      nombre,
      valor: this.normalizeString(dto.valor ?? dto.value),
      color: this.normalizeString(dto.color),
      user_created: this.normalizeString(dto.user_created ?? dto.userCreated),
    };
  }

  private buildUpdateAnswerData(dto: UpdateAnswerDto): Prisma.respuestaUpdateInput {
    const data: Prisma.respuestaUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(dto, 'nombre') || Object.prototype.hasOwnProperty.call(dto, 'name')) {
      const nombre = this.normalizeString(dto.nombre ?? dto.name);
      if (!nombre) {
        throw new BadRequestException('El nombre de la respuesta es obligatorio');
      }
      data.nombre = nombre;
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'valor') || Object.prototype.hasOwnProperty.call(dto, 'value')) {
      data.valor = this.normalizeString(dto.valor ?? dto.value);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'color')) {
      data.color = this.normalizeString(dto.color);
    }

    if (Object.prototype.hasOwnProperty.call(dto, 'user_created') || Object.prototype.hasOwnProperty.call(dto, 'userCreated')) {
      data.user_created = this.normalizeString(dto.user_created ?? dto.userCreated);
    }

    return data;
  }

  private async ensureQuestionExists(questionId: number): Promise<void> {
    const question = await this.prisma.pregunta.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      throw new NotFoundException(`Question with id ${questionId} not found`);
    }
  }

  private async ensureAnswerBelongsToQuestion(questionId: number, answerId: number): Promise<AnswerRecord> {
    const answer = await this.prisma.respuesta.findUnique({
      where: { id: answerId },
      select: ANSWER_SELECT,
    });

    if (!answer || answer.id_pregunta !== questionId) {
      throw new NotFoundException(`Answer with id ${answerId} not found for question ${questionId}`);
    }

    return answer;
  }

  async create(createQuestionDto: CreateQuestionDto): Promise<PublicQuestion> {
    const created = await this.prisma.pregunta.create({
      data: this.buildCreateData(createQuestionDto),
      select: QUESTION_SELECT,
    });

    return this.mapQuestion(created);
  }

  async findAll(): Promise<PublicQuestion[]> {
    const questions = await this.prisma.pregunta.findMany({
      select: QUESTION_SELECT,
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    });

    return questions.map((question) => this.mapQuestion(question));
  }

  async findOne(id: number): Promise<PublicQuestion> {
    const question = await this.prisma.pregunta.findUnique({
      where: { id },
      select: QUESTION_SELECT,
    });

    if (!question) {
      throw new NotFoundException(`Question with id ${id} not found`);
    }

    return this.mapQuestion(question);
  }

  async update(id: number, updateQuestionDto: UpdateQuestionDto): Promise<PublicQuestion> {
    const data = this.buildUpdateData(updateQuestionDto);

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    try {
      const updated = await this.prisma.pregunta.update({
        where: { id },
        data,
        select: QUESTION_SELECT,
      });

      return this.mapQuestion(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Question with id ${id} not found`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    try {
      await this.prisma.pregunta.delete({ where: { id } });
      return { deleted: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Question with id ${id} not found`);
      }
      throw error;
    }
  }

  async findAnswers(questionId: number): Promise<PublicAnswer[]> {
    await this.ensureQuestionExists(questionId);

    const answers = await this.prisma.respuesta.findMany({
      where: { id_pregunta: questionId },
      select: ANSWER_SELECT,
      orderBy: [{ id: 'asc' }],
    });

    return answers.map((answer) => this.mapAnswer(answer));
  }

  async createAnswer(questionId: number, dto: CreateAnswerDto): Promise<PublicAnswer> {
    await this.ensureQuestionExists(questionId);

    const created = await this.prisma.respuesta.create({
      data: this.buildCreateAnswerData(questionId, dto),
      select: ANSWER_SELECT,
    });

    return this.mapAnswer(created);
  }

  async updateAnswer(questionId: number, answerId: number, dto: UpdateAnswerDto): Promise<PublicAnswer> {
    await this.ensureQuestionExists(questionId);
    await this.ensureAnswerBelongsToQuestion(questionId, answerId);

    const data = this.buildUpdateAnswerData(dto);

    if (Object.keys(data).length === 0) {
      const answer = await this.ensureAnswerBelongsToQuestion(questionId, answerId);
      return this.mapAnswer(answer);
    }

    try {
      const updated = await this.prisma.respuesta.update({
        where: { id: answerId },
        data,
        select: ANSWER_SELECT,
      });

      return this.mapAnswer(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Answer with id ${answerId} not found for question ${questionId}`);
      }
      throw error;
    }
  }

  async removeAnswer(questionId: number, answerId: number): Promise<{ deleted: boolean }> {
    await this.ensureQuestionExists(questionId);
    await this.ensureAnswerBelongsToQuestion(questionId, answerId);

    try {
      await this.prisma.respuesta.delete({ where: { id: answerId } });
      return { deleted: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Answer with id ${answerId} not found for question ${questionId}`);
      }
      throw error;
    }
  }
}
