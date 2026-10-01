# Correcciones clínicas y almacenamiento remoto

El 30 de septiembre de 2026 se realizó una inspección SSH de solo lectura, autorizada por el propietario, para localizar el proyecto. El 1 de octubre, con autorización explícita para la instalación, se creó la cuenta SFTP aislada, se configuraron sus permisos y se guardaron las siete variables de almacenamiento en Production del backend de Vercel. La prueba real de subida, lectura y eliminación pasó con archivos ficticios. No se modificaron registros clínicos de la base de datos. El propietario requiere autorización antes de cada nuevo conjunto de acciones en el servidor fuera del alcance aprobado.

El backend con las correcciones se publicó desde `f74b3fc` y alcanzó estado Ready en producción: [despliegue verificado](https://vercel.com/aharongps-projects/holistico-hoffman-backend/7Xtp74mXHjDCkb27B4gd3bAmLMuZ). La prueba HTTPS contra `holistico-hoffman-backend.vercel.app` devolvió `200`, `Content-Type: image/png` y exactamente los bytes subidos al SFTP. Se eliminaron la imagen y su directorio de prueba.

El frontend `923b273` también alcanzó estado Ready en Production: [despliegue del frontend](https://vercel.com/aharongps-projects/demo-holistico-hoffman/3RQreHvejHWb8SV79z7AZ6CyB5pJ). Aplicación: [demo-holistico-hoffman.vercel.app](https://demo-holistico-hoffman.vercel.app). Los siguientes commits de documentación conservan este mismo código verificado.

## Rutas verificadas en el servidor

- Servidor: `68.183.142.98`.
- Proyecto principal: `/var/www/html/sshh`.
- Directorio público: `/var/www/html/sshh/public`, configurado en Apache para el puerto `80`.
- Raíz de fotos y estudios: `/var/www/html/sshh/public/assets`.
- Copia de desarrollo: `/var/www/html/sshh_desa`, configurada en Apache para el puerto `8080`.
- También existe `/var/www/html/sshh_desa_old`; no se utiliza como raíz del almacenamiento propuesto.

Se confirmó la existencia de `historia` y de las carpetas de fotos enumeradas abajo. La ruta física es `/var/www/html/sshh/public/assets`; la cuenta aislada `hoffman_files` accede a ellas mediante `FILE_STORAGE_ROOT=/assets`. No se descargaron archivos clínicos durante la verificación.

## Almacenamiento

La configuración aplicada y su reversión están documentadas en [el procedimiento de instalación SFTP](sftp-installation-plan.md). La cuenta aislada usa `FILE_STORAGE_ROOT=/assets`; la ruta física del servidor permanece igual. Copia de reversión: `/var/lib/hoffman-sftp/install.wurbBkPP`.

El backend usa `FileStorageService` para subir y leer fotos corporales, imágenes oculares y estudios mediante SFTP. No escribe archivos persistentes en Vercel. Si se ejecuta en Vercel sin configurar SFTP, devuelve un error explícito en lugar de simular una carga exitosa.

Las variables de `backend/.env.storage.example` y la clave privada dedicada se guardaron en el proyecto **holistico-hoffman-backend**, entorno Production, de Vercel. La clave privada se guardó como Secret. Las credenciales de root no se usan en la aplicación. `FILE_STORAGE_ROOT` apunta a `/assets` dentro del aislamiento y conserva la estructura:

- `images/foto_rostro/<paciente>/<archivo>`
- `images/foto_cuerpo_frente/<paciente>/<archivo>`
- `images/foto_cuerpo_perfil/<paciente>/<archivo>`
- `images/foto_espalda_entero/<paciente>/<archivo>`
- `images/foto_extra/<paciente>/<archivo>`
- `images/foto_ocular/<paciente>/<archivo>`
- `historia/<paciente>/<archivo>`

Las rutas antiguas se siguen resolviendo en esa misma carpeta. `GET /assets/images/*path` lee imágenes del servidor; `GET /patient/attachments/:id/download` obtiene estudios de allí. El frontend usa `VITE_API_BASE` para la API. `VITE_ASSETS_BASE` es opcional y debe ser el origen HTTPS que sirve `/assets`, sin agregar `/assets` a la variable. Nunca colocar credenciales SSH en variables `VITE_*`.

La huella `FILE_STORAGE_HOST_SHA256` es el hash SHA256 **hexadecimal** de la clave pública del host (64 caracteres), como lo recibe `ssh2` con `hostHash: 'sha256'`; no es el formato base64 de `ssh-keygen -l`. Verificarla por un canal de confianza al configurar el acceso. No basta confiar automáticamente en una clave obtenida de la red.

Para desarrollo local, usar `FILE_STORAGE_DRIVER=local` y, opcionalmente, `FILE_STORAGE_LOCAL_ROOT`. Sin ruta explícita se utilizan las carpetas de assets existentes del backend. No cambiar la configuración de base de datos para probar almacenamiento.

Las funciones de Vercel limitan cada petición a 4.5 MB. La interfaz prepara fotos sin recortarlas, con lado máximo de 1600 píxeles, y comprueba un máximo de 4 MB por petición incluyendo el conjunto de fotos. Los documentos admiten hasta 4 MB por carga en la interfaz. Para documentos mayores hace falta un flujo directo al servidor, que no está configurado en este cambio. Fuente: https://vercel.com/docs/functions/limitations. Implementación SFTP: https://github.com/theophilusx/ssh2-sftp-client.

## Comportamientos corregidos

- Fecha de toma seleccionable en Evolución; guardado de peso independiente, sin duplicarlo como masa corporal. Fechas de medición mostradas sin desplazarse al día anterior en Venezuela.
- SQL corregido para frecuencia cardíaca, incluido el valor a 45 minutos.
- Fotos y medidas visibles aun sin peso o estatura; se evita el cálculo de IMC usando una estatura ficticia.
- Cuestionarios seleccionados por instrumento y tema, con respuestas, estado y comentarios separados. Guardar uno no elimina las respuestas de otros tests de la asignación.
- Respuestas nuevas conservan tema, criterio, tipo canónico y tópico desde el catálogo para los gráficos. Se muestran gráficos de valores por pregunta y de tests especializados.
- Programas conservados al editar otros datos; asignación vacía rechazada, desasignación explícita y errores visibles. La ficha no muestra “sin programa” solo porque falte el nombre en el catálogo cargado.
- Corregido el orden de hooks que podía dejar en blanco la ficha al cargar un paciente. Los catálogos vacíos ya no se sustituyen por pacientes, programas o instrumentos ficticios.
- Observaciones e indicaciones visibles en listas de consultas; cédula visible en Evolución.
- Síntomas guardados en `paciente_alteracion` y devueltos al recargar. Compatibilidad con variantes antiguas del nombre “Otra venérea”.
- Estudios visibles y cargables desde la ficha y Evolución. El botón de carga de la historia clínica ahora guarda realmente en el backend.

## Datos históricos

Los gráficos agregados dependen de campos que el código anterior dejaba vacíos. `scripts/repair-instrument-response-metadata.sql` prepara una revisión y reparación explícita de esos metadatos, sin cambiar respuestas ni puntuaciones. **No se ejecutó**. Revisar el diagnóstico y autorizar su aplicación en una sesión con acceso. Las respuestas ya guardadas al cuestionario incorrecto no pueden reconstruirse automáticamente; requieren revisión con el profesional.

## Verificación

Desde backend: `npm test -- --runInBand` y `npm run build`.
Desde frontend: `npm test`, `npm run typecheck` y `npm run build`.

Resultado local: 92 pruebas del backend y 9 del frontend aprobadas; compilación de ambos proyectos y comprobación de TypeScript aprobadas. La prueba en Chromium verificó carga y reapertura de estudios, programa visible, identificación y notas de consulta, y registro de peso independiente con fecha anterior en un paciente sin usuario asociado. El 1 de octubre se verificó también el servicio compilado contra SFTP real: autenticación con huella fijada, aislamiento y subida, lectura y eliminación de TXT y PNG ficticios. Los archivos de prueba se limpiaron.

Para prueba de interfaz con datos ficticios: ejecutar Vite con `VITE_API_BASE=http://127.0.0.1:3999 npm run dev -- --host 127.0.0.1 --port 5178`, después `node scripts/clinical-smoke.mjs`. Requiere Chromium de Playwright. Todas las llamadas a la API se interceptan; no usa el servidor real.

La verificación de infraestructura y la publicación en producción están completadas. La validación clínica con un paciente de prueba debe comprobar: subida/descarga de foto y PDF desde la interfaz, reapertura de historia, peso solo con fecha anterior, frecuencia cardíaca, dos tests diferentes, gráficos y asignación/reapertura de programa. Estos flujos se probaron localmente con datos ficticios; no se modificaron pacientes reales para validar el despliegue.
