import { Test, TestingModule } from '@nestjs/testing';
import { PatientInstrumentsService } from './patient-instruments.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('PatientInstrumentsService', () => {
  let service: PatientInstrumentsService;

  beforeEach(async () => {
    const prismaMock = {
      paciente_instrumento: { findMany: jest.fn().mockResolvedValue([]) },
      paciente_instrumento_respuesta: { findMany: jest.fn().mockResolvedValue([]) },
      instrumento_tipo: { findMany: jest.fn().mockResolvedValue([]) },
      paciente: {
        findUnique: jest.fn().mockResolvedValue({ id: 1 }),
        findFirst: jest.fn().mockResolvedValue({ id: 1 }),
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientInstrumentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<PatientInstrumentsService>(PatientInstrumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
