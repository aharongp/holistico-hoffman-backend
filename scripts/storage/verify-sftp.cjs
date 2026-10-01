// Run only after approval to create/remove disposable files on the server.
// Usage: node scripts/storage/verify-sftp.cjs /absolute/path/to/private-key
// Requires npm run build. Does not connect to the patient database.
const { readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const SftpClient = require('ssh2-sftp-client');
const { FileStorageService } = require('../../dist/src/modules/storage/file-storage.service');

async function main() {
  if (!process.argv[2]) throw new Error('Provide the local private-key path; never paste the key.');
  const privateKey = readFileSync(process.argv[2], 'utf8');
  Object.assign(process.env, {
    FILE_STORAGE_DRIVER: 'sftp', FILE_STORAGE_HOST: '68.183.142.98',
    FILE_STORAGE_PORT: '22', FILE_STORAGE_USERNAME: 'hoffman_files',
    FILE_STORAGE_ROOT: '/assets', FILE_STORAGE_PRIVATE_KEY: privateKey,
    FILE_STORAGE_HOST_SHA256: '931719aabf721961c5f201ab58762d624e37607a434ed9bb611d768c8d341468',
  });
  delete process.env.FILE_STORAGE_PASSWORD;
  delete process.env.FILE_STORAGE_PASSPHRASE;
  const service = new FileStorageService();
  const client = new SftpClient();
  const suffix = `.deployment-check-${randomUUID()}`;
  const paths = [
    { directory: `historia/${suffix}`, name: 'probe.txt', bytes: Buffer.from('Disposable Hoffman SFTP verification; no patient information.\n') },
    { directory: `images/foto_extra/${suffix}`, name: 'probe.png', bytes: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jD1sAAAAASUVORK5CYII=', 'base64') },
  ];
  try {
    await client.connect({
      host: process.env.FILE_STORAGE_HOST, port: 22, username: 'hoffman_files', privateKey,
      readyTimeout: 15000, hostHash: 'sha256',
      hostVerifier: hash => hash === process.env.FILE_STORAGE_HOST_SHA256,
    });
    assert.deepEqual((await client.list('/')).map(entry => entry.name).sort(), ['assets']);
    assert.equal(await client.exists('/etc/passwd'), false);
    assert.equal(await client.exists('/var/www/html/sshh/.env'), false);
    for (const probe of paths) {
      const key = `${probe.directory}/${probe.name}`;
      await service.put(key, probe.bytes);
      assert.deepEqual(await service.get(key), probe.bytes);
      await service.delete(key);
      assert.equal(await client.exists(`/assets/${key}`), false);
      console.log(`PASS: upload, download and removal in ${probe.directory.split('/')[0]}.`);
    }
    console.log('PASS: pinned host key and isolated SFTP namespace. No patient data accessed.');
  } finally {
    // Remove only the random probe directories created by this run.
    for (const probe of paths) {
      try {
        if (await client.exists(`/assets/${probe.directory}`)) {
          if (await client.exists(`/assets/${probe.directory}/${probe.name}`)) await client.delete(`/assets/${probe.directory}/${probe.name}`);
          await client.rmdir(`/assets/${probe.directory}`);
        }
      } catch { console.error(`Check cleanup of the disposable directory: /assets/${probe.directory}`); }
    }
    await client.end().catch(() => undefined);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
