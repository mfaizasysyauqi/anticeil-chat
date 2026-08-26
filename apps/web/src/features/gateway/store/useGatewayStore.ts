'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProviderCategory, ProviderConnection } from '../providers/types';

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

export interface CustomCompatibleEndpoint {
  id: string;
  name: string;
  type: 'openai' | 'anthropic';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  createdAt: number;
}

interface GatewayState {
  apiKeys: GatewayApiKey[];
  requestLogs: GatewayRequestLog[];
  isServerRunning: boolean;
  activePort: number;

  // Provider Hub State
  providerConnections: Record<string, ProviderConnection>;
  customEndpoints: CustomCompatibleEndpoint[];
  activeCategory: ProviderCategory | 'all';
  searchQuery: string;

  // Actions
  generateApiKey: (name?: string) => GatewayApiKey;
  revokeApiKey: (id: string) => void;
  toggleApiKey: (id: string) => void;
  addRequestLog: (log: GatewayRequestLog) => void;
  clearRequestLogs: () => void;

  // Provider Connection Actions
  setProviderConnection: (providerId: string, connection: Partial<ProviderConnection>) => void;
  toggleProvider: (providerId: string) => void;
  disconnectProvider: (providerId: string) => void;
  setActiveCategory: (cat: ProviderCategory | 'all') => void;
  setSearchQuery: (query: string) => void;

  // Custom Endpoint Actions
  addCustomEndpoint: (endpoint: Omit<CustomCompatibleEndpoint, 'id' | 'createdAt'>) => void;
  removeCustomEndpoint: (id: string) => void;
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

      // Initial Provider Hub State
      providerConnections: {
        pollinations: { providerId: 'pollinations', isEnabled: true, testStatus: 'success' },
        'duckduckgo-web': { providerId: 'duckduckgo-web', isEnabled: true, testStatus: 'success' },
        puter: { providerId: 'puter', isEnabled: true, testStatus: 'success' },
        'jina-reader': { providerId: 'jina-reader', isEnabled: true, testStatus: 'success' },
        'ollama-local': { providerId: 'ollama-local', isEnabled: true, baseUrl: 'http://localhost:11434' },
      },
      customEndpoints: [],
      activeCategory: 'all',
      searchQuery: '',

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

      // Provider Connections
      setProviderConnection: (providerId, partial) => {
        set((state) => {
          const current = state.providerConnections[providerId] || {
            providerId,
            isEnabled: true,
          };
          return {
            providerConnections: {
              ...state.providerConnections,
              [providerId]: {
                ...current,
                ...partial,
                connectedAt: Date.now(),
                isEnabled: true,
              },
            },
          };
        });
      },

      toggleProvider: (providerId) => {
        set((state) => {
          const current = state.providerConnections[providerId];
          if (!current) {
            return {
              providerConnections: {
                ...state.providerConnections,
                [providerId]: { providerId, isEnabled: true, connectedAt: Date.now() },
              },
            };
          }
          return {
            providerConnections: {
              ...state.providerConnections,
              [providerId]: { ...current, isEnabled: !current.isEnabled },
            },
          };
        });
      },

      disconnectProvider: (providerId) => {
        set((state) => {
          const next = { ...state.providerConnections };
          delete next[providerId];
          return { providerConnections: next };
        });
      },

      setActiveCategory: (activeCategory) => set({ activeCategory }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      // Custom Endpoints
      addCustomEndpoint: (endpoint) => {
        const newEndpoint: CustomCompatibleEndpoint = {
          ...endpoint,
          id: `custom_${Date.now().toString(36)}`,
          createdAt: Date.now(),
        };
        set((state) => ({
          customEndpoints: [newEndpoint, ...state.customEndpoints],
        }));
      },

      removeCustomEndpoint: (id) => {
        set((state) => ({
          customEndpoints: state.customEndpoints.filter((e) => e.id !== id),
        }));
      },
    }),
    {
      name: 'anticeil_gateway_providers_v2',
    }
  )
);
