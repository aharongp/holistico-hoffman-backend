import type { PatientInstrumentResponse } from '../entities/patient-instrument.entity';

export type ResultChart = {
  title: string;
  kind: 'bar' | 'radar' | 'pie' | 'line';
  unit: string;
  points: Array<{ label: string; value: number }>;
};

export type AssignedInstrumentChartResult = {
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
      const label = row.topic?.trim();
      if (!label) continue;
      const previous = topics.get(label) ?? { sum: 0, count: 0 };
      topics.set(label, { sum: previous.sum + value, count: previous.count + 1 });
    }
    if (topics.size) {
      const sum = type === 'regiflex-flexirigi' || numbers.some((item) => item.row.topicId === 139);
      const points = [...topics].map(([label, value]) => ({
        label,
        value: Number((sum ? value.sum : value.sum / value.count).toFixed(2)),
      }));
      charts.push({
        title: sum ? 'Puntuación por área' : 'Promedio por área',
        kind:
          type?.startsWith('rueda-') && points.length >= 3
            ? 'radar'
            : type === 'regiflex-flexirigi' &&
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
