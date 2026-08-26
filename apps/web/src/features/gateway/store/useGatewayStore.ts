'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GatewayApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: number;
  lastUsedAt?: number;
  requestCount: number;
  isActive: boolean;
}

export interface GatewayRequestLog {
  id: string;
  timestamp: number;
  model: string;
  provider: string;
  status: 'success' | 'failed';
  durationMs: number;
  promptTokens?: number;
  completionTokens?: number;
  clientIp?: string;
  userAgent?: string;
}

interface GatewayState {
  apiKeys: GatewayApiKey[];
  requestLogs: GatewayRequestLog[];
  isServerRunning: boolean;
  activePort: number;

  // Actions
  generateApiKey: (name?: string) => GatewayApiKey;
  revokeApiKey: (id: string) => void;
  toggleApiKey: (id: string) => void;
  addRequestLog: (log: GatewayRequestLog) => void;
  clearRequestLogs: () => void;
}

function generateRandomKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `sk-anticeil-${token}`;
}

export const useGatewayStore = create<GatewayState>()(
  persist(
    (set, get) => ({
      apiKeys: [
        {
          id: 'default_key',
          name: 'Primary Local Key (Cursor & Cline)',
          key: 'sk-anticeil-live-local-universal-key',
          createdAt: Date.now(),
          requestCount: 0,
          isActive: true,
        },
      ],
      requestLogs: [],
      isServerRunning: true,
      activePort: 3000,

      generateApiKey: (name) => {
        const newKey: GatewayApiKey = {
          id: `key_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          name: name?.trim() || `Gateway Key #${get().apiKeys.length + 1}`,
          key: generateRandomKey(),
          createdAt: Date.now(),
          requestCount: 0,
          isActive: true,
        };

        set((state) => ({
          apiKeys: [newKey, ...state.apiKeys],
        }));

        return newKey;
      },

      revokeApiKey: (id) => {
        set((state) => ({
          apiKeys: state.apiKeys.filter((k) => k.id !== id),
        }));
      },

      toggleApiKey: (id) => {
        set((state) => ({
          apiKeys: state.apiKeys.map((k) =>
            k.id === id ? { ...k, isActive: !k.isActive } : k
          ),
        }));
      },

      addRequestLog: (log) => {
        set((state) => ({
          requestLogs: [log, ...state.requestLogs].slice(0, 100),
          apiKeys: state.apiKeys.map((k) => ({
            ...k,
            requestCount: k.requestCount + 1,
            lastUsedAt: Date.now(),
          })),
        }));
      },

      clearRequestLogs: () => {
        set({ requestLogs: [] });
      },
    }),
    {
      name: 'anticeil_gateway_storage',
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        requestLogs: state.requestLogs.slice(0, 30),
      }),
    }
  )
);
