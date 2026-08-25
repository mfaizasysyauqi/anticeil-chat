'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StorageBreakdown {
  chat: number;       // chat sessions & messages (localStorage)
  docs: number;       // PDFs, docs in R2 & extracted text
  images: number;     // Images/video in R2 & imagine generation prompts
  audio: number;      // Audio in R2
  automations: number; // Workflows, runs, automation data
  database: number;   // Supabase DB rows: prompts, connectors, folders
  other: number;      // R2 misc
}

export interface StorageSources {
  r2Bytes: number;
  databaseBytes: number;
  localBytes: number;   // localStorage-based (chat, automations client state)
  isR2Available?: boolean;
}

interface StorageState {
  usedBytes: number;
  limitBytes: number;
  breakdown: StorageBreakdown;
  sources: StorageSources;
  fileCount: number;
  lastSyncedAt: number | null;
  isSyncing: boolean;

  // Actions
  addUsage: (bytes: number, category?: keyof StorageBreakdown) => boolean;
  removeUsage: (bytes: number, category?: keyof StorageBreakdown) => void;
  canFit: (bytes: number) => boolean;
  resetStorage: () => void;
  syncFromSupabase: (accessToken: string, force?: boolean) => Promise<void>;
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

/** Measure specific localStorage keys in bytes */
function measureLocalStorageKeys(keys: string[]): number {
  if (typeof window === 'undefined') return 0;
  let total = 0;
  for (const key of keys) {
    try {
      const val = localStorage.getItem(key);
      if (val) total += new Blob([val]).size;
    } catch {
      // skip inaccessible keys
    }
  }
  return total;
}

/** Measure all local data from known app keys */
function measureLocalData(): { chat: number; automations: number; other: number } {
  const chatBytes = measureLocalStorageKeys([
    'anticeil-chat-store',
    'anticeil-project-store',
  ]);
  const automationBytes = measureLocalStorageKeys([
    'anticeil-automations',
    'anticeil-automation-runs',
  ]);
  const otherBytes = measureLocalStorageKeys([
    'anticeil-connectors',
    'anticeil-settings',
  ]);
  return { chat: chatBytes, automations: automationBytes, other: otherBytes };
}

// Throttle: only skip if synced within last 30 seconds (unless force=true)
const SYNC_INTERVAL_MS = 30 * 1000;

const EMPTY_BREAKDOWN: StorageBreakdown = {
  chat: 0, docs: 0, images: 0, audio: 0, automations: 0, database: 0, other: 0,
};

export const useStorageStore = create<StorageState>()(
  persist(
    (set, get) => ({
      usedBytes: 0,
      limitBytes: DEFAULT_STORAGE_LIMIT_BYTES,
      breakdown: EMPTY_BREAKDOWN,
      sources: { r2Bytes: 0, databaseBytes: 0, localBytes: 0, isR2Available: true },
      fileCount: 0,
      lastSyncedAt: null,
      isSyncing: false,

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
          breakdown: EMPTY_BREAKDOWN,
          sources: { r2Bytes: 0, databaseBytes: 0, localBytes: 0, isR2Available: true },
          lastSyncedAt: null,
          isSyncing: false,
        });
      },

      syncFromSupabase: async (accessToken: string, force = false) => {
        const { lastSyncedAt, isSyncing } = get();
        const now = Date.now();

        // Throttle unless forced
        if (!force && lastSyncedAt && now - lastSyncedAt < SYNC_INTERVAL_MS) return;
        // Prevent concurrent syncs
        if (isSyncing) return;

        set({ isSyncing: true });

        try {
          // 1. Measure local storage data (chat, automations)
          const local = measureLocalData();

          // 2. Fetch server-side data (Supabase + R2)
          const res = await fetch('/api/storage/usage', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) {
            // Still update local measurements even if server fails
            const localTotal = local.chat + local.automations + local.other;
            set((state) => ({
              usedBytes: (state.sources.r2Bytes + state.sources.databaseBytes) + localTotal,
              breakdown: {
                ...state.breakdown,
                chat: local.chat,
                automations: local.automations,
              },
              sources: { ...state.sources, localBytes: localTotal },
              lastSyncedAt: now,
              isSyncing: false,
            }));
            return;
          }

          const data = await res.json();
          if (typeof data.totalBytes !== 'number') {
            set({ isSyncing: false });
            return;
          }

          const serverBreakdown = data.breakdown ?? EMPTY_BREAKDOWN;
          const localTotal = local.chat + local.automations + local.other;

          set({
            usedBytes: data.totalBytes + localTotal,
            fileCount: data.fileCount ?? 0,
            breakdown: {
              docs: serverBreakdown.docs ?? 0,
              images: serverBreakdown.images ?? 0,
              audio: serverBreakdown.audio ?? 0,
              database: serverBreakdown.database ?? 0,
              other: serverBreakdown.other ?? 0,
              // Local measurements
              chat: local.chat,
              automations: local.automations + (serverBreakdown.automations ?? 0),
            },
            sources: {
              ...(data.sources ?? {}),
              localBytes: localTotal,
              isR2Available: data.sources?.isR2Available ?? true,
            },
            lastSyncedAt: now,
            isSyncing: false,
          });
        } catch {
          set({ isSyncing: false });
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
