import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StorageModule } from './storage.module';
import { FileStorageService } from './file-storage.service';

describe('GET remote-compatible image route', () => {
  let app: INestApplication;
  let root: string;
  const env = { ...process.env };
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'hoffman-route-'));
    process.env.FILE_STORAGE_DRIVER = 'local';
    process.env.FILE_STORAGE_LOCAL_ROOT = root;
    delete process.env.VERCEL;
    const module = await Test.createTestingModule({ imports: [StorageModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    await app.get(FileStorageService).put('images/foto_rostro/17/test.jpg', Buffer.from('image-fixture'));
  });
  afterAll(async () => { await app.close(); await rm(root, { recursive: true, force: true }); process.env = env; });
  it('serves the existing asset URL through the storage service', async () => {
    const response = await request(app.getHttpServer()).get('/assets/images/foto_rostro/17/test.jpg').expect(200).expect('Content-Type', /image\/jpeg/);
    expect(response.body.toString()).toBe('image-fixture');
  });
  it('does not serve scripts or configuration files', async () => {
    await request(app.getHttpServer()).get('/assets/images/test.php').expect(404);
    await request(app.getHttpServer()).get('/assets/.env').expect(404);
  });
});
