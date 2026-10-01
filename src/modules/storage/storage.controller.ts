import { Controller, Get, Param, Res, StreamableFile, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { extname } from 'node:path';
import { FileStorageService } from './file-storage.service';

@Controller('assets')
export class StorageController {
  constructor(private readonly storage: FileStorageService) {}

  @Get('images/*path')
  async image(@Param('path') path: string | string[], @Res({ passthrough: true }) response: Response) {
    const key = Array.isArray(path) ? path.join('/') : path;
    const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[extname(key).toLowerCase()];
    if (!mime) throw new NotFoundException('Imagen no encontrada.');
    const buffer = await this.storage.get(`images/${key}`);
    response.set({ 'Content-Type': mime, 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff' });
    return new StreamableFile(buffer);
  }
}
