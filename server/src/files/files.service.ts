import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as path from 'path';

import { DatabaseService } from '@/db/database.service';
import { files } from '@/db/schema/files.schema';
import { LocalStorageProvider } from './local-storage.provider';
import type { UploadedFile, UploadMetadata } from './uploaded-file.type';

@Injectable()
export class FilesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: LocalStorageProvider,
  ) {}

  async upload(tenantId: string, file: UploadedFile, metadata: UploadMetadata) {
    const ext = path.extname(file.originalname);
    const key = `${randomUUID()}${ext}`;
    const { path: storedPath } = await this.storage.upload(file, key);

    const [created] = await this.db.db
      .insert(files)
      .values({
        tenantId,
        projectId: metadata.projectId,
        taskId: metadata.taskId,
        deliverableId: metadata.deliverableId,
        originalName: file.originalname,
        filename: key,
        path: storedPath,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: metadata.uploadedById,
      })
      .returning();

    return created;
  }

  async findAll(tenantId: string) {
    return this.db.db
      .select()
      .from(files)
      .where(and(eq(files.tenantId, tenantId), eq(files.isArchived, false)))
      .orderBy(desc(files.createdAt));
  }

  async findOne(tenantId: string, id: string) {
    const [file] = await this.db.db
      .select()
      .from(files)
      .where(and(eq(files.id, id), eq(files.tenantId, tenantId)))
      .limit(1);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async remove(tenantId: string, id: string) {
    const [file] = await this.db.db
      .update(files)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(files.id, id), eq(files.tenantId, tenantId)))
      .returning();

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }
}
