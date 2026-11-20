import { buildInstrumentCharts } from './instrument-charts.util';
import type { PatientInstrumentResponse } from '../entities/patient-instrument.entity';

const answer = (value: string, topic = 'Área A', overrides = {}): PatientInstrumentResponse => ({
  id: 1,
  patientId: 1,
  patientInstrumentId: 3,
  instrumentId: 8,
  instrumentTypeId: 13,
  topicId: 55,
  criterionId: 4,
  questionId: 7,
  theme: 'Test',
  topic,
  question: 'Pregunta',
  answer: value,
  competence: null,
  type: 'test-salud',
  order: 1,
  saved: false,
  evaluated: false,
  answerDate: null,
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

describe('Graphs for all catalog test families', () => {
  it.each([
    'academico',
    'auto-evaluacion',
    'cuestionario',
    'diagnostico-salud',
    'fortaleza',
    'regiflex-flexirigi',
    'revista-diaria-externo',
    'revista-diaria-interno',
    'rueda-salud',
    'rueda-vida',
    'test-biologica',
    'test-codependencia',
    'test-estres',
    'test-fortaleza',
    'test-salud',
    null,
  ])('produces numeric charts for %s', (type) => {
    const charts = buildInstrumentCharts([answer('0'), answer('4,5')], type);
    expect(charts.at(-1)?.points.map((point) => point.value)).toEqual([0, 4.5]);
  });

  it('uses averages for areas and preserves negative values without clipping', () => {
    expect(buildInstrumentCharts([answer('-4'), answer('2')], 'fortaleza')[0].points).toEqual([
      { label: 'Área A', value: -1 },
    ]);
  });

  it('keeps one sector per current topic and uses the historical chart for each instrument', () => {
    const rows = [answer('2', 'A'), answer('4', 'A'), answer('5', 'B')];
    expect(buildInstrumentCharts(rows, 'rueda-vida')[0]).toMatchObject({
      kind: 'pie', points: [{ label: 'A', value: 3 }, { label: 'B', value: 5 }],
    });
    expect(buildInstrumentCharts(rows, 'rueda-salud')[0]).toMatchObject({ kind: 'radar', axisMax: 5 });
  });

  it('calculates addiction goals per topic and averages percentages for the overall trend', () => {
    const charts = buildInstrumentCharts([answer('2', 'A'), answer('9', 'B')], null, new Map([['A', 4], ['B', 10]]));
    expect(charts.slice(0, 3).map(c => [c.kind, ...c.points.map(p => p.value)])).toEqual([
      ['pie', 50, 50], ['pie', 90, 10], ['pie', 70, 30],
    ]);
  });

  it('groups Regiflex by the recorded option even when questions have no topic', () => {
    expect(buildInstrumentCharts([answer('1'), answer('2'), answer('2')], 'regiflex-flexirigi')[0]).toMatchObject({
      kind: 'pie', points: [{ label: 'FLEXIRIGI', value: 1 }, { label: 'RIGIFLEX', value: 4 }],
    });
  });

  it('sums the two firmness axes separately using the catalog subject', () => {
    expect(
      buildInstrumentCharts(
        [
          answer('2', 'Firmeza', { topicId: 139 }),
          answer('3', 'Firmeza', { topicId: 139 }),
          answer('4', 'Adaptabilidad', { topicId: 139 }),
        ],
        'test-salud',
      )[0].points,
    ).toEqual([
      { label: 'Firmeza', value: 5 },
      { label: 'Adaptabilidad', value: 4 },
    ]);
  });

  it('shows text response frequencies and does not fabricate clinical scores', () => {
    const chart = buildInstrumentCharts(
      [answer('Sí'), answer('No'), answer('Sí')],
      'cuestionario',
    )[0];
    expect(chart.unit).toBe('Respuestas');
    expect(chart.points).toEqual([
      { label: 'Sí', value: 2 },
      { label: 'No', value: 1 },
    ]);
    expect(buildInstrumentCharts([answer('4', 'A', { saved: true })], 'test-salud')).toEqual([]);
  });
});
