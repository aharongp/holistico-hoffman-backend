import { PatientService } from 'src/modules/patients/patient/patient.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let createPatient: jest.Mock;

  beforeEach(async () => {
    createPatient = jest.fn();
    prisma = {
      usuario: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      paciente: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    prisma.$transaction = jest.fn(async (callback) => callback(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PatientService, useValue: { create: createPatient } },
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
  it('links a patient using only name, email and phone', async () => {
    prisma.usuario.create.mockResolvedValue({ id: 12, username: 'Ana', rol: 'patient' });
    await service.create({ firstName: 'Ana', email: 'ana@example.invalid', phone: '5550100', role: 'patient' });
    expect(createPatient).toHaveBeenCalledWith(expect.objectContaining({
      id_usuario: 12, nombres: 'Ana', telefono: '5550100', contacto_correo: 'ana@example.invalid',
    }));
  });

  it('restores a missing patient record when saving an existing patient user', async () => {
    const user = { id: 12, username: 'Ana', email: 'ana@example.invalid', rol: 'patient', active: 1 };
    prisma.usuario.findUnique.mockResolvedValue(user);
    prisma.usuario.update.mockResolvedValue(user);
    prisma.paciente.findFirst.mockResolvedValue(null);
    await service.update(12, { role: 'patient' });
    expect(prisma.paciente.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      id_usuario: 12, nombres: 'Ana', contacto_correo: user.email, activo: 1,
    }) });
  });
});
