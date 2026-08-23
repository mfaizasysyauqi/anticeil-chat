import { S3Client } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  // Not throwing — allow the app to boot; routes will return 500 if called without config
  console.warn('[R2] Missing R2 env vars. Storage features will not work.');
}

/**
 * Singleton S3Client configured to point to Cloudflare R2.
 * R2 is S3-compatible; endpoint is https://<accountId>.r2.cloudflarestorage.com
 */
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId ?? '',
    secretAccessKey: secretAccessKey ?? '',
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? 'anticeil-storage';

/**
 * Public URL base for serving files (custom domain or R2 public bucket URL).
 * Set R2_PUBLIC_URL in env. Falls back to empty string (files won't be publicly accessible).
 */
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

/**
 * Build the storage key for a user's file: `<userId>/<category>/<filename>`
 */
export function r2Key(userId: string, category: string, filename: string): string {
  return `${userId}/${category}/${filename}`;
}

/**
 * Return the public URL for a file if R2_PUBLIC_URL is configured.
 */
export function r2PublicUrl(key: string): string {
  if (!R2_PUBLIC_URL) return '';
  return `${R2_PUBLIC_URL}/${key}`;
}
