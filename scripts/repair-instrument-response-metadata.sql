-- PREPARADO, NO EJECUTADO. Requiere autorización antes de usarlo en el servidor.
-- Primero ejecutar únicamente este diagnóstico (sin mostrar datos clínicos).
SELECT count(*) AS respuestas_con_metadatos_incompletos
FROM paciente_instrumento_respuesta r
JOIN pregunta q ON q.id = r.id_pregunta
JOIN instrumento i ON i.id = q.id_instrumento
JOIN tema t ON t.id = i.id_tema
JOIN instrumento_tipo it ON it.id = i.id_instrumento_tipo
WHERE (r.id_instrumento IS NULL OR r.id_instrumento = i.id)
  AND (r.id_tema IS NULL OR r.id_criterio IS NULL OR r.tipo_instrumento IS DISTINCT FROM t.tipo_instrumento);

-- Reparación revisable. ROLLBACK por defecto; cambiar a COMMIT solo tras autorización.
BEGIN;
UPDATE paciente_instrumento_respuesta r
SET id_instrumento = COALESCE(r.id_instrumento, i.id),
    id_instrumento_tipo = COALESCE(r.id_instrumento_tipo, i.id_instrumento_tipo),
    id_tema = COALESCE(r.id_tema, i.id_tema),
    id_criterio = COALESCE(r.id_criterio, it.id_criterio),
    tipo_instrumento = COALESCE(t.tipo_instrumento, r.tipo_instrumento),
    tema = COALESCE(NULLIF(r.tema, ''), t.nombre),
    topico = COALESCE(NULLIF(r.topico, ''), top.nombre)
FROM pregunta q
JOIN instrumento i ON i.id = q.id_instrumento
JOIN tema t ON t.id = i.id_tema
JOIN instrumento_tipo it ON it.id = i.id_instrumento_tipo
LEFT JOIN topico top ON top.id = q.id_topico
WHERE q.id = r.id_pregunta
  AND (r.id_instrumento IS NULL OR r.id_instrumento = i.id)
  AND (r.id_tema IS NULL OR r.id_criterio IS NULL OR r.topico IS NULL OR r.tipo_instrumento IS DISTINCT FROM t.tipo_instrumento);
ROLLBACK;
