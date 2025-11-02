import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let prismaMock: {
    pregunta: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    respuesta: {
      findMany: jest.Mock;
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      pregunta: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      respuesta: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [QuestionsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should normalize data and create a question', async () => {
    const now = new Date('2024-05-05T00:00:00Z');
    prismaMock.pregunta.create.mockResolvedValue({
      id: 10,
      id_instrumento: 7,
      id_topico: 3,
      nombre: 'Question name',
      user_created: 'coach',
      created_at: now,
      updated_at: now,
      tipo_respuesta: 'texto',
      orden: 2,
      habilitada: 1,
    });

    const result = await service.create({
      instrumentId: '7',
      topicId: '3',
      name: '  Question name  ',
      userCreated: 'coach',
      responseType: 'texto',
      order: '2',
      isEnabled: true,
    });

    expect(prismaMock.pregunta.create).toHaveBeenCalledWith({
      data: {
        id_instrumento: 7,
        id_topico: 3,
        nombre: 'Question name',
        user_created: 'coach',
        tipo_respuesta: 'texto',
        orden: 2,
        habilitada: 1,
      },
      select: expect.any(Object),
    });

    expect(result).toEqual({
      id: 10,
      id_instrumento: 7,
      id_topico: 3,
      nombre: 'Question name',
      user_created: 'coach',
      created_at: now,
      updated_at: now,
      tipo_respuesta: 'texto',
      orden: 2,
      habilitada: 1,
    });
  });

  it('should list all questions mapped to public format', async () => {
    const now = new Date('2024-01-01T00:00:00Z');
    prismaMock.pregunta.findMany.mockResolvedValue([
      {
        id: 1,
        id_instrumento: 5,
        id_topico: null,
        nombre: 'Question A',
        user_created: null,
        created_at: now,
        updated_at: now,
        tipo_respuesta: 'texto',
        orden: 1,
        habilitada: 1,
      },
    ]);

    const results = await service.findAll();

    expect(prismaMock.pregunta.findMany).toHaveBeenCalledWith({
      select: expect.any(Object),
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
    });

    expect(results).toEqual([
      {
        id: 1,
        id_instrumento: 5,
        id_topico: null,
        nombre: 'Question A',
        user_created: null,
        created_at: now,
        updated_at: now,
        tipo_respuesta: 'texto',
        orden: 1,
        habilitada: 1,
      },
    ]);
  });

  it('should retrieve a single question', async () => {
    prismaMock.pregunta.findUnique.mockResolvedValue({
      id: 2,
      id_instrumento: null,
      id_topico: null,
      nombre: 'Single',
      user_created: null,
      created_at: null,
      updated_at: null,
      tipo_respuesta: null,
      orden: null,
      habilitada: 1,
    });

    const question = await service.findOne(2);

    expect(prismaMock.pregunta.findUnique).toHaveBeenCalledWith({
      where: { id: 2 },
      select: expect.any(Object),
    });

    expect(question.id).toBe(2);
  });

  it('should throw NotFoundException when question does not exist', async () => {
    prismaMock.pregunta.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should update a question with normalized values', async () => {
    prismaMock.pregunta.update.mockResolvedValue({
      id: 4,
      id_instrumento: 1,
      id_topico: 2,
      nombre: 'Updated',
      user_created: 'coach',
      created_at: null,
      updated_at: null,
      tipo_respuesta: 'escala',
      orden: 3,
      habilitada: 0,
    });

    const result = await service.update(4, {
      instrumentId: '1',
      topicId: 2,
      name: 'Updated',
      responseType: 'escala',
      order: '3',
      isEnabled: false,
    });

    expect(prismaMock.pregunta.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: {
        id_instrumento: 1,
        id_topico: 2,
        nombre: 'Updated',
        tipo_respuesta: 'escala',
        orden: 3,
        habilitada: 0,
      },
      select: expect.any(Object),
    });

    expect(result.habilitada).toBe(0);
  });

  it('should throw BadRequestException when updating with empty name', async () => {
    await expect(service.update(1, { name: '   ' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should remove an existing question', async () => {
    prismaMock.pregunta.delete.mockResolvedValue({});

    await expect(service.remove(5)).resolves.toEqual({ deleted: true });

    expect(prismaMock.pregunta.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it('should throw NotFoundException when removing missing question', async () => {
    prismaMock.pregunta.delete.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Missing', {
        code: 'P2025',
        clientVersion: '6.15.0',
      })
    );

    await expect(service.remove(42)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should return answers for an existing question', async () => {
    prismaMock.pregunta.findUnique.mockResolvedValue({ id: 7 });
    prismaMock.respuesta.findMany.mockResolvedValue([
      {
        id: 11,
        id_pregunta: 7,
        nombre: 'Opción A',
        valor: 'A',
        color: '#ffffff',
        user_created: 'coach',
        created_at: null,
        updated_at: null,
      },
    ]);

    const answers = await service.findAnswers(7);

    expect(prismaMock.pregunta.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true },
    });
    expect(prismaMock.respuesta.findMany).toHaveBeenCalledWith({
      where: { id_pregunta: 7 },
      select: expect.any(Object),
      orderBy: [{ id: 'asc' }],
    });
    expect(answers).toEqual([
      {
        id: 11,
        id_pregunta: 7,
        nombre: 'Opción A',
        valor: 'A',
        color: '#ffffff',
        user_created: 'coach',
        created_at: null,
        updated_at: null,
      },
    ]);
  });

  it('should create an answer for a question', async () => {
    prismaMock.pregunta.findUnique.mockResolvedValueOnce({ id: 7 });
    prismaMock.respuesta.create.mockResolvedValue({
      id: 15,
      id_pregunta: 7,
      nombre: 'Opción B',
      valor: 'B',
      color: null,
      user_created: null,
      created_at: null,
      updated_at: null,
    });

    const created = await service.createAnswer(7, {
      nombre: 'Opción B',
      valor: 'B',
    });

    expect(prismaMock.pregunta.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true },
    });
    expect(prismaMock.respuesta.create).toHaveBeenCalledWith({
      data: {
        id_pregunta: 7,
        nombre: 'Opción B',
        valor: 'B',
        color: null,
        user_created: null,
      },
      select: expect.any(Object),
    });
    expect(created.nombre).toBe('Opción B');
  });

  it('should update an answer of a question', async () => {
    prismaMock.pregunta.findUnique.mockResolvedValue({ id: 7 });
    prismaMock.respuesta.findUnique.mockResolvedValue({
      id: 22,
      id_pregunta: 7,
      nombre: 'Opción C',
      valor: 'C',
      color: null,
      user_created: null,
      created_at: null,
      updated_at: null,
    });
    prismaMock.respuesta.update.mockResolvedValue({
      id: 22,
      id_pregunta: 7,
      nombre: 'Opción C editada',
      valor: 'C1',
      color: '#000000',
      user_created: null,
      created_at: null,
      updated_at: null,
    });

    const updated = await service.updateAnswer(7, 22, {
      nombre: 'Opción C editada',
      valor: 'C1',
      color: '#000000',
    });

    expect(prismaMock.respuesta.update).toHaveBeenCalledWith({
      where: { id: 22 },
      data: {
        nombre: 'Opción C editada',
        valor: 'C1',
        color: '#000000',
      },
      select: expect.any(Object),
    });
    expect(updated.nombre).toBe('Opción C editada');
  });

  it('should delete an answer of a question', async () => {
    prismaMock.pregunta.findUnique.mockResolvedValue({ id: 7 });
    prismaMock.respuesta.findUnique.mockResolvedValue({
      id: 30,
      id_pregunta: 7,
      nombre: 'Opción D',
      valor: null,
      color: null,
      user_created: null,
      created_at: null,
      updated_at: null,
    });
    prismaMock.respuesta.delete.mockResolvedValue({});

    await expect(service.removeAnswer(7, 30)).resolves.toEqual({ deleted: true });

    expect(prismaMock.respuesta.delete).toHaveBeenCalledWith({ where: { id: 30 } });
  });
});
