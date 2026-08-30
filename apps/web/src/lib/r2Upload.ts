'use client';

/**
 * Upload a File directly to Cloudflare R2 via a server-generated presigned PUT URL.
 *
 * Flow:
 *   1. Client calls POST /api/storage/upload to get a presigned URL + key
 *   2. Client PUTs the file directly to R2 (no bytes go through Next.js server)
 *   3. Returns { key, publicUrl } on success
 */
export interface R2UploadResult {
  key: string;
  publicUrl: string | null;
}

export async function uploadToR2(
  file: File,
  category: 'docs' | 'images' | 'audio' | 'other',
  accessToken: string
): Promise<R2UploadResult> {
  // Step 1: Get upload URL from our API
  const customHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  if (typeof window !== 'undefined') {
    const driver = localStorage.getItem('anticeil_active_media_driver');
    if (driver) customHeaders['x-storage-driver'] = driver;

    const r2AccountId = localStorage.getItem('anticeil_r2_account_id');
    const r2BucketName = localStorage.getItem('anticeil_r2_bucket_name');
    const r2AccessKeyId = localStorage.getItem('anticeil_r2_access_key_id');
    const r2SecretAccessKey = localStorage.getItem('anticeil_r2_secret_access_key');
    const r2PublicUrl = localStorage.getItem('anticeil_r2_public_url');

    if (r2AccountId) customHeaders['x-custom-r2-account-id'] = r2AccountId;
    if (r2BucketName) customHeaders['x-custom-r2-bucket-name'] = r2BucketName;
    if (r2AccessKeyId) customHeaders['x-custom-r2-access-key-id'] = r2AccessKeyId;
    if (r2SecretAccessKey) customHeaders['x-custom-r2-secret-access-key'] = r2SecretAccessKey;
    if (r2PublicUrl) customHeaders['x-custom-r2-public-url'] = r2PublicUrl;
  }

  const presignRes = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      category,
      size: file.size,
    }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    throw new Error(err.error ?? `Failed to get upload URL (${presignRes.status})`);
  }

  const { uploadUrl, key, publicUrl } = await presignRes.json();

  // Step 2: PUT file directly to R2
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`R2 upload failed (${uploadRes.status})`);
  }

  return { key, publicUrl };
}
