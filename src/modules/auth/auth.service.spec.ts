import { MailService } from 'src/modules/mail/mail.service';
import { PatientService } from 'src/modules/patients/patient/patient.service';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: PrismaService;
  let mailMock: { sendMail: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      usuario: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;
    mailMock = { sendMail: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: MailService, useValue: mailMock },
        { provide: PatientService, useValue: {} },
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('reports a delivery failure instead of claiming the reset code was sent', async () => {
    (prismaMock.usuario.findFirst as jest.Mock).mockResolvedValue({
      id: 8,
      email: 'paciente@example.com',
      username: 'Paciente',
    });
    mailMock.sendMail.mockResolvedValue(false);

    await expect(
      service.requestPasswordReset({ email: 'paciente@example.com' }),
    ).rejects.toThrow('No se pudo enviar el código de verificación');
  });
});
