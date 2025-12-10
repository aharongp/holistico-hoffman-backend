import 'reflect-metadata';
import { PrismaService } from '../src/prisma/prisma.service';
import { PatientInstrumentsService } from '../src/modules/patients/patient-instruments/patient-instruments.service';

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();

  const service = new PatientInstrumentsService(prisma);

  const patients = await prisma.paciente.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
    take: 5,
  });

  if (!patients.length) {
    console.log('No se encontraron pacientes con respuestas registradas.');
    await prisma.$disconnect();
    return;
  }

  for (const candidate of patients) {
    const patientId = candidate.id;
    if (!patientId) {
      continue;
    }

    try {
      const results = await service.findAggregatedResultsByPatient(patientId);
      console.log(`Resultados agregados para paciente ${patientId}:`);
      console.dir(results, { depth: null });
      const lifeTypes = results.wellness.wheelOfLife.map((item) => typeof item.average);
      const healthTypes = results.wellness.wheelOfHealth.map((item) => typeof item.average);
      const regiflexTypes = results.wellness.regiflex?.entries.map((entry) => typeof entry.sum) ?? [];
      console.log('Tipos promedio vida:', lifeTypes);
      console.log('Tipos promedio salud:', healthTypes);
      console.log('Tipos regiflex:', regiflexTypes);
    } catch (error) {
      console.error(`Error al obtener resultados para paciente ${patientId}:`, error);
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error en el script de depuración:', error);
  process.exit(1);
});
