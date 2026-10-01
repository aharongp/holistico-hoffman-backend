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

  it('saves other venereal disease and clinical text without erasing unrelated fields', async () => {
    await service.updateFullMedicalHistory(17, { diseases: { otraVenerea: 'Detalle de prueba' }, clinicalBackground: { currentIllness: 'Enfermedad actual', otherAlteration: 'Observación' } });
    const result = await service.getFullMedicalHistory(17);
    expect(result.diseases).toEqual(expect.arrayContaining([expect.objectContaining({ disease: 'otraVenerea', status: 'Detalle de prueba' })]));
    expect(result.clinicalBackground).toMatchObject({ currentIllness: 'Enfermedad actual', otherAlteration: 'Observación' });
    await service.updateFullMedicalHistory(17, { alterations: { tos: true } });
    expect((await service.getFullMedicalHistory(17)).clinicalBackground).toMatchObject({ otherAlteration: 'Observación' });
  });
});
