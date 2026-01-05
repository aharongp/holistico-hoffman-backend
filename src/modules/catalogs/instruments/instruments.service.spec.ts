import { Test, TestingModule } from '@nestjs/testing';
import { InstrumentsService } from './instruments.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('InstrumentsService', () => {
  let service: InstrumentsService;
  let prismaMock: {
    instrumento: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    instrumento_tipo: {
      create: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      instrumento: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      instrumento_tipo: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<InstrumentsService>(InstrumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should normalize input and create an instrument', async () => {
    prismaMock.instrumento.create.mockResolvedValue({
      id: 123,
      id_instrumento_tipo: 5,
      id_tema: 9,
      descripcion: 'Instrument test',
      recurso: 'Web',
      activo: 1,
      user_created: 'admin',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-02'),
      disponible: 'paciente',
      resultados: 'sistema',
      color_respuesta: 1,
    });

    const payload = {
      instrumentTypeId: '5',
      subjectId: '9',
      description: 'Instrument test',
      resource: 'Web',
      isActive: true,
      userCreated: 'admin',
      availability: 'paciente',
      resultDelivery: 'sistema',
      colorResponse: 1,
    };

    const result = await service.create(payload);

    expect(prismaMock.instrumento.create).toHaveBeenCalledWith({
      data: {
        id_instrumento_tipo: 5,
        id_tema: 9,
        descripcion: 'Instrument test',
        recurso: 'Web',
        activo: 1,
        user_created: 'admin',
        disponible: 'paciente',
        resultados: 'sistema',
        color_respuesta: 1,
      },
      select: expect.any(Object),
    });

    expect(result).toEqual({
      id: 123,
      id_instrumento_tipo: 5,
      id_tema: 9,
      descripcion: 'Instrument test',
      recurso: 'Web',
      activo: 1,
      user_created: 'admin',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-02'),
      disponible: 'paciente',
      resultados: 'sistema',
      color_respuesta: 1,
    });
  });

  it('should create an instrument type with normalized data', async () => {
    prismaMock.instrumento_tipo.create.mockResolvedValue({
      id: 7,
      nombre: 'Tipo Demo',
      descripcion: 'Descripcion',
      user_created: 'admin',
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-02'),
      id_criterio: 3,
    });

    const result = await service.createType({
      nombre: ' Tipo Demo ',
      descripcion: 'Descripcion',
      user_created: 'admin',
      id_criterio: '3',
    });

    expect(prismaMock.instrumento_tipo.create).toHaveBeenCalledWith({
      data: {
        nombre: 'Tipo Demo',
        descripcion: 'Descripcion',
        user_created: 'admin',
        id_criterio: 3,
      },
      select: expect.any(Object),
    });

    expect(result).toEqual({
      id: 7,
      nombre: 'Tipo Demo',
      descripcion: 'Descripcion',
      user_created: 'admin',
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-02'),
      id_criterio: 3,
    });
  });

  it('should update an instrument type', async () => {
    prismaMock.instrumento_tipo.update.mockResolvedValue({
      id: 10,
      nombre: 'Actualizado',
      descripcion: 'nuevo',
      user_created: 'coach',
      created_at: new Date('2024-03-01'),
      updated_at: new Date('2024-03-05'),
      id_criterio: null,
    });

    const result = await service.updateType(10, {
      nombre: 'Actualizado',
      descripcion: 'nuevo',
    });

    expect(prismaMock.instrumento_tipo.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        nombre: 'Actualizado',
        descripcion: 'nuevo',
      },
      select: expect.any(Object),
    });

    expect(result).toEqual({
      id: 10,
      nombre: 'Actualizado',
      descripcion: 'nuevo',
      user_created: 'coach',
      created_at: new Date('2024-03-01'),
      updated_at: new Date('2024-03-05'),
      id_criterio: null,
    });
  });

  it('should delete an instrument type', async () => {
    prismaMock.instrumento_tipo.delete.mockResolvedValue({});

    await expect(service.removeType(15)).resolves.toEqual({ deleted: true });

    expect(prismaMock.instrumento_tipo.delete).toHaveBeenCalledWith({
      where: { id: 15 },
    });
  });
});
