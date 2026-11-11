import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { ConsultationController } from '../consultation/consultation.controller';
import { ConsultationService } from '../consultation/consultation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { FileStorageService } from '../../storage/file-storage.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('Coach observation HTTP round trip', () => {
  let app: any;
  let records: any[];
  let consultation: any;
  beforeEach(async () => {
    records = [];
    consultation = {
      id: 3,
      id_paciente: 17,
      fecha: new Date('2026-11-10'),
      observacion: 'Anterior',
      recomendacion_coach: null,
    };
    const prisma = {
      paciente: { findUnique: jest.fn().mockResolvedValue({ id: 17 }) },
      paciente_consulta_coach: {
        findMany: async ({ where }) =>
          records.filter((row) => row.id_paciente === where.id_paciente),
        findFirst: async ({ where }) =>
          records.find((row) => row.id === where.id && row.id_paciente === where.id_paciente),
        create: async ({ data }) => {
          const row = { id: records.length + 1, ...data };
          records.push(row);
          return row;
        },
        update: async ({ where, data }) =>
          Object.assign(
            records.find((row) => row.id === where.id),
            data,
          ),
      },
      paciente_consulta: {
        findUnique: async () => consultation,
        update: async ({ data }) => Object.assign(consultation, data),
      },
    };
    const module = await Test.createTestingModule({
      controllers: [HistoryController, ConsultationController],
      providers: [
        HistoryService,
        ConsultationService,
        { provide: PrismaService, useValue: prisma },
        { provide: FileStorageService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context) {
          const req = context.switchToHttp().getRequest();
          req.user = { id: 8, rol: req.headers['x-role'] || 'coach', username: 'Coach Prueba' };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterEach(async () => app.close());

  it('creates, reopens and edits the same observation without losing newlines', async () => {
    const server = app.getHttpServer();
    const result = await request(server)
      .post('/patients/history/17/coach-consultations')
      .send({
        observation: 'Primera línea\nSegunda línea',
        date: '2026-11-10',
        coach: 'Nombre no confiable',
      })
      .expect(201);
    expect(result.body.coach).toBe('Coach Prueba');
    const loaded = await request(server)
      .get('/patients/history/17/coach-consultations')
      .expect(200);
    expect(loaded.body[0].observation).toBe('Primera línea\nSegunda línea');
    await request(server)
      .put(`/patients/history/17/coach-consultations/${result.body.id}`)
      .send({ observation: 'Texto corregido', date: '2026-11-09' })
      .expect(200);
    const reopened = await request(server)
      .get('/patients/history/17/coach-consultations')
      .expect(200);
    expect(reopened.body).toHaveLength(1);
    expect(reopened.body[0]).toMatchObject({
      observation: 'Texto corregido',
      date: '2026-11-09T00:00:00.000Z',
    });
  });

  it('rejects writes from a patient and records outside the selected patient', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post('/patients/history/17/coach-consultations')
      .set('x-role', 'patient')
      .send({ observation: 'Prueba' })
      .expect(403);
    await request(server)
      .put('/patients/history/18/coach-consultations/99')
      .send({ observation: 'Prueba' })
      .expect(404);
    expect(records).toHaveLength(0);
  });

  it('persists medical consultation observations and coach recommendations through PATCH and PUT', async () => {
    const server = app.getHttpServer();
    await request(server)
      .patch('/consultation/3')
      .send({
        observacion: 'Observación persistida',
        recomendacion_coach: 'Recomendación persistida',
      })
      .expect(200);
    let loaded = await request(server).get('/consultation/3').expect(200);
    expect(loaded.body).toMatchObject({
      observation: 'Observación persistida',
      coachRecommendation: 'Recomendación persistida',
    });
    await request(server)
      .put('/consultation/3')
      .send({ observacion: 'Modificada por PUT' })
      .expect(200);
    loaded = await request(server).get('/consultation/3').expect(200);
    expect(loaded.body).toMatchObject({
      observation: 'Modificada por PUT',
      coachRecommendation: 'Recomendación persistida',
    });
  });
});
