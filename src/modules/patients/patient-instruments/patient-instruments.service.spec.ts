import { Test, TestingModule } from '@nestjs/testing';
import { PatientInstrumentsService } from './patient-instruments.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/modules/mail/mail.service';

describe('PatientInstrumentsService', () => {
  let service: PatientInstrumentsService;

  beforeEach(async () => {
    const prismaMock = {
      paciente_instrumento: { findMany: jest.fn().mockResolvedValue([]) },
      paciente_instrumento_respuesta: {
        findMany: jest.fn().mockResolvedValue([]),
      },
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
        {
          provide: MailService,
          useValue: {
            sendInstrumentAssignmentEmail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<PatientInstrumentsService>(PatientInstrumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates bulk assignments with partial results', async () => {
    const createSpy = jest
      .spyOn(service as any, 'create')
      .mockImplementation(async (payload: any) => {
        if (payload.id_paciente === 2) {
          throw new Error('Paciente no encontrado');
        }
        return { id: payload.id_paciente * 1000 + payload.id_instrumento_tipo };
      });

    const result = await service.createBulk({
      patientIds: [1, 2],
      instrumentTypeIds: [10, 20],
      origin: 'Lote',
    });

    expect(createSpy).toHaveBeenCalledTimes(4);
    expect(result.requestedPairs).toBe(4);
    expect(result.createdCount).toBe(2);
    expect(result.failedCount).toBe(2);
    expect(result.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          patientId: 1,
          instrumentTypeId: 10,
          status: 'created',
        }),
        expect.objectContaining({
          patientId: 2,
          instrumentTypeId: 10,
          status: 'failed',
          error: 'Paciente no encontrado',
        }),
      ]),
    );
  });

  it('does not forward undefined availability in bulk payload', async () => {
    const createSpy = jest
      .spyOn(service as any, 'create')
      .mockImplementation(async (payload: any) => ({ id: 999, payload }));

    await service.createBulk({
      patientIds: [1],
      instrumentTypeIds: [10],
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    const firstPayload = createSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(firstPayload).toMatchObject({
      id_paciente: 1,
      id_instrumento_tipo: 10,
    });
    expect(Object.prototype.hasOwnProperty.call(firstPayload, 'disponible')).toBe(
      false,
    );
  });
});
