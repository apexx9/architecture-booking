import type { UploadedFile } from './uploaded-file.type';

export interface StorageProvider {
  upload(
    file: UploadedFile,
    key: string,
  ): Promise<{ path: string; url?: string }>;
  getDownloadUrl(key: string): string | Promise<string>;
  delete(key: string): Promise<void>;
}
