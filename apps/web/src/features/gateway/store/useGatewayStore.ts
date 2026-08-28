'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProviderCategory, ProviderConnection } from '../providers/types';

export type GatewaySubNav =
  | 'home'
  | 'providers'
  | 'api-keys'
  | 'playground'
  | 'quota'
  | 'endpoint'
  | 'combos'
  | 'compressor'
  | 'traffic'
  | 'discovery';

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
  status: 'success' | 'error' | 'throttled';
  statusCode: number;
  durationMs: number;
  promptTokens: number;
  completionTokens: number;
  failoverFrom?: string;
  compressedSavedTokens?: number;
}

export interface ModelCombo {
  id: string;
  name: string;
  description: string;
  chain: string[]; // e.g. ['groq/deepseek-r1', 'gemini-2.0-flash', 'anthropic/claude-3-7-sonnet']
  isActive: boolean;
}

export interface CompressionSettings {
  mode: 'off' | 'mild' | 'smart' | 'aggressive' | 'extreme';
  stripWhitespace: boolean;
  dedupHistory: boolean;
  summarizeOldTurns: boolean;
}

export interface GatewayState {
  // Navigation
  activeSubNav: GatewaySubNav;
  setActiveSubNav: (nav: GatewaySubNav) => void;

  // Primary API Keys
  apiKeys: GatewayApiKey[];
  requestLogs: GatewayRequestLog[];
  isServerRunning: boolean;
  activePort: number;

  // Provider Hub Connections (Keys, Custom URLs, OAuth, Cookie)
  providerConnections: Record<string, ProviderConnection>;
  activeCategory: ProviderCategory | 'all';
  searchQuery: string;

  // Combos & Failover
  combos: ModelCombo[];
  addCombo: (combo: Omit<ModelCombo, 'id'>) => void;
  removeCombo: (id: string) => void;
  toggleCombo: (id: string) => void;

  // Context Compression
  compression: CompressionSettings;
  setCompressionMode: (mode: CompressionSettings['mode']) => void;
  updateCompression: (settings: Partial<CompressionSettings>) => void;

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

  // Backup & Restore
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
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
      activeSubNav: 'home',
      setActiveSubNav: (activeSubNav) => set({ activeSubNav }),

      apiKeys: [
        {
          id: 'default_key',
          name: 'Primary Universal Key (Cursor & IDEs)',
          key: 'sk-anticeil-live-local-universal-key',
          createdAt: Date.now(),
          requestCount: 14,
          isActive: true,
        },
      ],
      requestLogs: [
        {
          id: 'log-1',
          timestamp: Date.now() - 120000,
          model: 'groq/compound',
          provider: 'groq',
          status: 'success',
          statusCode: 200,
          durationMs: 245,
          promptTokens: 258,
          completionTokens: 117,
        },
        {
          id: 'log-2',
          timestamp: Date.now() - 480000,
          model: 'gemini-2.0-flash',
          provider: 'gemini',
          status: 'success',
          statusCode: 200,
          durationMs: 310,
          promptTokens: 142,
          completionTokens: 88,
        },
      ],
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
      activeCategory: 'all',
      searchQuery: '',

      // Initial Combos & Failover Chains
      combos: [
        {
          id: 'combo-fast-free',
          name: '⚡ Ultra Fast Free Tier Cascade',
          description: 'Coba Groq LPU pertama; jika limit (429), otomatis beralih ke Gemini Flash & Cerebras dalam 50ms.',
          chain: ['groq/compound', 'gemini/gemini-2.0-flash', 'cerebras/llama-3.3-70b'],
          isActive: true,
        },
        {
          id: 'combo-reasoning',
          name: '🧠 Deep Reasoning & Math Fallback',
          description: 'Rute penalaran berat: DeepSeek-R1 (SambaNova) -> Gemini Thinking -> Claude 3.7 Sonnet.',
          chain: ['sambanova/DeepSeek-R1', 'gemini/gemini-2.0-flash-thinking', 'anthropic/claude-3-7-sonnet'],
          isActive: true,
        },
        {
          id: 'combo-coding',
          name: '💻 Coding Specialist Cascade',
          description: 'Rute khusus koding IDE: Qwen 2.5 Coder -> Claude 3.5 Sonnet -> GPT-4o.',
          chain: ['alibaba/qwen2.5-coder-32b-instruct', 'copilot/claude-3-5-sonnet', 'openai/gpt-4o'],
          isActive: true,
        },
      ],

      addCombo: (combo) => {
        const newCombo: ModelCombo = {
          ...combo,
          id: `combo_${Date.now().toString(36)}`,
        };
        set((state) => ({ combos: [newCombo, ...state.combos] }));
      },

      removeCombo: (id) => {
        set((state) => ({ combos: state.combos.filter((c) => c.id !== id) }));
      },

      toggleCombo: (id) => {
        set((state) => ({
          combos: state.combos.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
        }));
      },

      // Context Compression Settings
      compression: {
        mode: 'smart',
        stripWhitespace: true,
        dedupHistory: true,
        summarizeOldTurns: true,
      },

      setCompressionMode: (mode) => {
        set((state) => ({
          compression: { ...state.compression, mode },
        }));
      },

      updateCompression: (settings) => {
        set((state) => ({
          compression: { ...state.compression, ...settings },
        }));
      },

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

      exportConfig: () => {
        const state = get();
        const exportData = {
          version: 3,
          exportedAt: Date.now(),
          apiKeys: state.apiKeys,
          providerConnections: state.providerConnections,
          combos: state.combos,
          compression: state.compression,
        };
        return JSON.stringify(exportData, null, 2);
      },

      importConfig: (json: string) => {
        try {
          const data = JSON.parse(json);
          if (data && typeof data === 'object') {
            set((state) => ({
              apiKeys: Array.isArray(data.apiKeys) ? data.apiKeys : state.apiKeys,
              providerConnections: data.providerConnections || state.providerConnections,
              combos: Array.isArray(data.combos) ? data.combos : state.combos,
              compression: data.compression || state.compression,
            }));
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'anticeil_gateway_providers_v3',
    }
  )
);