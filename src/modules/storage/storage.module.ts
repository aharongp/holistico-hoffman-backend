import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { StorageController } from './storage.controller';

@Module({ providers: [FileStorageService], controllers: [StorageController], exports: [FileStorageService] })
export class StorageModule {}
