import { PatientService } from 'src/modules/patients/patient/patient.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      usuario: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      paciente: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma.$transaction = jest.fn(async (callback) => callback(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PatientService, useValue: {} },
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('persists administrator edits and synchronizes the linked patient', async () => {
    prisma.usuario.findUnique.mockResolvedValue({
      id: 7,
      email: 'incorrecto@example.com',
      username: 'Nombre Anterior',
    });
    prisma.usuario.findFirst.mockResolvedValue(null);
    prisma.usuario.update.mockImplementation(async ({ data }) => ({
      id: 7,
      email: data.email,
      username: data.username,
      rol: data.rol,
      active: 1,
      created_at: null,
      updated_at: data.updated_at,
    }));
    prisma.paciente.findFirst.mockResolvedValue({ id: 31 });
    prisma.paciente.update.mockResolvedValue({ id: 31 });

    const result = await service.update(7, {
      firstName: 'Ana',
      lastName: 'Pérez',
      email: 'CORRECTO@example.com ',
      role: 'patient',
    });

    expect(result).toMatchObject({
      id: 7,
      email: 'correcto@example.com',
      username: 'Ana Pérez',
      firstName: 'Ana',
      lastName: 'Pérez',
    });
    expect(prisma.paciente.update).toHaveBeenCalledWith({
      where: { id: 31 },
      data: expect.objectContaining({
        nombres: 'Ana',
        apellidos: 'Pérez',
        contacto_correo: 'correcto@example.com',
      }),
    });
  });
});
