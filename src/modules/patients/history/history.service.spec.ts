import { HistoryService } from './history.service';

describe('HistoryService persistence', () => {
  let prisma: any;
  let service: HistoryService;
  beforeEach(() => {
    prisma = {};
    for (const table of ['paciente_alteracion', 'paciente_enfermedad', 'paciente_antecedente', 'paciente_historia', 'paciente_consulta', 'paciente_consulta_coach']) {
      const rows: any[] = [];
      prisma[table] = {
        findMany: jest.fn(async () => rows), findFirst: jest.fn(async () => rows[0] ?? null),
        create: jest.fn(async ({ data }) => { const row = { id: rows.length + 1, ...data }; rows.push(row); return row; }),
        update: jest.fn(async ({ where, data }) => Object.assign(rows.find(row => row.id === where.id), data)),
        updateMany: jest.fn(async ({ where, data }) => rows.filter(row => where.id.in.includes(row.id)).forEach(row => Object.assign(row, data))),
      };
    }
    prisma.paciente = { findUnique: jest.fn().mockResolvedValue({ id: 17 }), update: jest.fn() };
    prisma.$transaction = async (fn: any) => fn(prisma);
    service = new HistoryService(prisma, {} as any);
  });

  it('retains positive symptoms on reload and permits switching them off', async () => {
    await service.updateFullMedicalHistory(17, { alterations: { perdidaDePeso: true, tos: false } });
    expect((await service.getFullMedicalHistory(17)).alterations).toEqual({ perdidaDePeso: true, tos: false });
    await service.updateFullMedicalHistory(17, { alterations: { perdidaDePeso: false, tos: true } });
    expect((await service.getFullMedicalHistory(17)).alterations).toEqual({ perdidaDePeso: false, tos: true });
  });

  it('persists and reloads multiline coach observations with the selected date and author', async () => {
    const saved = await service.saveCoachConsultation(17, { observation: ' Primera línea\nSegunda línea ', coach: 'Coach Prueba', reason: 'Seguimiento', date: '2026-11-10' });
    expect(await service.getCoachConsultations(17)).toEqual([expect.objectContaining({
      id: saved.id, observation: 'Primera línea\nSegunda línea', coach: 'Coach Prueba', reason: 'Seguimiento', date: '2026-11-10T00:00:00.000Z',
    })]);
    await service.saveCoachConsultation(17, { observation: 'Observación corregida', date: '2026-11-10', coach: 'Coach Prueba' }, saved.id);
    expect((await service.getCoachConsultations(17))[0].observation).toBe('Observación corregida');
    expect(prisma.paciente_consulta_coach.create).toHaveBeenCalledTimes(1);
  });

  it('rejects empty observations before creating a record', async () => {
    await expect(service.saveCoachConsultation(17, { observation: '  ' })).rejects.toThrow('Escribe la observación');
    expect(prisma.paciente_consulta_coach.create).not.toHaveBeenCalled();
  });

  it('saves other venereal disease and clinical text without erasing unrelated fields', async () => {
    await service.updateFullMedicalHistory(17, { diseases: { otraVenerea: 'Detalle de prueba' }, clinicalBackground: { currentIllness: 'Enfermedad actual', otherAlteration: 'Observación' } });
    const result = await service.getFullMedicalHistory(17);
    expect(result.diseases).toEqual(expect.arrayContaining([expect.objectContaining({ disease: 'otraVenerea', status: 'Detalle de prueba' })]));
    expect(result.clinicalBackground).toMatchObject({ currentIllness: 'Enfermedad actual', otherAlteration: 'Observación' });
    await service.updateFullMedicalHistory(17, { alterations: { tos: true } });
    expect((await service.getFullMedicalHistory(17)).clinicalBackground).toMatchObject({ otherAlteration: 'Observación' });
  });
});
