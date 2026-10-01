import { VitalsService } from './vitals.service';
import sharp from 'sharp';

describe('VitalsService regressions', () => {
  let prisma: any;
  let storage: any;
  let service: VitalsService;
  beforeEach(() => {
    prisma = {
      paciente: { findUnique: jest.fn().mockResolvedValue({ id: 17, estatura: null }) },
      paciente_peso: { create: jest.fn(async ({ data }) => ({ id: 1, ...data })), findMany: jest.fn().mockResolvedValue([]) },
      paciente_masa_corporal: { create: jest.fn(async ({ data }) => ({ id: 2, ...data })), findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    for (const table of ['paciente_consulta', 'paciente_pulso', 'paciente_glicemia', 'paciente_tension_arterial']) prisma[table] = { findMany: jest.fn().mockResolvedValue([]) };
    storage = { put: jest.fn().mockResolvedValue(undefined), delete: jest.fn() };
    service = new VitalsService(prisma, storage);
  });

  it('saves weight independently, keeping the measurement date', async () => {
    const result = await service.registerWeight(17, { peso: '72.5', fecha: '2026-09-24' });
    expect(result.value).toBe(72.5);
    expect(result.recordedAt?.slice(0, 10)).toBe('2026-09-24');
    expect(prisma.paciente_masa_corporal.create).not.toHaveBeenCalled();
    expect(storage.put).not.toHaveBeenCalled();
  });

  it('saves photo and measurements without weight and returns them without height', async () => {
    const buffer = await sharp({ create: { width: 20, height: 40, channels: 3, background: 'white' } }).png().toBuffer();
    await service.registerBodyMass(17, { cintura: '81', fecha: '2026-09-24' }, { front: { buffer, mimetype: 'image/png', originalname: 'front.png' } });
    const saved = prisma.paciente_masa_corporal.create.mock.calls[0][0].data;
    expect(saved.peso).toBeNull();
    expect(saved.cintura).toBe('81');
    expect(saved.foto_cuerpo_frente).toMatch(/^images\/foto_cuerpo_frente\/17\//);
    expect(storage.put).toHaveBeenCalledWith(saved.foto_cuerpo_frente, expect.any(Buffer));
    const image = await sharp(storage.put.mock.calls[0][1]).metadata();
    expect(image.height).toBe(image.width! * 2);
    prisma.paciente_masa_corporal.findMany.mockResolvedValue([{ id: 2, ...saved }]);
    const summary = await service.getByPatient(17);
    expect(summary.bodyMassIndex).toEqual(expect.arrayContaining([expect.objectContaining({ value: null, measurements: expect.objectContaining({ waist: '81' }), photos: expect.arrayContaining([expect.objectContaining({ path: saved.foto_cuerpo_frente })]) })]));
  });

  it('uses one SQL column per heart-rate value, including 45 minutes', async () => {
    prisma.$queryRaw.mockImplementation(async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.join('?');
      const columns = sql.match(/INSERT INTO paciente_frecuencia_cardiaca\s*\(([^)]+)\)/s)![1].split(',').map(value => value.trim());
      expect(new Set(columns).size).toBe(columns.length);
      expect(columns).toHaveLength(values.length);
      expect(columns).toContain('fc_45_min');
      expect(values[columns.indexOf('fc_45_min')]).toBe(75);
      return [{ id: 3, fecha: values[1], fcr: 65, fc_45_min: 75 }];
    });
    const result = await service.registerHeartRate(17, { fcr: '65', fc45Min: '75', fecha: '2026-09-24' });
    expect(result.resting).toBe(65);
    expect(result.after45Minutes).toBe(75);
  });
});
