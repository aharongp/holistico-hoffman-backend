import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PatientService } from '../patients/patient/patient.service';

const createPrismaMock = () => ({
  paciente: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  usuario: {
    count: jest.fn(),
  },
  instrumento: {
    count: jest.fn(),
  },
  programa: {
    findMany: jest.fn(),
  },
});

const createPatientServiceMock = () => ({
  findByProgramId: jest.fn(),
});

describe('DashboardService', () => {
  let service: DashboardService;
  const prismaMock = createPrismaMock();
  const patientServiceMock = createPatientServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: PatientService,
          useValue: patientServiceMock,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return gender distribution with percentages', async () => {
    prismaMock.paciente.findMany.mockResolvedValueOnce([
      { genero: 'Femenino' },
      { genero: 'F' },
      { genero: 'Masculino' },
      { genero: 'M' },
      { genero: null },
      { genero: 'Otro' },
    ]);
    patientServiceMock.findByProgramId.mockResolvedValue([]);

    const result = await service.getPatientGenderDistribution();

    expect(prismaMock.paciente.findMany).toHaveBeenCalledWith({
      select: { genero: true },
    });
    expect(result).toEqual([
      { gender: 'Masculino', count: 2, percentage: 33.33 },
      { gender: 'Femenino', count: 2, percentage: 33.33 },
      { gender: 'Sin especificar', count: 2, percentage: 33.33 },
    ]);
  });

  it('should return summary data', async () => {
    prismaMock.paciente.count.mockResolvedValueOnce(42);
    prismaMock.usuario.count.mockResolvedValueOnce(10);
    prismaMock.instrumento.count.mockResolvedValueOnce(5);
    prismaMock.programa.findMany.mockResolvedValueOnce([
      { id: 1, nombre: 'Programa A' },
      { id: 2, nombre: 'Programa B' },
    ]);
    patientServiceMock.findByProgramId.mockImplementation(
      async (programId: number | null) => {
        if (programId === 1) {
          return [{ id: 101 }, { id: 102 }] as any;
        }
        if (programId === 2) {
          return [{ id: 201 }] as any;
        }
        if (programId === null) {
          return [{ id: 301 }] as any;
        }
        return [];
      },
    );
    prismaMock.paciente.findMany.mockResolvedValueOnce([
      { genero: 'Femenino' },
      { genero: 'F' },
      { genero: 'Masculino' },
    ]);

    const result = await service.getSummary();

    expect(result).toEqual({
      totals: {
        patients: 42,
        users: 10,
        instruments: 5,
      },
      patientGenderDistribution: [
        { gender: 'Femenino', count: 2, percentage: 66.67 },
        { gender: 'Masculino', count: 1, percentage: 33.33 },
      ],
      patientsByProgram: [
        { programId: 1, programName: 'Programa A', count: 2 },
        { programId: 2, programName: 'Programa B', count: 1 },
        { programId: null, programName: 'Sin programa', count: 1 },
      ],
    });
  });
});
