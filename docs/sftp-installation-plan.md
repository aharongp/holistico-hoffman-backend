# Instalación SFTP

Estado al 1 de octubre de 2026: **instalación autorizada y completada**, cuenta `hoffman_files` activa y siete variables SFTP guardadas en Production del backend en Vercel. Verificación SFTP real aprobada. Backend desplegado y lectura HTTPS desde Vercel comprobada con una imagen ficticia.

Copia de reversión de esta instalación: `/var/lib/hoffman-sftp/install.wurbBkPP`. Incluye `sshd_config.before`, `fstab.before` y `storage.acl.before`.

## Configuración concreta

- Cuenta instalada: `hoffman_files`, autenticación exclusiva mediante una clave Ed25519 dedicada. Sin consola, túneles ni reenvío de agentes.
- Raíz aislada: `/srv/hoffman-sftp`, propiedad de `root`, con el almacenamiento visible para SFTP como `/assets`.
- Siete montajes de carpetas existentes: `historia` y `images/{foto_rostro,foto_cuerpo_frente,foto_cuerpo_perfil,foto_espalda_entero,foto_extra,foto_ocular}`.
- Los archivos permanecen en `/var/www/html/sshh/public/assets`. Los montajes no los copian ni trasladan. La cuenta no verá el código PHP, `.env` ni las copias de desarrollo.
- Permisos ACL para leer/escribir en esas siete carpetas. ACL heredables permiten que la aplicación PHP existente y la cuenta nueva accedan a futuras cargas. Se conservan propietarios y permisos existentes de los demás usuarios.
- Copias de la configuración SSH, `/etc/fstab` y ACL actuales en un directorio privado `/var/lib/hoffman-sftp/install.*` antes de modificar esos archivos.
- Validación con `sshd -t` y recarga del servicio SSH. Mantener la conexión administrativa actual abierta durante instalación y verificación.

La configuración específica pasó `sshd -T` en memoria en el OpenSSH 7.6 del servidor y `sshd -t` antes de la recarga. La sintaxis del instalador también se comprobó localmente. Se mantuvo abierta la conexión administrativa durante la instalación.

Archivos utilizados: `scripts/storage/install-sftp-account.sh`, `scripts/storage/hoffman-sftp.sshd.conf` y `scripts/storage/verify-sftp.cjs`. Se copiaron al servidor únicamente el instalador, la configuración y la **clave pública**. La clave privada permanece fuera de Git en `.tmp/hoffman-storage-deploy/id_ed25519`, con permisos `0600` y directorio `0700`, y en el secreto correspondiente de Vercel.

Huella de la clave dedicada: `SHA256:C4/R3rhnakYkXwV5eqkDDFB/Aku90GmpLdUdV85D1/o`.

## Vercel

Proyecto: `holistico-hoffman-backend`, equipo `aharongps-projects`, entorno **Production**. Las seis variables no secretas siguientes se guardaron y verificaron en Chrome:

```env
FILE_STORAGE_DRIVER=sftp
FILE_STORAGE_HOST=68.183.142.98
FILE_STORAGE_PORT=22
FILE_STORAGE_USERNAME=hoffman_files
FILE_STORAGE_ROOT=/assets
FILE_STORAGE_HOST_SHA256=931719aabf721961c5f201ab58762d624e37607a434ed9bb611d768c8d341468
```

`FILE_STORAGE_PRIVATE_KEY` se guardó por separado como **Secret**, solo en Production, con autorización explícita para dar al backend acceso a fotos y estudios. No se configuró la contraseña de root ni se copiaron credenciales al frontend.

La ruta `/assets` corresponde a la cuenta aislada instalada. Con una cuenta sin aislamiento, la ruta física sería `/var/www/html/sshh/public/assets`.

Backend publicado: commit `f74b3fc`, rama `profecto-fastweb`, [despliegue Ready en Production](https://vercel.com/aharongps-projects/holistico-hoffman-backend/7Xtp74mXHjDCkb27B4gd3bAmLMuZ). Frontend publicado: commit `923b273` en `main`, repositorio `demo-holistico-hoffman`, [despliegue Ready en Production](https://vercel.com/aharongps-projects/demo-holistico-hoffman/3RQreHvejHWb8SV79z7AZ6CyB5pJ). Las correcciones requieren el despliegue de esos commits o sus descendientes; redesplegar una versión anterior no las incorpora.

Se verificó en Chrome que el frontend usa `VITE_API_BASE=https://holistico-hoffman-backend.vercel.app` y despliega desde `main`. No fue necesario cambiar esa URL. No se revelaron las credenciales de base de datos ni de administración existentes.

## Verificación autorizada

El verificador usó el servicio real de almacenamiento y creó un TXT y un PNG mínimos, con nombres aleatorios, en carpetas `.deployment-check-*`. Pasaron autenticación, huella, aislamiento, subida, lectura y eliminación. Limpió sus propios archivos y directorios. No consultó la base de datos ni abrió archivos de pacientes.

Tras desplegar el backend se subió otra imagen ficticia por SFTP y se recuperó desde `https://holistico-hoffman-backend.vercel.app/assets/images/foto_extra/.../probe.png`. Se verificaron respuesta `200`, tipo `image/png` y coincidencia exacta de bytes. La imagen y su directorio aleatorio se eliminaron al terminar. La reparación de metadatos clínicos históricos sigue fuera de este procedimiento.

## Reversión

Antes de revertir, confirmar autorización y detener las escrituras desde el despliegue nuevo. Deshabilitar la clave de `hoffman_files` y cerrar sus sesiones SFTP. Retirar exclusivamente los bloques `BEGIN HOFFMAN SFTP` a `END HOFFMAN SFTP` de SSH y `/etc/fstab`, validar SSH y recargarlo. Desmontar las siete carpetas de la raíz aislada. Restaurar las ACL desde `storage.acl.before` tras revisar si hubo archivos o permisos nuevos desde la instalación. Eliminar la cuenta sin borrar su directorio de inicio y retirar solo directorios vacíos de `/srv/hoffman-sftp`. No usar borrados recursivos sobre montajes ni carpetas originales.

Referencias: [OpenSSH: ChrootDirectory y ForceCommand](https://man.openbsd.org/sshd_config), [SFTP: restricciones de solicitudes y umask](https://man.openbsd.org/sftp-server).
