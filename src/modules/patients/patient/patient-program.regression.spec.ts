import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';

describe('Patient program persistence', () => {
  let service: PatientService;
  let prisma: any;
  beforeEach(() => {
    const patient = { id: 17, id_programa: null };
    prisma = {
      paciente: { findUnique: jest.fn(async () => ({ ...patient })), update: jest.fn(async ({ data }) => {
        Object.entries(data).forEach(([key, value]) => { if (value !== undefined) (patient as any)[key] = value; });
        return { ...patient };
      }) },
      programa: { findUnique: jest.fn().mockResolvedValue({ id: 4 }) },
    };
    service = new PatientService(prisma, {} as any);
  });
  it('retains the assigned program on a fresh GET and unrelated edits', async () => {
    const controller = new PatientController(service);
    await controller.assignProgram(17, { programId: '4' });
    expect(await service.findOne(17)).toMatchObject({ id_programa: 4 });
    await service.update(17, { nombres: 'Paciente' });
    expect(await service.findOne(17)).toMatchObject({ id_programa: 4 });
    await service.update(17, { id_programa: null } as any);
    expect(await service.findOne(17)).toMatchObject({ id_programa: null });
  });
  it('does not clear a program on an empty assignment request', async () => {
    await service.assignProgram(17, 4);
    await expect(new PatientController(service).assignProgram(17, {})).rejects.toThrow('proporcionar');
    expect(await service.findOne(17)).toMatchObject({ id_programa: 4 });
  });
});
