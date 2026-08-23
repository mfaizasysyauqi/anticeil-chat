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
  // Step 1: Get presigned URL from our API
  const presignRes = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
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
