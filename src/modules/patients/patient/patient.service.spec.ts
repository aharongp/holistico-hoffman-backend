import { HistoryService } from 'src/modules/patients/history/history.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { PatientService } from './patient.service';

describe('PatientService', () => {
  let service: PatientService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      paciente: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      usuario: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma.$transaction = jest.fn(async (callback) => callback(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: HistoryService, useValue: {} },
        PatientService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('synchronizes an edited patient email with the login account', async () => {
    prisma.paciente.findUnique.mockResolvedValue({
      id: 12,
      id_usuario: 5,
      nombres: 'Rosa',
      apellidos: 'Díaz',
    });
    prisma.usuario.findFirst.mockResolvedValue(null);
    prisma.paciente.update.mockResolvedValue({
      id: 12,
      id_usuario: 5,
      nombres: 'Rosa',
      apellidos: 'Díaz',
      contacto_correo: 'rosa@example.com',
    });
    prisma.usuario.update.mockResolvedValue({ id: 5 });

    const result = await service.update(12, {
      contacto_correo: 'ROSA@example.com ',
    });

    expect(result).toMatchObject({ contacto_correo: 'rosa@example.com' });
    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: expect.objectContaining({ email: 'rosa@example.com' }),
    });
  });
});
