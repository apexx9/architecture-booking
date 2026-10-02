import { api } from "@/lib/api/client";

export type FileRecord = {
  id: string;
  tenantId: string;
  projectId?: string | null;
  taskId?: string | null;
  deliverableId?: string | null;
  originalName: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  uploadedById?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * A file attaches to at most one parent. Pass exactly one id; the server stores
 * it and the column it lands in determines where the file shows up.
 */
export type UploadFileInput = {
  file: File;
  projectId?: string;
  taskId?: string;
  deliverableId?: string;
};

export const filesService = {
  async list(): Promise<FileRecord[]> {
    const { data } = await api.get<FileRecord[]>("/files");

    return data;
  },

  async getOne(id: string): Promise<FileRecord> {
    const { data } = await api.get<FileRecord>(`/files/${id}`);

    return data;
  },

  /**
   * Sent as multipart. The shared axios instance sets a JSON content-type
   * header, which would make Express ignore the file part, so it is cleared
   * here and the browser sets the multipart boundary itself.
   */
  async upload(input: UploadFileInput): Promise<FileRecord> {
    const { file, ...fields } = input;

    const body = new FormData();

    body.append("file", file);

    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        body.append(key, value);
      }
    }

    const { data } = await api.post<FileRecord>("/files/upload", body, {
      headers: { "Content-Type": undefined },
    });

    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/files/${id}`);
  },
};