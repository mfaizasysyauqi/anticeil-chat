'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MAX_FREE_STORAGE_BYTES,
  FREE_STORAGE_LIMIT_BYTES,
  STARTER_STORAGE_LIMIT_BYTES,
  PRO_STORAGE_LIMIT_BYTES,
  ENTERPRISE_STORAGE_LIMIT_BYTES,
  getTierStorageLimitBytes,
  isCloudTier,
} from '@anticeil/core';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface StorageBreakdown {
  chat: number;        // chat sessions & messages (text + attachments)
  docs: number;        // PDFs, docs in R2 & extracted text
  images: number;      // Images/video in R2 & imagine generation prompts
  audio: number;       // Audio in R2
  automations: number; // Workflows, runs, automation data
  database: number;    // Supabase DB rows: prompts, connectors, folders
  other: number;       // R2 misc / settings
}

export interface StorageDetails {
  textBytes: number; // Text data (chat content, reasoning, prompts, folders, config)
  fileBytes: number; // Files & Media (attachments, images, audio, video, pdfs)
  totalBytes: number;
}

export interface StorageSources {
  r2Bytes: number;
  databaseBytes: number;
  localBytes: number;   // localStorage-based (chat, automations client state)
  isR2Available?: boolean;
  localTextBytes?: number;
  localFileBytes?: number;
  dbTextBytes?: number;
  dbFileBytes?: number;
  r2TextBytes?: number;
  r2FileBytes?: number;
}

export interface DetailedLocalMeasurement {
  totalBytes: number;
  textBytes: number;
  fileBytes: number;
  chatTextBytes: number;
  chatFileBytes: number;
  imagineFileBytes: number;
  workspaceFileBytes: number;
  otherTextBytes: number;
  fileCount: number;
}

interface StorageState {
  usedBytes: number;
  limitBytes: number;
  breakdown: StorageBreakdown;
  sources: StorageSources;
  fileCount: number;
  lastSyncedAt: number | null;
  isSyncing: boolean;

  // Granular measurements per engine
  localDetails: StorageDetails;
  supabaseDetails: StorageDetails;
  r2Details: StorageDetails;

  // Actions
  refreshLocalUsage: () => DetailedLocalMeasurement;
  addUsage: (bytes: number, category?: keyof StorageBreakdown) => boolean;
  removeUsage: (bytes: number, category?: keyof StorageBreakdown) => void;
  canFit: (bytes: number) => boolean;
  resetStorage: () => void;
  syncFromSupabase: (accessToken?: string, force?: boolean) => Promise<void>;
  getEffectiveLimit: () => number;
  getFormattedUsage: () => {
    usedFormatted: string;
    limitFormatted: string;
    percentage: number;
    isCloud: boolean;
    isStarter: boolean;
    isPro: boolean;
    isEnterprise: boolean;
  };

  // Grace Period & Auto-Migration
  isGracePeriodDismissed: boolean;
  isMigratingCloudToLocal: boolean;
  dismissGracePeriod: () => void;
  migrateCloudToLocalAndPurge: (accessToken: string) => Promise<{ success: boolean; count: number }>;
}

export { FREE_STORAGE_LIMIT_BYTES, STARTER_STORAGE_LIMIT_BYTES, PRO_STORAGE_LIMIT_BYTES, ENTERPRISE_STORAGE_LIMIT_BYTES };

