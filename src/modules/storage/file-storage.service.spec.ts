import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileStorageService } from './file-storage.service';
import SftpClient from 'ssh2-sftp-client';

jest.mock('ssh2-sftp-client');

describe('File storage', () => {
  const env = { ...process.env };
  let root: string;
  let service: FileStorageService;
  beforeEach(async () => {
    process.env = { ...env, FILE_STORAGE_DRIVER: 'local' };
    delete process.env.VERCEL;
    root = await mkdtemp(join(tmpdir(), 'hoffman-storage-'));
    process.env.FILE_STORAGE_LOCAL_ROOT = root;
    service = new FileStorageService();
  });
  afterEach(async () => { process.env = { ...env }; await rm(root, { recursive: true, force: true }); });

  it('round trips files in the legacy directory layout', async () => {
    const key = 'images/foto_cuerpo_frente/17/photo.jpg';
    await service.put(key, Buffer.from('test-content'));
    expect(await readFile(join(root, key), 'utf8')).toBe('test-content');
    expect((await service.get(`assets/${key}`)).toString()).toBe('test-content');
    await service.delete(key);
    await expect(service.get(key)).rejects.toThrow('Archivo no encontrado');
  });
  it.each(['images/../../.env', 'historia/../.env', 'images\\..\\.env', '.env', 'images/./file'])('rejects unsafe path %s', async key => {
    await expect(service.put(key, Buffer.from('x'))).rejects.toThrow();
    await expect(service.get(key)).rejects.toThrow();
  });
  it('fails explicitly on Vercel without remote storage', async () => {
    process.env.VERCEL = '1';
    await expect(service.put('historia/17/test.pdf', Buffer.from('x'))).rejects.toThrow('FILE_STORAGE_DRIVER=sftp');
  });
  it('uploads and retrieves from SFTP using the configured assets root', async () => {
    Object.assign(process.env, { FILE_STORAGE_DRIVER: 'sftp', FILE_STORAGE_HOST: 'test-host', FILE_STORAGE_USERNAME: 'test-user', FILE_STORAGE_PASSWORD: 'test-only', FILE_STORAGE_ROOT: '/app/public/assets', FILE_STORAGE_HOST_SHA256: 'a'.repeat(64) });
    const client = { connect: jest.fn(), mkdir: jest.fn(), put: jest.fn(), get: jest.fn().mockResolvedValue(Buffer.from('remote')), exists: jest.fn().mockResolvedValue('-'), end: jest.fn().mockResolvedValue(undefined) };
    (SftpClient as jest.MockedClass<typeof SftpClient>).mockImplementation(() => client as any);
    await service.put('historia/17/test.pdf', Buffer.from('new'));
    expect(client.put).toHaveBeenCalledWith(Buffer.from('new'), '/app/public/assets/historia/17/test.pdf');
    expect((await service.get('historia/17/test.pdf')).toString()).toBe('remote');
    const verifier = client.connect.mock.calls[0][0].hostVerifier;
    expect(verifier('a'.repeat(64))).toBe(true);
    expect(verifier('b'.repeat(64))).toBe(false);
    expect(client.end).toHaveBeenCalledTimes(2);
  });
});
