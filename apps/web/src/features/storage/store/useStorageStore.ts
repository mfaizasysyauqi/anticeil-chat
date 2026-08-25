'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StorageBreakdown {
  docs: number;     // in bytes (PDFs, docs in R2 & text)
  images: number;   // in bytes (Images, videos in R2 & generation prompts)
  audio: number;    // in bytes (Audio in R2)
  database: number; // in bytes (Supabase database rows, prompts, automations, folders)
  other: number;    // in bytes
}

export interface StorageSources {
  r2Bytes: number;
  databaseBytes: number;
  isR2Available?: boolean;
}

interface StorageState {
  usedBytes: number;
  limitBytes: number;
  breakdown: StorageBreakdown;
  sources: StorageSources;
  fileCount: number;
  lastSyncedAt: number | null; // epoch ms

  // Actions
  addUsage: (bytes: number, category?: keyof StorageBreakdown) => boolean;
  removeUsage: (bytes: number, category?: keyof StorageBreakdown) => void;
  canFit: (bytes: number) => boolean;
  resetStorage: () => void;
  syncFromSupabase: (accessToken: string) => Promise<void>;
  getFormattedUsage: () => { usedFormatted: string; limitFormatted: string; percentage: number };
}

export const DEFAULT_STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024; // 1 GB

export function formatStorageBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals < 0 ? 0 : decimals))} ${sizes[i]}`;
}

// Sync at most once every 5 minutes
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export const useStorageStore = create<StorageState>()(
  persist(
    (set, get) => ({
      usedBytes: 0,
      limitBytes: DEFAULT_STORAGE_LIMIT_BYTES,
      breakdown: { docs: 0, images: 0, audio: 0, database: 0, other: 0 },
      sources: { r2Bytes: 0, databaseBytes: 0, isR2Available: true },
      fileCount: 0,
      lastSyncedAt: null,

      canFit: (incomingBytes: number) => {
        const { usedBytes, limitBytes } = get();
        return usedBytes + incomingBytes <= limitBytes;
      },

      addUsage: (bytes: number, category: keyof StorageBreakdown = 'other') => {
        const { usedBytes, limitBytes, breakdown, fileCount, sources } = get();
        if (usedBytes + bytes > limitBytes) return false;
        set({
          usedBytes: usedBytes + bytes,
          fileCount: fileCount + 1,
          breakdown: { ...breakdown, [category]: (breakdown[category] || 0) + bytes },
          sources: { ...sources, r2Bytes: sources.r2Bytes + bytes },
        });
        return true;
      },

      removeUsage: (bytes: number, category: keyof StorageBreakdown = 'other') => {
        const { usedBytes, breakdown, fileCount, sources } = get();
        set({
          usedBytes: Math.max(0, usedBytes - bytes),
          fileCount: Math.max(0, fileCount - 1),
          breakdown: { ...breakdown, [category]: Math.max(0, (breakdown[category] || 0) - bytes) },
          sources: { ...sources, r2Bytes: Math.max(0, sources.r2Bytes - bytes) },
        });
      },

      resetStorage: () => {
        set({
          usedBytes: 0,
          fileCount: 0,
          breakdown: { docs: 0, images: 0, audio: 0, database: 0, other: 0 },
          sources: { r2Bytes: 0, databaseBytes: 0, isR2Available: true },
          lastSyncedAt: null,
        });
      },

      syncFromSupabase: async (accessToken: string) => {
        const { lastSyncedAt } = get();
        const now = Date.now();

        // Throttle: skip if synced recently
        if (lastSyncedAt && now - lastSyncedAt < SYNC_INTERVAL_MS) return;

        try {
          const res = await fetch('/api/storage/usage', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) return;

          const data = await res.json();
          if (typeof data.totalBytes !== 'number') return;

          set({
            usedBytes: data.totalBytes,
            breakdown: data.breakdown ?? { docs: 0, images: 0, audio: 0, database: 0, other: 0 },
            sources: data.sources ?? { r2Bytes: 0, databaseBytes: 0, isR2Available: true },
            fileCount: data.fileCount ?? 0,
            lastSyncedAt: now,
          });
        } catch {
          // Silently fail — local counter remains valid
        }
      },

      getFormattedUsage: () => {
        const { usedBytes, limitBytes } = get();
        const percentage = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
        return {
          usedFormatted: formatStorageBytes(usedBytes),
          limitFormatted: formatStorageBytes(limitBytes),
          percentage,
        };
      },
    }),
    { name: 'anticeil-storage-quota' }
  )
);
