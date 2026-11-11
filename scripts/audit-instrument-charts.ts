// Read-only audit. Outputs aggregate counts only, never names, answers or clinical records.
// Run from backend after configuring DATABASE_URL:
// node --env-file=.env -r ts-node/register -r tsconfig-paths/register scripts/audit-instrument-charts.ts
import { PrismaService } from '../src/prisma/prisma.service';
import { PatientInstrumentsService } from '../src/modules/patients/patient-instruments/patient-instruments.service';
import { MailService } from '../src/modules/mail/mail.service';

async function main() {
  const prisma = new PrismaService();
  const summary = {
    patients: 0,
    testsWithCharts: 0,
    charts: 0,
    nonemptyAssignedResponses: 0,
    missingCharts: 0,
    unlinkedHistoricalResponses: 0,
  };
  try {
    const service = new PatientInstrumentsService(prisma, {} as MailService);
    const patients = await prisma.paciente_instrumento.groupBy({
      by: ['id_paciente'],
      where: { id_paciente: { not: null } },
    });
    for (const patient of patients) {
      const patientId = patient.id_paciente!;
      const exists = await prisma.paciente.findUnique({
        where: { id: patientId },
        select: { id: true },
      });
      if (!exists) continue;
      const [results, responses] = await Promise.all([
        service.findChartsByPatient(patientId),
        service.findResponsesByPatient(patientId),
      ]);
      const assignments = new Set(results.map((row) => row.assignmentId));
      const withCharts = results.filter((row) =>
        row.charts.some((chart) => chart.points.length > 0),
      );
      const keys = new Set(withCharts.map((row) => row.resultKey));
      summary.patients++;
      summary.testsWithCharts += withCharts.length;
      summary.charts += results.reduce((count, row) => count + row.charts.length, 0);
      for (const row of responses) {
        if (row.saved || !row.answer?.trim()) continue;
        if (!row.patientInstrumentId || !assignments.has(row.patientInstrumentId)) {
          summary.unlinkedHistoricalResponses++;
          continue;
        }
        summary.nonemptyAssignedResponses++;
        const key = `${row.patientInstrumentId}:${row.instrumentId ?? `subject-${row.topicId ?? row.theme ?? 'unknown'}`}`;
        if (!keys.has(key)) summary.missingCharts++;
      }
      if (summary.patients % 25 === 0)
        console.log(
          JSON.stringify({
            patientsAudited: summary.patients,
            missingCharts: summary.missingCharts,
          }),
        );
    }
    console.log(JSON.stringify(summary));
    if (summary.missingCharts > 0)
      throw new Error('Some nonempty assigned responses are missing charts.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.code || error.name, 'Chart coverage audit did not pass.');
  process.exitCode = 1;
});