export function formatStorageBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals < 0 ? 0 : decimals))} ${sizes[i]}`;
}

/**
 * Deeply measures and separates local storage data into Text vs Files/Media
 */
export function measureDetailedLocalData(): DetailedLocalMeasurement {
  if (typeof window === 'undefined') {
    return {
      totalBytes: 0,
      textBytes: 0,
      fileBytes: 0,
      chatTextBytes: 0,
      chatFileBytes: 0,
      imagineFileBytes: 0,
      workspaceFileBytes: 0,
      otherTextBytes: 0,
      fileCount: 0,
    };
  }

  let chatTextBytes = 0;
  let chatFileBytes = 0;
  let imagineFileBytes = 0;
  let workspaceFileBytes = 0;
  let otherTextBytes = 0;
  let fileCount = 0;

  try {
    // 1. Chat Storage ('anticeil_chat_storage')
    const chatRaw = localStorage.getItem('anticeil_chat_storage');
    if (chatRaw) {
      try {
        const parsed = JSON.parse(chatRaw);
        const state = parsed.state || parsed;
        const messagesMap = state.messages || {};
        const sessions = state.sessions || [];

        // Sessions list text
        chatTextBytes += new Blob([JSON.stringify(sessions)]).size;

        // Iterate through all messages to separate text vs media/attachments
        for (const sId in messagesMap) {
          const msgs = messagesMap[sId];
          if (Array.isArray(msgs)) {
            for (const msg of msgs) {
              const textContent = (msg.content || '') + (msg.reasoning_content || '');
              chatTextBytes += new Blob([textContent]).size + 96; // base message schema overhead

              // Attachments (base64 data, url, files)
              if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
                for (const att of msg.attachments) {
                  fileCount++;
                  if (att.data) {
                    chatFileBytes += new Blob([att.data]).size;
                  } else if (att.size && typeof att.size === 'number') {
                    chatFileBytes += att.size;
                  } else if (att.url) {
                    chatFileBytes += new Blob([att.url]).size;
                  }
                }
              }

              // Image URL / Video URL in message (data URLs or remote media)
              if (msg.image_url) {
                fileCount++;
                if (msg.image_url.startsWith('data:')) {
                  chatFileBytes += new Blob([msg.image_url]).size;
                } else {
                  chatTextBytes += new Blob([msg.image_url]).size;
                }
              }
              if (msg.video_url) {
                fileCount++;
                if (msg.video_url.startsWith('data:')) {
                  chatFileBytes += new Blob([msg.video_url]).size;
                } else {
                  chatTextBytes += new Blob([msg.video_url]).size;
                }
              }
            }
          }
        }
      } catch {
        chatTextBytes += new Blob([chatRaw]).size;
      }
    }

    // 2. Imagine & Media Store ('anticeil-imagine-store')
    const imagineRaw = localStorage.getItem('anticeil-imagine-store');
    if (imagineRaw) {
      try {
        const parsed = JSON.parse(imagineRaw);
        const state = parsed.state || parsed;
        const items = state.items || [];
        for (const item of items) {
          fileCount++;
          if (item.url && item.url.startsWith('data:')) {
            imagineFileBytes += new Blob([item.url]).size;
          } else {
            otherTextBytes += new Blob([JSON.stringify(item)]).size;
          }
        }
      } catch {
        otherTextBytes += new Blob([imagineRaw]).size;
      }
    }

    // 3. Workspace Stores ('anticeil-workspace-v3', 'anticeil-workspace-v2', 'anticeil-project-store')
    const wsV3 = localStorage.getItem('anticeil-workspace-v3');
    if (wsV3) {
      try {
        const parsed = JSON.parse(wsV3);
        const state = parsed.state || parsed;
        const projs = state.projects || [];
        for (const p of projs) {
          if (Array.isArray(p.files)) {
            for (const f of p.files) {
              fileCount++;
              workspaceFileBytes += (f.size || 0);
            }
          }
        }
        otherTextBytes += new Blob([wsV3]).size;
      } catch {
        otherTextBytes += new Blob([wsV3]).size;
      }
    }

    // 4. Other configuration, personas, MCP connectors & setting stores
    const otherKeys = [
      'anticeil_prompts_storage',
      'anticeil-project-store',
      'anticeil_connectors_store',
      'anticeil-connectors-v2',
      'anticeil_settings_storage',
      'anticeil-automations',
      'anticeil-automation-runs',
      'anticeil_user_tier',
      'anticeil_custom_supabase_url',
      'anticeil_custom_supabase_anon_key',
      'anticeil_r2_account_id',
      'anticeil_r2_bucket_name',
      'anticeil_r2_access_key_id',
      'anticeil_r2_secret_access_key',
      'anticeil_r2_public_url',
    ];

    for (const key of otherKeys) {
      const val = localStorage.getItem(key);
      if (val) {
        otherTextBytes += new Blob([val]).size;
      }
    }

    // 5. Scan any other cached items in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && !k.startsWith('anticeil') && !k.startsWith('supabase')) {
        const v = localStorage.getItem(k);
        if (v) {
          if (v.startsWith('data:image') || v.startsWith('data:video') || v.startsWith('data:audio')) {
            fileCount++;
            chatFileBytes += new Blob([v]).size;
          } else {
            otherTextBytes += new Blob([v]).size;
          }
        }
      }
    }
  } catch (e) {
    console.warn('[Storage] Error measuring local data:', e);
  }

  const textBytes = chatTextBytes + otherTextBytes;
  const fileBytes = chatFileBytes + imagineFileBytes + workspaceFileBytes;
  const totalBytes = textBytes + fileBytes;

  return {
    totalBytes,
    textBytes,
    fileBytes,
    chatTextBytes,
    chatFileBytes,
    imagineFileBytes,
    workspaceFileBytes,
    otherTextBytes,
    fileCount,
  };
}

// Throttle: only skip if synced within last 30 seconds (unless force=true)
const SYNC_INTERVAL_MS = 30 * 1000;

const EMPTY_BREAKDOWN: StorageBreakdown = {
  chat: 0, docs: 0, images: 0, audio: 0, automations: 0, database: 0, other: 0,
};

const EMPTY_DETAILS: StorageDetails = {
  textBytes: 0,
  fileBytes: 0,
  totalBytes: 0,
};

export const useStorageStore = create<StorageState>()(
  persist(
    (set, get) => ({
      usedBytes: 0,
      limitBytes: FREE_STORAGE_LIMIT_BYTES,
      breakdown: EMPTY_BREAKDOWN,
      sources: {
        r2Bytes: 0,
        databaseBytes: 0,
        localBytes: 0,
        isR2Available: true,
        localTextBytes: 0,
        localFileBytes: 0,
        dbTextBytes: 0,
        dbFileBytes: 0,
        r2TextBytes: 0,
        r2FileBytes: 0,
      },
      fileCount: 0,
      lastSyncedAt: null,
      isSyncing: false,
      isGracePeriodDismissed: false,
      isMigratingCloudToLocal: false,

      dismissGracePeriod: () => set({ isGracePeriodDismissed: true }),

      localDetails: EMPTY_DETAILS,
      supabaseDetails: EMPTY_DETAILS,
      r2Details: EMPTY_DETAILS,

      getEffectiveLimit: () => {
        const tier = useAuthStore.getState().tier;
        return getTierStorageLimitBytes(tier);
      },

      refreshLocalUsage: () => {
        const local = measureDetailedLocalData();
        const tier = useAuthStore.getState().tier;
        const limitBytes = get().getEffectiveLimit();

        const localDetails: StorageDetails = {
          textBytes: local.textBytes,
          fileBytes: local.fileBytes,
          totalBytes: local.totalBytes,
        };

        const state = get();
        const effectiveUsed = tier === 'free'
          ? local.totalBytes
          : (state.sources.r2Bytes + state.sources.databaseBytes) || local.totalBytes;

        set({
          usedBytes: effectiveUsed,
          limitBytes,
          localDetails,
          sources: {
            ...state.sources,
            localBytes: local.totalBytes,
            localTextBytes: local.textBytes,
            localFileBytes: local.fileBytes,
          },
          breakdown: {
            ...state.breakdown,
            chat: local.chatTextBytes + local.chatFileBytes,
            automations: local.otherTextBytes,
          },
        });

        return local;
      },

      canFit: (incomingBytes: number) => {
        const tier = useAuthStore.getState().tier;
        const limitBytes = get().getEffectiveLimit();
        // Free tier has Unlimited Local Browser Storage (limitBytes === 0)
        if (tier === 'free' || limitBytes === 0 || limitBytes === Infinity) {
          return true;
        }
        const { usedBytes } = get();
        return usedBytes + incomingBytes <= limitBytes;
      },

      addUsage: (bytes: number, category: keyof StorageBreakdown = 'other') => {
        const tier = useAuthStore.getState().tier;
        const { usedBytes, breakdown, fileCount, sources, r2Details } = get();
        const limitBytes = get().getEffectiveLimit();
        if (tier !== 'free' && limitBytes > 0 && usedBytes + bytes > limitBytes) return false;
        set({
          usedBytes: usedBytes + bytes,
          limitBytes,
          fileCount: fileCount + 1,
          breakdown: { ...breakdown, [category]: (breakdown[category] || 0) + bytes },
          sources: {
            ...sources,
            r2Bytes: sources.r2Bytes + bytes,
            r2FileBytes: (sources.r2FileBytes || sources.r2Bytes) + bytes,
          },
          r2Details: {
            ...r2Details,
            fileBytes: r2Details.fileBytes + bytes,
            totalBytes: r2Details.totalBytes + bytes,
          },
        });
        return true;
      },

      removeUsage: (bytes: number, category: keyof StorageBreakdown = 'other') => {
        const { usedBytes, breakdown, fileCount, sources, r2Details } = get();
        set({
          usedBytes: Math.max(0, usedBytes - bytes),
          fileCount: Math.max(0, fileCount - 1),
          breakdown: { ...breakdown, [category]: Math.max(0, (breakdown[category] || 0) - bytes) },
          sources: {
            ...sources,
            r2Bytes: Math.max(0, sources.r2Bytes - bytes),
            r2FileBytes: Math.max(0, (sources.r2FileBytes || sources.r2Bytes) - bytes),
          },
          r2Details: {
            ...r2Details,
            fileBytes: Math.max(0, r2Details.fileBytes - bytes),
            totalBytes: Math.max(0, r2Details.totalBytes - bytes),
          },
        });
      },

      resetStorage: () => {
        set({
          usedBytes: 0,
          limitBytes: get().getEffectiveLimit(),
          fileCount: 0,
          breakdown: EMPTY_BREAKDOWN,
          sources: {
            r2Bytes: 0,
            databaseBytes: 0,
            localBytes: 0,
            isR2Available: true,
            localTextBytes: 0,
            localFileBytes: 0,
            dbTextBytes: 0,
            dbFileBytes: 0,
            r2TextBytes: 0,
            r2FileBytes: 0,
          },
          localDetails: EMPTY_DETAILS,
          supabaseDetails: EMPTY_DETAILS,
          r2Details: EMPTY_DETAILS,
          lastSyncedAt: null,
          isSyncing: false,
        });
      },

      syncFromSupabase: async (accessToken?: string, force = false) => {
        const { lastSyncedAt, isSyncing } = get();
        const now = Date.now();

        // Always measure local storage immediately
        const local = get().refreshLocalUsage();

        // If no token or offline, we're done with local measurements
        if (!accessToken) return;

        // Throttle server fetch unless forced
        if (!force && lastSyncedAt && now - lastSyncedAt < SYNC_INTERVAL_MS) return;
        if (isSyncing) return;

        set({ isSyncing: true });

        try {
          const limitBytes = get().getEffectiveLimit();
          const tier = useAuthStore.getState().tier;
          const settings = useSettingsStore.getState();

          // Prepare headers (including enterprise custom BYOD credentials if configured)
          const headers: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
          };
          if (tier === 'enterprise' && settings.customSupabaseUrl && settings.customSupabaseAnonKey) {
            headers['x-custom-supabase-url'] = settings.customSupabaseUrl;
            headers['x-custom-supabase-key'] = settings.customSupabaseAnonKey;
          }

          const res = await fetch('/api/storage/usage', { headers });

          if (!res.ok) {
            set({
              isSyncing: false,
              lastSyncedAt: now,
            });
            return;
          }

          const data = await res.json();
          if (typeof data.totalBytes !== 'number') {
            set({ isSyncing: false });
            return;
          }

          const serverBreakdown = data.breakdown ?? EMPTY_BREAKDOWN;
          const serverSources = data.sources ?? {};

          const dbText = Number(serverSources.dbTextBytes ?? serverSources.databaseBytes ?? 0);
          const dbFile = Number(serverSources.dbFileBytes ?? 0);
          const r2File = Number(serverSources.r2FileBytes ?? serverSources.r2Bytes ?? 0);
          const r2Text = Number(serverSources.r2TextBytes ?? 0);

          const supabaseDetails: StorageDetails = {
            textBytes: dbText,
            fileBytes: dbFile,
            totalBytes: dbText + dbFile,
          };

          const r2Details: StorageDetails = {
            textBytes: r2Text,
            fileBytes: r2File,
            totalBytes: r2Text + r2File,
          };

          const effectiveTotal = tier === 'free'
            ? local.totalBytes
            : (serverSources.r2Bytes + serverSources.databaseBytes) || local.totalBytes;

          set({
            usedBytes: effectiveTotal,
            limitBytes,
            fileCount: (data.fileCount ?? 0) + local.fileCount,
            breakdown: {
              docs: serverBreakdown.docs ?? 0,
              images: serverBreakdown.images ?? 0,
              audio: serverBreakdown.audio ?? 0,
              database: serverBreakdown.database ?? 0,
              other: serverBreakdown.other ?? 0,
              chat: local.chatTextBytes + local.chatFileBytes + (serverBreakdown.chat ?? 0),
              automations: local.otherTextBytes + (serverBreakdown.automations ?? 0),
            },
            sources: {
              r2Bytes: serverSources.r2Bytes ?? 0,
              databaseBytes: serverSources.databaseBytes ?? 0,
              localBytes: local.totalBytes,
              isR2Available: serverSources.isR2Available ?? true,
              localTextBytes: local.textBytes,
              localFileBytes: local.fileBytes,
              dbTextBytes: dbText,
              dbFileBytes: dbFile,
              r2TextBytes: r2Text,
              r2FileBytes: r2File,
            },
            supabaseDetails,
            r2Details,
            lastSyncedAt: now,
            isSyncing: false,
          });
        } catch (e) {
          console.warn('[StorageStore] Sync error:', e);
          set({ isSyncing: false });
        }
      },

      getFormattedUsage: () => {
        const { usedBytes } = get();
        const limitBytes = get().getEffectiveLimit();
        const tier = useAuthStore.getState().tier;
        const percentage = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
        return {
          usedFormatted: formatStorageBytes(usedBytes),
          limitFormatted: formatStorageBytes(limitBytes),
          percentage,
          isCloud: isCloudTier(tier),
          isStarter: tier === 'starter',
          isPro: tier === 'pro',
          isEnterprise: tier === 'enterprise',
        };
      },

      migrateCloudToLocalAndPurge: async (accessToken: string) => {
        if (!accessToken || get().isMigratingCloudToLocal) {
          return { success: false, count: 0 };
        }

        set({ isMigratingCloudToLocal: true });
        try {
          const { DatabaseService } = await import('../services/databaseService');
          const result = await DatabaseService.migrateAndPurgeCloud(accessToken, 'merge');

          // Refresh local measurement
          get().refreshLocalUsage();

          // Reset cloud sources
          const state = get();
          set({
            isMigratingCloudToLocal: false,
            isGracePeriodDismissed: true,
            sources: {
              ...state.sources,
              databaseBytes: 0,
              dbTextBytes: 0,
              dbFileBytes: 0,
            },
            supabaseDetails: EMPTY_DETAILS,
          });

          // Reload folders into memory
          const { useProjectStore } = await import('@/features/chat/store/useProjectStore');
          useProjectStore.getState().loadLocalFolders();

          const totalCount =
            (result.migration.sessionsCount || 0) +
            (result.migration.messagesCount || 0) +
            (result.migration.foldersCount || 0);

          return { success: true, count: totalCount };
        } catch (err) {
          console.error('[StorageStore] Migration error:', err);
          set({ isMigratingCloudToLocal: false });
          return { success: false, count: 0 };
        }
      },
    }),
    {
      name: 'anticeil-storage-quota',
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          setTimeout(() => {
            state.refreshLocalUsage();
          }, 100);
        }
      },
    }
  )
);
