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

  it('renders both wheels as radar charts when three or more areas exist', () => {
    for (const type of ['rueda-vida', 'rueda-salud']) {
      expect(
        buildInstrumentCharts([answer('5', 'A'), answer('6', 'B'), answer('7', 'C')], type)[0].kind,
      ).toBe('radar');
    }
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
