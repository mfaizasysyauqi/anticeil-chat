import { api } from './api';

export interface UploadResult {
  url: string;
  isRemote: boolean;
}

/**
 * Uploads any File or Blob to Cloudflare R2 via backend S3 bridge.
 * If the backend or R2 is offline/unreachable, gracefully falls back
 * to local Base64 Data URL so the application remains 100% functional offline.
 */
export async function uploadMediaToR2(
  file: File | Blob,
  fallbackFilename?: string,
): Promise<UploadResult> {
  const filename = (file instanceof File ? file.name : fallbackFilename) || `file_${Date.now()}`;
  const mimeType = file.type || 'application/octet-stream';

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await api.post<{ url?: string; s3Key?: string }>('/v1/community/upload', {
          filename,
          mimeType,
          base64: dataUrl,
        });

        if (res && res.url) {
          resolve({ url: res.url, isRemote: true });
          return;
        }
      } catch {
        // Backend or R2 unavailable: continue with local fallback
      }

      // Offline fallback
      resolve({ url: dataUrl, isRemote: false });
    };

    reader.onerror = () => {
      resolve({ url: '', isRemote: false });
    };

    reader.readAsDataURL(file);
  });
}
