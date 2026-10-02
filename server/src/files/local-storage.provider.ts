import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

import { StorageProvider } from './storage.interface';
import type { UploadedFile } from './uploaded-file.type';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  async upload(
    file: UploadedFile,
    key: string,
  ): Promise<{ path: string; url?: string }> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const fullPath = path.join(this.uploadDir, key);
    await fs.writeFile(fullPath, file.buffer);
    return { path: fullPath };
  }

  getDownloadUrl(key: string): string {
    return `/files/download/${key}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // ignore
    }
  }
}
