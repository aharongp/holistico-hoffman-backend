# Gráficos de instrumentos y observaciones del coach

## Evidencia y causas

La revisión del 11 de noviembre de 2026 confirmó que `instrumento_grafico` no contiene registros en la base configurada ni en la copia histórica `hacienda.sql`. Los gráficos antiguos dependían de esa tabla y la interfaz nueva solo ofrecía barras para respuestas numéricas. No había un catálogo de gráficos guardados que se pudiera recuperar.

También hay respuestas antiguas sin `id_instrumento`. Al filtrar por ese campo desaparecían del resultado individual aunque conservaran la pregunta o el tema. La lectura ahora recupera la referencia cuando la pregunta y el tema del catálogo permiten identificarla inequívocamente. Si el instrumento del catálogo ya no existe, el resultado conserva el tema histórico identificado, sin inventar un identificador ni actualizar la base.

Las observaciones generales estaban en `paciente_consulta_coach`, con una ruta de lectura, pero sin una ruta de escritura en la historia actual. Las recomendaciones del coach guardadas en `paciente_consulta` tampoco aparecían en las listas de consultas. Los decoradores `PATCH` y `PUT` de actualización se superponían en el mismo método; ahora tienen rutas independientes.

## Implementación

- `GET /patient-instruments/charts/patient/:patientId` y `GET /patient-instruments/charts/user/:userId` devuelven todos los tests de cada asignación y sus gráficos. Exigen sesión; un paciente solo puede consultar su propia cuenta. Los gráficos se calculan desde las respuestas finalizadas y conservan la separación entre asignaciones e instrumentos. No se ejecutan sentencias SQL provenientes de configuración.
- Gráficos de valores por pregunta, promedios por área, sumas por área para firmeza/adaptabilidad y rigiflex, ruedas radiales y frecuencias para respuestas no numéricas. Las frecuencias de texto no se presentan como puntuaciones clínicas. Los tests pendientes o sin valores graficables muestran su estado explícitamente.
- Los resultados se muestran tanto en la vista general como al abrir un test desde Actividades o Evolución. Hay selector por instrumento/asignación, filtro de estado, datos tabulados y paginación de seis tests. Las animaciones se deshabilitan para evitar capturas o exportaciones de gráficos incompletos.
- `POST /patients/history/:patientId/coach-consultations` y `PUT /patients/history/:patientId/coach-consultations/:recordId` guardan y editan observaciones generales. Validan paciente, registro, fecha y texto; el autor se toma de la sesión. Solo los roles profesionales y administrador pueden escribirlas.
- El formulario compartido de observaciones aparece en la historia médica y el resumen clínico de Evolución. Conserva el borrador ante errores y confirma el contenido devuelto antes de mostrar éxito. Las recomendaciones del coach también aparecen en las tablas de consultas.
- El guardado de comentarios de instrumentos ahora verifica que la respuesta confirme el texto persistido; los títulos se resuelven con las respuestas del test correspondiente, no con las de otros tests de la misma asignación.

No requiere migración de esquema ni reparación masiva de datos. Los históricos sin una asignación existente no se vuelven a vincular automáticamente.

## Verificación reproducible

Desde `backend`:

```sh
npm test -- --runInBand
npm run build
node --env-file=.env -r ts-node/register -r tsconfig-paths/register scripts/audit-instrument-charts.ts
node --env-file=.env -r ts-node/register -r tsconfig-paths/register scripts/verify-coach-observation-rollback.ts
```

La auditoría es de solo lectura y solo imprime conteos agregados. En la base configurada verificó 1.295 pacientes, 736 tests con resultados, 1.149 gráficos y 16.652 respuestas finalizadas no vacías asociadas a asignaciones existentes: ninguna quedó sin representación. Los registros sin valores no reciben puntuaciones inventadas. El script de observaciones usa un paciente ficticio dentro de una transacción que se revierte obligatoriamente; comprueba creación, edición, lectura y ausencia final de ambos registros de prueba.

Desde `frontend`, después de compilar backend:

```sh
npm run typecheck
npm test
npm run build
VITE_API_BASE=http://127.0.0.1:3999 npm run dev -- --host 127.0.0.1 --port 5178
node scripts/instrument-results-and-coach-smoke.mjs
```

La prueba de navegador intercepta todas las llamadas a la API y usa datos ficticios. Comprueba creación/edición/reapertura de notas, conservación del borrador ante fallo, comentarios por test, gráficos numéricos/radiales/de texto, filtro, paginación y apertura de resultados como profesional y paciente. Puede indicarse `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` si Chromium está instalado fuera de la ruta predeterminada de Playwright.

Los cambios están verificados localmente; este trabajo no incluye publicación en Vercel.
