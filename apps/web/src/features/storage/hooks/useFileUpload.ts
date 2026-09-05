'use client';

import { useCallback, useRef } from 'react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import type { WorkspaceFile } from '../../storage/store/useWorkspaceStore';

type UploadCategory = 'docs' | 'images' | 'audio' | 'other';

function inferCategory(contentType: string): UploadCategory {
  if (contentType.startsWith('image/')) return 'images';
  if (contentType.startsWith('audio/')) return 'audio';
  if (
    contentType.includes('pdf') ||
    contentType.includes('word') ||
    contentType.includes('text') ||
    contentType.includes('spreadsheet') ||
    contentType.includes('presentation')
  )
    return 'docs';
  return 'other';
}

interface UploadResult {
  file: WorkspaceFile;
}

export function useFileUpload() {
  const session = useAuthStore((s) => s.session);
  const { addUsage } = useStorageStore();
  const inputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Upload a single File object to R2 via presigned URL.
   * Returns a WorkspaceFile descriptor on success or throws on failure.
   */
  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const category = inferCategory(file.type);

      // 1. Get presigned/signed URL from server
      const customHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
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

      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: customHeaders,
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          category,
          size: file.size,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `Upload failed (${res.status})`);
      }

      const { uploadUrl, key, publicUrl } = await res.json();

      // 2. Check client-side storage quota before uploading
      const canUpload = addUsage(file.size);
      if (!canUpload) throw new Error('Storage quota exceeded for your tier');

      // 3. PUT file directly to R2
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!put.ok) {
        // Revert quota deduction
        addUsage(-file.size);
        throw new Error('Upload to R2 failed');
      }

      const workspaceFile: WorkspaceFile = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        contentType: file.type,
        r2Key: key,
        publicUrl,
        uploadedAt: Date.now(),
        category,
      };

      return { file: workspaceFile };
    },
    [session, addUsage]
  );

  /**
   * Open a native file picker then upload all chosen files.
   * Calls onFile for each successfully uploaded file.
   */
  const pickAndUpload = useCallback(
    (opts: {
      accept?: string;
      multiple?: boolean;
      onFile: (file: WorkspaceFile) => void;
      onError?: (err: Error, filename: string) => void;
    }) => {
      if (!inputRef.current) {
        inputRef.current = document.createElement('input');
        inputRef.current.type = 'file';
        inputRef.current.style.display = 'none';
        document.body.appendChild(inputRef.current);
      }

      const input = inputRef.current;
      input.accept = opts.accept ?? '*/*';
      input.multiple = opts.multiple ?? false;

      input.onchange = async () => {
        const files = Array.from(input.files ?? []);
        input.value = ''; // reset so same file can be re-selected

        for (const f of files) {
          try {
            const { file } = await uploadFile(f);
            opts.onFile(file);
          } catch (err: any) {
            opts.onError?.(err instanceof Error ? err : new Error(String(err)), f.name);
          }
        }
      };

      input.click();
    },
    [uploadFile]
  );

  return { uploadFile, pickAndUpload };
}
