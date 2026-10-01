import { PatientInstrumentsService } from './patient-instruments.service';

describe('Questionnaire identity and result metadata', () => {
  let prisma: any;
  let service: PatientInstrumentsService;
  const assignment = { id: 7, id_paciente: 17, id_instrumento_tipo: 2, array_tema: '[55,139]', completado: 0, disponible: 'paciente' };
  const instruments = [
    { id: 11, id_instrumento_tipo: 2, id_tema: 55, descripcion: 'Salud' },
    { id: 12, id_instrumento_tipo: 2, id_tema: 139, descripcion: 'Firmeza' },
  ];
  const subjects = [{ id: 55, nombre: 'Salud', tipo_instrumento: 'test-salud' }, { id: 139, nombre: 'Firmeza', tipo_instrumento: 'test-salud' }];
  beforeEach(() => {
    prisma = {
      paciente: { findUnique: jest.fn().mockResolvedValue({ id: 17 }) },
      paciente_instrumento: { findUnique: jest.fn().mockResolvedValue(assignment), findMany: jest.fn().mockResolvedValue([assignment]), update: jest.fn() },
      instrumento_tipo: { findMany: jest.fn().mockResolvedValue([{ id: 2, nombre: 'Tests' }]), findUnique: jest.fn().mockResolvedValue({ id: 2, id_criterio: 3 }) },
      instrumento: { findMany: jest.fn().mockResolvedValue(instruments), findUnique: jest.fn(async ({ where }) => instruments.find(item => item.id === where.id)) },
      tema: { findMany: jest.fn().mockResolvedValue(subjects), findUnique: jest.fn(async ({ where }) => subjects.find(item => item.id === where.id)) },
      pregunta: { findMany: jest.fn().mockResolvedValue([{ id: 101, id_instrumento: 11, id_topico: 21, nombre: 'Pregunta A', orden: 1 }]) },
      topico: { findMany: jest.fn().mockResolvedValue([{ id: 21, nombre: 'Área A' }]) },
      paciente_instrumento_respuesta: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn(), createMany: jest.fn() },
    };
    prisma.$transaction = async (fn: any) => fn(prisma);
    service = new PatientInstrumentsService(prisma, {} as any);
  });
  it('resolves different themes of the same type to different questionnaires', async () => {
    prisma.paciente_instrumento.findMany.mockResolvedValue([{ ...assignment, array_tema: '55' }, { ...assignment, id: 8, array_tema: '139' }]);
    const result = await service.findByPatient(17);
    expect(result.map(item => item.instruments.map(instrument => instrument.id))).toEqual([[11], [12]]);
  });
  it('keeps other questionnaire responses and the catalog metadata required by charts', async () => {
    await service.submitResponses(7, { instrumentId: 11, instrumentTypeName: 'Display name', answers: [{ questionId: 101, value: '4' }] });
    expect(prisma.paciente_instrumento_respuesta.deleteMany).toHaveBeenCalledWith({ where: { id_paciente_instrumento: 7, id_instrumento: 11 } });
    expect(prisma.paciente_instrumento_respuesta.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ id_tema: 55, id_criterio: 3, tipo_instrumento: 'test-salud', topico: 'Área A', pregunta: 'Pregunta A' })] });
    expect(prisma.paciente_instrumento.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ completado: 0, disponible: 'paciente' }) }));
  });
  it('rejects questions from a different questionnaire before deleting any answers', async () => {
    await expect(service.submitResponses(7, { instrumentId: 11, answers: [{ questionId: 999, value: '4' }] })).rejects.toThrow('no pertenecen');
    expect(prisma.paciente_instrumento_respuesta.deleteMany).not.toHaveBeenCalled();
  });
});
