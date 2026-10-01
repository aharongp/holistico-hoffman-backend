import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, posix } from 'node:path';
import SftpClient from 'ssh2-sftp-client';

/** Paths are relative to public/assets in the original PHP installation. */
@Injectable()
export class FileStorageService {
  private normalize(path: string): string {
    const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/^assets\//, '');
    if (!normalized || normalized.split('/').some(part => !part || part === '..' || part === '.') || /[\x00-\x1f]/.test(normalized)) {
      throw new BadRequestException('Ruta de archivo inválida.');
    }
    if (!/^(images|historia)\//.test(normalized)) throw new BadRequestException('Carpeta de archivo inválida.');
    return normalized;
  }

  private get remote(): boolean {
    if (process.env.FILE_STORAGE_DRIVER === 'sftp') return true;
    if (process.env.VERCEL) throw new ServiceUnavailableException('Configura FILE_STORAGE_DRIVER=sftp y el acceso al servidor de archivos.');
    return false;
  }

  private localRoot(): string {
    if (process.env.FILE_STORAGE_LOCAL_ROOT) return process.env.FILE_STORAGE_LOCAL_ROOT;
    return [join(process.cwd(), 'assets'), join(process.cwd(), 'src/assets'), join(process.cwd(), 'dist/assets')]
      .find(candidate => existsSync(candidate)) ?? join(process.cwd(), 'assets');
  }

  private async withSftp<T>(operation: (client: SftpClient, root: string) => Promise<T>): Promise<T> {
    const { FILE_STORAGE_HOST: host, FILE_STORAGE_USERNAME: username, FILE_STORAGE_PASSWORD: password,
      FILE_STORAGE_PRIVATE_KEY: key, FILE_STORAGE_ROOT: root, FILE_STORAGE_HOST_SHA256: fingerprint } = process.env;
    if (!host || !username || !root?.startsWith('/') || (!password && !key) || !fingerprint) {
      throw new ServiceUnavailableException('Falta configurar el acceso SFTP, la ruta absoluta public/assets o la huella SHA256 del servidor.');
    }
    const client = new SftpClient();
    try {
      await client.connect({
        host, username, port: Number(process.env.FILE_STORAGE_PORT || 22),
        password, privateKey: key?.replace(/\\n/g, '\n'),
        passphrase: process.env.FILE_STORAGE_PASSPHRASE,
        readyTimeout: 15000,
        hostHash: 'sha256',
        hostVerifier: hash => hash === fingerprint.toLowerCase(),
      });
      return await operation(client, root);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new ServiceUnavailableException('No se pudo acceder al servidor de archivos. Verifica la configuración SFTP.');
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  async put(path: string, content: Buffer): Promise<void> {
    const key = this.normalize(path);
    if (this.remote) {
      await this.withSftp(async (client, root) => {
        const target = posix.join(root, key);
        await client.mkdir(posix.dirname(target), true);
        await client.put(content, target);
      });
    } else {
      const target = join(this.localRoot(), key);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content);
    }
  }

  async get(path: string): Promise<Buffer> {
    const key = this.normalize(path);
    if (this.remote) {
      return this.withSftp(async (client, root) => {
        const target = posix.join(root, key);
        if (!(await client.exists(target))) throw new NotFoundException('Archivo no encontrado.');
        return await client.get(target) as Buffer;
      });
    }
    try { return await readFile(join(this.localRoot(), key)); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new NotFoundException('Archivo no encontrado.');
      throw error;
    }
  }

  async delete(path: string): Promise<void> {
    const key = this.normalize(path);
    if (this.remote) {
      await this.withSftp(async (client, root) => { await client.delete(posix.join(root, key), true); });
    } else {
      await unlink(join(this.localRoot(), key)).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
  }
}
