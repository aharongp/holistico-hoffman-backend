import type { PatientInstrumentResponse } from '../entities/patient-instrument.entity';

export type ResultChart = {
  title: string;
  kind: 'bar' | 'radar' | 'pie' | 'line';
  unit: string;
  axisMax?: number;
  points: Array<{ label: string; value: number }>;
};

export type AssignedInstrumentChartResult = {
  firmnessHistory?: { firmness: number; adaptability: number };
  resultKey: string;
  assignmentId: number;
  instrumentId: number | null;
  name: string;
  assignedAt: string | null;
  status: string;
  charts: ResultChart[];
};

const numeric = (raw: string | null): number | null => {
  const value = raw?.trim().replace(',', '.') ?? '';
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

// Charts summarize recorded answers; they do not invent clinical cutoffs or scores.
export function buildInstrumentCharts(
  responses: PatientInstrumentResponse[],
  type: string | null,
  addictionTotals?: Map<string, number>,
): ResultChart[] {
  const rows = responses.filter((row) => !row.saved);
  const numbers = rows.flatMap((row, index) => {
    const value = numeric(row.answer);
    return value === null
      ? []
      : [{ row, value, label: row.question || `Pregunta ${row.order ?? index + 1}` }];
  });
  const charts: ResultChart[] = [];
  if (numbers.length) {
    const topics = new Map<string, { sum: number; count: number }>();
    for (const { row, value } of numbers) {
      const label = type === 'regiflex-flexirigi'
        ? (row.answer?.trim() === '1' ? 'FLEXIRIGI' : 'RIGIFLEX')
        : row.topic?.trim();
      if (!label) continue;
      const previous = topics.get(label) ?? { sum: 0, count: 0 };
      topics.set(label, { sum: previous.sum + value, count: previous.count + 1 });
    }
    if (addictionTotals) {
      const percentages: number[] = [];
      const goalChart = (title: string, percent: number): ResultChart => ({
        title, kind: 'pie', unit: '%',
        points: [
          { label: 'Alcanzado', value: Number(percent.toFixed(2)) },
          { label: 'Por alcanzar', value: Number((100 - percent).toFixed(2)) },
        ],
      });
      for (const [area, { sum }] of topics) {
        const total = addictionTotals.get(area);
        if (!total || sum < 0 || sum > total) continue;
        const percent = 100 * sum / total;
        percentages.push(percent);
        charts.push(goalChart(area, percent));
      }
      if (percentages.length && percentages.length === topics.size) {
        charts.push(goalChart('Tendencia general', percentages.reduce((a, b) => a + b, 0) / percentages.length));
      }
    } else if (topics.size && (type === 'rueda-vida' || type === 'rueda-salud')) {
      charts.push({
        title: type === 'rueda-vida' ? 'Rueda de la vida' : 'Rueda de la salud',
        kind: type === 'rueda-vida' ? 'pie' : 'radar',
        ...(type === 'rueda-salud' ? { axisMax: 5 } : {}),
        unit: 'Promedio',
        points: Array.from(topics, ([label, { sum, count }]) => ({ label, value: Number((sum / count).toFixed(2)) })),
      });
    } else if (topics.size) {
      const sum = type === 'regiflex-flexirigi' || numbers.some((item) => item.row.topicId === 139);
      const points = [...topics].map(([label, value]) => ({
        label,
        value: Number((sum ? value.sum : value.sum / value.count).toFixed(2)),
      }));
      charts.push({
        title: sum ? 'Puntuación por área' : 'Promedio por área',
        kind:
          type === 'regiflex-flexirigi' &&
                points.every((p) => p.value >= 0) &&
                points.some((p) => p.value > 0)
              ? 'pie'
              : 'bar',
        unit: sum ? 'Puntos' : 'Promedio',
        points,
      });
    }
    charts.push({
      title: 'Valores registrados por pregunta',
      kind: 'bar',
      unit: 'Valor registrado',
      points: numbers.map(({ label, value }) => ({ label, value })),
    });
  }
  const categories = new Map<string, number>();
  for (const row of rows) {
    if (numeric(row.answer) !== null || !row.answer?.trim()) continue;
    // Free text is represented as answer counts, never as fabricated numeric scores.
    const label = row.answer.trim();
    categories.set(label, (categories.get(label) ?? 0) + 1);
  }
  if (categories.size)
    charts.push({
      title: 'Distribución de respuestas no numéricas',
      kind: 'bar',
      unit: 'Respuestas',
      points: [...categories].map(([label, value]) => ({ label, value })),
    });
  return charts;
}

export function firmnessPercentages(rows: PatientInstrumentResponse[]) {
  const sums = new Map<string, number>();
  for (const row of rows) {
    if (row.saved || row.topicId !== 139) continue;
    const area = row.topic?.trim().toLowerCase();
    const value = numeric(row.answer);
    if (area && value !== null) sums.set(area, (sums.get(area) ?? 0) + value);
  }
  const firmness = sums.get('firmeza');
  const adaptability = sums.get('adaptabilidad');
  if (firmness === undefined || adaptability === undefined || firmness + adaptability <= 0) return undefined;
  const total = firmness + adaptability;
  return { firmness: Number((100 * firmness / total).toFixed(2)), adaptability: Number((100 * adaptability / total).toFixed(2)) };
}
