// lib/storage.ts
// MinIO S3-compatible object storage client for ClaimSetu
// Content-addressed: object key = SHA-256 hash of file bytes

import { Client as MinioClient } from 'minio';

const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = parseInt(process.env.MINIO_PORT || '9000', 10);
const useSSL = process.env.MINIO_USE_SSL === 'true';
const accessKey = process.env.MINIO_ROOT_USER || 'minioadmin';
const secretKey = process.env.MINIO_ROOT_PASSWORD || 'miniopassword';
const bucketName = process.env.MINIO_BUCKET || 'claim-docs';

const globalForMinio = global as unknown as { minioClient?: MinioClient };

export const minio: MinioClient =
  globalForMinio.minioClient ||
  new MinioClient({
    endPoint: endpoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForMinio.minioClient = minio;
}

/**
 * Ensure the target bucket exists. Idempotent.
 */
export async function ensureBucket(): Promise<void> {
  const exists = await minio.bucketExists(bucketName);
  if (!exists) {
    await minio.makeBucket(bucketName);
    console.log(`[MinIO] Created bucket '${bucketName}'`);
  }
}

/**
 * Content-addressed storage key from SHA-256 hash.
 * e.g. "claim-docs/abcd1234..."
 */
export function storageKey(fileHash: string): string {
  return fileHash; // The object name within the bucket
}

/**
 * Upload file bytes to MinIO if the object doesn't already exist.
 * Returns true if a new object was uploaded, false if it already existed.
 */
export async function putObjectIfAbsent(
  fileHash: string,
  buffer: Buffer,
  mimeType: string
): Promise<boolean> {
  await ensureBucket();
  const key = storageKey(fileHash);

  try {
    await minio.statObject(bucketName, key);
    // Object already exists — content-addressed dedup
    return false;
  } catch (err: any) {
    if (err.code === 'NotFound' || err.statusCode === 404) {
      // Object does not exist; upload it
      await minio.putObject(bucketName, key, buffer, buffer.length, {
        'Content-Type': mimeType,
      });
      return true;
    }
    throw err;
  }
}

/**
 * Generate a short-lived presigned GET URL for document viewing.
 * Default expiry: 1 hour (3600 seconds).
 */
export async function presignedGetUrl(
  fileHash: string,
  expiry = 3600
): Promise<string> {
  return minio.presignedGetObject(bucketName, storageKey(fileHash), expiry);
}

/**
 * Retrieve an object's bytes from MinIO.
 */
export async function getObjectBuffer(fileHash: string): Promise<Buffer> {
  const stream = await minio.getObject(bucketName, storageKey(fileHash));
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
