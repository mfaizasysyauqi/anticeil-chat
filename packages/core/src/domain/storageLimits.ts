/**
 * Storage & Security Configuration for Free Tier and Client-Side Protection
 */

// Free Tier Hard Limits
export const MAX_FREE_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB per user
export const MAX_FREE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file

// Dangerous / Executable file extensions blocked from processing & storage
export const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'bash', 'vbs', 'msi', 'scr', 'com', 'pif',
  'ps1', 'jar', 'reg', 'hta', 'cpl', 'gadget', 'apk', 'dmg', 'iso', 'dll',
  'sys', 'wsf', 'action', 'bin', 'vb', 'vbe', 'jse'
]);

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Checks if a filename has a blocked dangerous executable extension.
 */
export function isDangerousExtension(filename: string): boolean {
  const parts = filename.toLowerCase().split('.');
  if (parts.length < 2) return false;
  const ext = parts.pop() || '';
  return BLOCKED_EXTENSIONS.has(ext);
}

/**
 * Validates a file before parsing and storage.
 */
export function validateFileUpload(
  file: { name: string; size: number },
  currentUsedStorageBytes = 0,
  maxFileLimit = MAX_FREE_FILE_BYTES,
  maxTotalStorageLimit = MAX_FREE_STORAGE_BYTES
): FileValidationResult {
  if (isDangerousExtension(file.name)) {
    return {
      valid: false,
      error: `Format berkas .${file.name.split('.').pop()} diblokir demi keamanan.`,
    };
  }

  if (file.size > maxFileLimit) {
    return {
      valid: false,
      error: `Ukuran berkas melebihi batas free tier (Maks 10 MB per berkas).`,
    };
  }

  if (currentUsedStorageBytes + file.size > maxTotalStorageLimit) {
    return {
      valid: false,
      error: `Kapasitas penyimpanan gratis Anda hampir habis (Maks 100 MB).`,
    };
  }

  return { valid: true };
}
