// Writes synthetic fixtures inside a transaction that always rolls back.
// No existing patient or clinical record is edited.
// node --env-file=.env -r ts-node/register -r tsconfig-paths/register scripts/verify-coach-observation-rollback.ts
import assert from 'node:assert/strict';
import { PrismaService } from '../src/prisma/prisma.service';
import { HistoryService } from '../src/modules/patients/history/history.service';
import { FileStorageService } from '../src/modules/storage/file-storage.service';

async function main() {
  const prisma = new PrismaService();
  const rollback = new Error('ROLLBACK_TEST_FIXTURES');
  let patientId: number | null = null;
  let noteId: number | null = null;
  try {
    try {
      await prisma.$transaction(async transaction => {
        const patient = await transaction.paciente.create({ data: { nombres: 'Prueba técnica temporal', apellidos: 'Rollback de observaciones', activo: 0 } });
        patientId = patient.id;
        const service = new HistoryService(transaction as PrismaService, {} as FileStorageService);
        const saved = await service.saveCoachConsultation(patient.id, { observation: 'Primera línea de prueba\nSegunda línea de prueba', reason: 'Verificación técnica temporal', coach: 'Coach de prueba', date: '2026-11-10' });
        noteId = saved.id;
        assert.equal((await service.getCoachConsultations(patient.id))[0].observation, 'Primera línea de prueba\nSegunda línea de prueba');
        await service.saveCoachConsultation(patient.id, { observation: 'Texto de prueba modificado', coach: 'Coach de prueba', date: '2026-11-09' }, saved.id);
        const reloaded = await service.getCoachConsultations(patient.id);
        assert.equal(reloaded.length, 1);
        assert.equal(reloaded[0].observation, 'Texto de prueba modificado');
        assert.equal(reloaded[0].date, '2026-11-09T00:00:00.000Z');
        throw rollback;
      }, { timeout: 15000 });
    } catch (error) {
      if (error !== rollback) throw error;
    }
    assert.ok(patientId && noteId);
    assert.equal(await prisma.paciente.findUnique({ where: { id: patientId } }), null);
    assert.equal(await prisma.paciente_consulta_coach.findUnique({ where: { id: noteId } }), null);
    console.log('PASS: real database create/edit/reload; transaction rolled back and both synthetic records are absent.');
  } finally { await prisma.$disconnect(); }
}

main().catch(error => { console.error(error.code || error.name, 'Coach observation transaction verification failed.'); process.exitCode = 1; });
