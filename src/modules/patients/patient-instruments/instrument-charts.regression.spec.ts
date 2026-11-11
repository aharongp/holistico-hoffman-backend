import { PatientInstrumentsService } from './patient-instruments.service';

describe('Assigned questionnaire graph isolation', () => {
  let prisma: any;
  let service: PatientInstrumentsService;
  beforeEach(() => {
    prisma = {
      paciente: { findUnique: jest.fn().mockResolvedValue({ id: 17, id_usuario: 8 }) },
      instrumento: {
        findMany: jest.fn().mockResolvedValue([
          { id: 11, id_tema: 55 },
          { id: 12, id_tema: 56 },
        ]),
      },
      tema: {
        findMany: jest.fn().mockResolvedValue([
          { id: 55, nombre: 'Test A', tipo_instrumento: 'test-salud' },
          { id: 56, nombre: 'Test B', tipo_instrumento: 'cuestionario' },
        ]),
      },
      pregunta: { findMany: jest.fn().mockResolvedValue([{ id: 101, id_topico: 2 }]) },
      topico: { findMany: jest.fn().mockResolvedValue([{ id: 2, nombre: 'Área del catálogo' }]) },
    };
    service = new PatientInstrumentsService(prisma, {} as any);
    jest.spyOn(service, 'findByPatient').mockResolvedValue([
      {
        id: 7,
        instrumentTypeName: 'Tests',
        instruments: [{ id: 11, name: 'Test A', subjectId: 55 }],
      },
      {
        id: 8,
        instrumentTypeName: 'Tests',
        instruments: [{ id: 11, name: 'Test A repetido', subjectId: 55 }],
      },
      {
        id: 9,
        instrumentTypeName: 'Tests',
        instruments: [{ id: 12, name: 'Test B', subjectId: 56 }],
      },
    ] as any);
    jest.spyOn(service, 'findResponsesByPatient').mockResolvedValue([
      {
        id: 100,
        patientInstrumentId: 7,
        instrumentId: 11,
        questionId: 101,
        answer: '4',
        order: 1,
        saved: false,
      },
      {
        id: 99,
        patientInstrumentId: 7,
        instrumentId: 11,
        questionId: 101,
        answer: '2',
        order: 1,
        saved: false,
      },
      {
        id: 101,
        patientInstrumentId: 8,
        instrumentId: 11,
        questionId: 101,
        answer: '9',
        order: 1,
        saved: false,
      },
    ] as any);
  });

  it('keeps repeat assignments separate and ignores obsolete duplicate answers', async () => {
    const rows = await service.findChartsByPatient(17);
    expect(rows.map((row) => row.assignmentId)).toEqual([7, 8, 9]);
    expect(rows[0].charts[0].points).toEqual([{ label: 'Área del catálogo', value: 4 }]);
    expect(rows[1].charts[0].points).toEqual([{ label: 'Área del catálogo', value: 9 }]);
    expect(rows[2]).toMatchObject({ status: 'pending', charts: [] });
  });

  it('retains completed tests that were deactivated after being answered', async () => {
    (service.findByPatient as jest.Mock).mockResolvedValue([{ id: 7, instruments: [] }]);
    expect((await service.findChartsByPatient(17))[0]).toMatchObject({
      instrumentId: 11,
      name: 'Test A',
      status: 'completed',
    });
  });

  it('prevents patients from accessing graphs belonging to another account', async () => {
    await expect(service.findChartsByPatient(17, { id: 99, rol: 'patient' })).rejects.toThrow(
      'No tienes acceso',
    );
    expect(service.findResponsesByPatient).not.toHaveBeenCalled();
  });

  it('keeps graphs for historical subjects whose catalog instrument no longer exists', async () => {
    (service.findResponsesByPatient as jest.Mock).mockResolvedValue([
      {
        id: 1,
        patientInstrumentId: 7,
        instrumentId: null,
        topicId: 80,
        questionId: null,
        question: 'Histórica',
        theme: 'Autoestima y comunicación',
        answer: '4',
        saved: false,
      },
    ]);
    const results = await service.findChartsByPatient(17);
    const historical = results.find((row) => row.resultKey === '7:subject-80');
    expect(historical).toMatchObject({
      instrumentId: null,
      name: 'Autoestima y comunicación',
      status: 'completed',
    });
    expect(historical?.charts[0].points[0].value).toBe(4);
  });
});
