/**
 * The parts of a multipart upload the file pipeline consumes.
 *
 * Declared locally rather than importing `Express.Multer.File` because
 * `@types/multer` is not a dependency: this describes exactly what the
 * service and the storage providers read, which is all the code needs.
 */
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Multipart form fields that can attach an upload to its owner. */
export interface UploadMetadata {
  projectId?: string;
  taskId?: string;
  deliverableId?: string;
  uploadedById?: string;
}
