import { PrismaClient } from '@prisma/client';

const run = async () => {
  const prisma = new PrismaClient();

  try {
    const arg = process.argv[2];
    if (!arg) {
      const samples = await prisma.$queryRaw<Array<{ id_paciente: number | null }>>`
        SELECT DISTINCT id_paciente
        FROM paciente_instrumento_respuesta
        WHERE tipo_instrumento = 'diagnostico-salud'
          AND evaluado = 0
        ORDER BY id_paciente
        LIMIT 20
      `;

      console.log('Available patient ids with diagnostico-salud responses:');
      for (const sample of samples) {
        console.log(sample.id_paciente);
      }
      return;
    }

    const patientId = Number(arg);
    const instrumentArg = process.argv[3];
    let instrumentId: number | null = null;
    if (instrumentArg) {
      instrumentId = Number(instrumentArg);
    }
    let whereClause = `p.id_paciente = ${patientId} AND p.tipo_instrumento = 'diagnostico-salud' AND p.evaluado = 0`;
    if (instrumentId !== null) {
      whereClause += ` AND p.id_paciente_instrumento = ${instrumentId}`;
    }

    const sql = `
      SELECT
        t.nombre AS topico,
        t.id AS id,
        SUM(CAST(p.respuesta AS INTEGER)) AS suma
      FROM paciente_instrumento_respuesta p
      INNER JOIN pregunta q ON p.id_pregunta = q.id
      INNER JOIN topico t ON q.id_topico = t.id
      WHERE ${whereClause}
      GROUP BY t.nombre, t.id
      ORDER BY t.nombre
    `;

    const rows = await prisma.$queryRawUnsafe<Array<{ topico: string | null; id: number | null; suma: bigint | number | null }>>(sql);

    console.log(`Patient ${patientId}${instrumentId !== null ? ` (instrument ${instrumentId})` : ''}`);
    for (const row of rows) {
      console.log({ id: row.id, topic: row.topico, sum: row.suma });
    }
  } finally {
    await prisma.$disconnect();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
