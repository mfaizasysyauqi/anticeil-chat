import { UserTier } from '../types';

/**
 * Storage & Security Configuration across Tiers and Client-Side Protection
 */

// Tier Storage Hard Limits (Bytes)
export const FREE_STORAGE_LIMIT_BYTES = 0; // Unlimited Local Browser Storage (No cloud server cap)
export const STARTER_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB per user
export const PRO_STORAGE_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB per user
export const ENTERPRISE_STORAGE_LIMIT_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB (BYOD Zero-Trust)

export const MAX_FREE_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB max local browser threshold
export const MAX_FREE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file

export const TIER_STORAGE_LIMITS: Record<UserTier, number> = {
  free: 0, // Unlimited Local Storage
  starter: STARTER_STORAGE_LIMIT_BYTES,
  pro: PRO_STORAGE_LIMIT_BYTES,
  enterprise: ENTERPRISE_STORAGE_LIMIT_BYTES,
};

/**
 * Returns effective storage limit in bytes for a given user tier.
 */
export function getTierStorageLimitBytes(tier: UserTier = 'free'): number {
  return TIER_STORAGE_LIMITS[tier] ?? 0;
}

/**
 * Checks whether a tier uses Supabase / Cloud database sync.
 * Starter, Pro, and Enterprise all sync to cloud.
 */
export function isCloudTier(tier: UserTier = 'free'): boolean {
  return tier === 'starter' || tier === 'pro' || tier === 'enterprise';
}

/**
 * Returns human-readable storage label per tier.
 */
export function getTierStorageName(tier: UserTier = 'free', lang: 'en' | 'id' = 'en'): string {
  switch (tier) {
    case 'enterprise':
      return 'Custom Supabase / BYOD';
    case 'pro':
      return 'Supabase Cloud R2 (10GB)';
    case 'starter':
      return 'Supabase Cloud (5GB)';
    case 'free':
    default:
      return lang === 'id' ? 'Penyimpanan Browser Lokal (Tanpa Batas)' : 'Local Browser Storage (Unlimited)';
  }
}

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
      error: `Ukuran berkas melebihi batas (Maks ${Math.round(maxFileLimit / (1024 * 1024))} MB per berkas).`,
    };
  }

  if (currentUsedStorageBytes + file.size > maxTotalStorageLimit) {
    return {
      valid: false,
      error: `Kapasitas penyimpanan Anda hampir habis.`,
    };
  }

  return { valid: true };
}

