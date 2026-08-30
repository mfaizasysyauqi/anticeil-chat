'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  LLMProviderId,
  LLMModel,
  ApiKeysState,
  Language,
  DEFAULT_PROVIDER_ID,
  DEFAULT_MODEL_ID,
  PROVIDER_DEFINITIONS,
  PROVIDER_MODELS,
  fetchProviderModels,
  testProviderConnection,
  ProviderConnectionTestResult,
} from '@anticeil/core';

import { FREE_GROQ_KEYS, FREE_GEMINI_KEYS } from '../../chat/data/byokApi';

interface SettingsState {
  apiKeys: ApiKeysState;
  dynamicModels: Partial<Record<LLMProviderId, LLMModel[]>>;
  isLoadingModels: Partial<Record<LLMProviderId, boolean>>;
  testConnectionStatus: Partial<Record<LLMProviderId, { testing: boolean; result?: ProviderConnectionTestResult }>>;
  activeProviderId: LLMProviderId;
  activeModelId: string;
  theme: 'dark' | 'light';
  language: Language;
  isSettingsOpen: boolean;
  activeSettingsTab: 'keys' | 'appearance' | 'backup';
  customSupabaseUrl: string;
  customSupabaseAnonKey: string;
  customR2AccountId: string;
  customR2BucketName: string;
  customR2AccessKeyId: string;
  customR2SecretAccessKey: string;
  customR2PublicUrl: string;
  activeMediaStorageDriver: 'supabase' | 'r2';
  
  // Actions
  setSettingsOpen: (open: boolean) => void;
  setSettingsTab: (tab: 'keys' | 'appearance' | 'backup') => void;
  openSettingsTab: (tab: 'keys' | 'appearance' | 'backup') => void;
  setApiKey: (providerId: LLMProviderId, apiKey: string, baseUrl?: string) => void;
  setCustomSupabaseConfig: (url: string, anonKey: string) => void;
  setCustomR2Config: (config: { accountId: string; bucketName: string; accessKeyId: string; secretAccessKey: string; publicUrl: string }) => void;
  setActiveMediaStorageDriver: (driver: 'supabase' | 'r2') => void;
  toggleProvider: (providerId: LLMProviderId, isEnabled: boolean) => void;
  setActiveProviderAndModel: (providerId: LLMProviderId, modelId: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLanguage: (lang: Language) => void;
  hasConfiguredKey: (providerId: LLMProviderId) => boolean;
  refreshModels: (providerId?: LLMProviderId) => Promise<void>;
  getModelsForProvider: (providerId: LLMProviderId) => LLMModel[];
  testConnection: (providerId: LLMProviderId) => Promise<void>;
  clearAllKeys: () => void;
  importApiKeys: (imported: Partial<ApiKeysState>) => void;
}

const initialApiKeys: ApiKeysState = {
  anticeil: { apiKey: '', isEnabled: true },
  openai: { apiKey: '', isEnabled: true },
  anthropic: { apiKey: '', isEnabled: true },
  gemini: { apiKey: '', isEnabled: true },
  deepseek: { apiKey: '', isEnabled: true },
  groq: { apiKey: '', isEnabled: true },
  openrouter: { apiKey: '', baseUrl: 'https://openrouter.ai/api/v1', isEnabled: true },
  together: { apiKey: '', baseUrl: 'https://api.together.xyz/v1', isEnabled: true },
  fireworks: { apiKey: '', baseUrl: 'https://api.fireworks.ai/inference/v1', isEnabled: true },
  mistral: { apiKey: '', baseUrl: 'https://api.mistral.ai/v1', isEnabled: true },
  xai: { apiKey: '', baseUrl: 'https://api.x.ai/v1', isEnabled: true },
  perplexity: { apiKey: '', baseUrl: 'https://api.perplexity.ai', isEnabled: true },
  cohere: { apiKey: '', baseUrl: 'https://api.cohere.com/v1', isEnabled: true },
  ollama: { apiKey: '', baseUrl: 'http://localhost:11434', isEnabled: true },
  elevenlabs: { apiKey: '', baseUrl: 'https://api.elevenlabs.io/v1', isEnabled: true },
  azure: { apiKey: '', baseUrl: 'https://api.cognitive.microsoft.com/sts/v1.0', isEnabled: true },
  deepgram: { apiKey: '', baseUrl: 'https://api.deepgram.com/v1', isEnabled: true },
  assemblyai: { apiKey: '', baseUrl: 'https://api.assemblyai.com/v2', isEnabled: true },
  fishaudio: { apiKey: '', baseUrl: 'https://api.fish.audio/v1', isEnabled: true },
  suno: { apiKey: '', baseUrl: 'https://api.suno.ai/v1', isEnabled: true },
  udio: { apiKey: '', baseUrl: 'https://api.udio.com/v1', isEnabled: true },
  stability: { apiKey: '', baseUrl: 'https://api.stability.ai', isEnabled: true },
  fal: { apiKey: '', baseUrl: 'https://queue.fal.run', isEnabled: true },
  recraft: { apiKey: '', baseUrl: 'https://external.api.recraft.ai/v1', isEnabled: true },
  luma: { apiKey: '', baseUrl: 'https://api.lumalabs.ai/dream-machine/v1', isEnabled: true },
  kling: { apiKey: '', baseUrl: 'https://api.klingai.com/v1', isEnabled: true },
  runway: { apiKey: '', baseUrl: 'https://api.dev.runwayml.com/v1', isEnabled: true },
  pika: { apiKey: '', baseUrl: 'https://api.pika.art/v1', isEnabled: true },
  tavily: { apiKey: '', baseUrl: 'https://api.tavily.com', isEnabled: true },
  brave: { apiKey: '', baseUrl: 'https://api.search.brave.com/res/v1', isEnabled: true },
  omniroute: { apiKey: '', baseUrl: 'http://localhost:20128/v1', isEnabled: true },
  custom: { apiKey: '', baseUrl: 'http://localhost:1234/v1', isEnabled: true },
};

function getInitialLanguage(): Language {
  return 'en'; // persist middleware rehydrates the real value after mount
}

function getInitialTheme(): 'dark' | 'light' {
  return 'light'; // persist middleware rehydrates the real value after mount
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKeys: initialApiKeys,
      dynamicModels: {},
      isLoadingModels: {},
      testConnectionStatus: {},
      activeProviderId: DEFAULT_PROVIDER_ID,
      activeModelId: DEFAULT_MODEL_ID,
      theme: getInitialTheme(),
      language: getInitialLanguage(),
      isSettingsOpen: false,
      activeSettingsTab: 'keys',
      customSupabaseUrl: '',
      customSupabaseAnonKey: '',
      customR2AccountId: '',
      customR2BucketName: '',
      customR2AccessKeyId: '',
      customR2SecretAccessKey: '',
      customR2PublicUrl: '',
      activeMediaStorageDriver: 'supabase' as 'supabase' | 'r2',

      setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
      setSettingsTab: (tab) => set({ activeSettingsTab: tab }),
      openSettingsTab: (tab) => set({ activeSettingsTab: tab, isSettingsOpen: true }),

      setActiveMediaStorageDriver: (driver: 'supabase' | 'r2') => set({ activeMediaStorageDriver: driver }),


      setCustomSupabaseConfig: (url: string, anonKey: string) => {
        set({ customSupabaseUrl: url.trim(), customSupabaseAnonKey: anonKey.trim() });
      },


      setCustomR2Config: ({ accountId, bucketName, accessKeyId, secretAccessKey, publicUrl }) => {
        const t = (s: string) => s.trim();
        set({
          customR2AccountId: t(accountId),
          customR2BucketName: t(bucketName),
          customR2AccessKeyId: t(accessKeyId),
          customR2SecretAccessKey: t(secretAccessKey),
          customR2PublicUrl: t(publicUrl),
        });
      },


      setApiKey: (providerId, apiKey, baseUrl) => {
        const trimmedKey = apiKey.trim();
        const trimmedUrl = baseUrl?.trim();

        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [providerId]: {
              ...state.apiKeys[providerId],
              apiKey: trimmedKey,
              baseUrl: trimmedUrl || state.apiKeys[providerId]?.baseUrl,
              isEnabled: true,
            },
          },
        }));

        // Automatically fetch live models when valid key or endpoint is entered
        if (
          trimmedKey.length > 4 ||
          providerId === 'ollama' ||
          providerId === 'omniroute' ||
          providerId === 'custom' ||
          Boolean(trimmedUrl)
        ) {
          get().refreshModels(providerId);
        }
      },

      toggleProvider: (providerId, isEnabled) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [providerId]: {
              ...state.apiKeys[providerId],
              isEnabled,
            },
          },
        })),

      setActiveProviderAndModel: (providerId, modelId) =>
        set({ activeProviderId: providerId, activeModelId: modelId }),

      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
        set({ theme });
      },

      setLanguage: (language) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('anticeil_lang', language);
            document.documentElement.setAttribute('lang', language);
          } catch {}
        }
        set({ language });
      },

      hasConfiguredKey: (providerId) => {
        // Built-in free tier key available only for Anticeil
        if (providerId === 'anticeil') return true;

        const config = get().apiKeys[providerId];
        const apiKey = config?.apiKey?.trim() || '';
        const liveModels = get().dynamicModels[providerId];
        const hasLiveModels = Boolean(liveModels && liveModels.length > 0);

        // For local / gateway / custom providers (ollama, omniroute, custom):
        if (providerId === 'ollama' || providerId === 'omniroute' || providerId === 'custom') {
          // Ready only if local server actually responded with live models OR user provided custom API key
          return hasLiveModels || apiKey.length >= 4;
        }

        // For cloud providers:
        return apiKey.length >= 4;
      },

      refreshModels: async (targetProviderId) => {
        const state = get();
        const providersToFetch = targetProviderId
          ? [targetProviderId]
          : (Object.keys(state.apiKeys) as LLMProviderId[]);

        for (const providerId of providersToFetch) {
          const keyConfig = state.apiKeys[providerId];
          let baseUrl = keyConfig?.baseUrl;
          let apiKey = keyConfig?.apiKey || '';

          // Only Anticeil uses internal free key pool
          if (providerId === 'anticeil') {
            apiKey = FREE_GEMINI_KEYS[0] || '';
          }

          // Ensure OmniRoute always has its default port 20128 if unset
          if (providerId === 'omniroute' && (!baseUrl || baseUrl.includes('openrouter.ai'))) {
            baseUrl = 'http://localhost:20128/v1';
          }

          // Ensure Custom Endpoint never accidentally points to openrouter
          if (providerId === 'custom' && baseUrl?.includes('openrouter.ai')) {
            baseUrl = 'http://localhost:1234/v1';
          }

          const providerDef = PROVIDER_DEFINITIONS.find((p) => p.id === providerId);
          // If provider requires an API key and user hasn't provided one, clear dynamic models and skip
          if (
            providerDef?.requiresApiKey &&
            providerId !== 'custom' &&
            providerId !== 'omniroute' &&
            (!apiKey || apiKey.length < 4)
          ) {
            set((s) => ({
              dynamicModels: { ...s.dynamicModels, [providerId]: undefined },
            }));
            continue;
          }

          set((s) => ({
            isLoadingModels: { ...s.isLoadingModels, [providerId]: true },
          }));

          try {
            let fetched: LLMModel[] = [];
            try {
              const res = await fetch('/api/models/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ providerId, apiKey, baseUrl }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.models && Array.isArray(data.models) && data.models.length > 0) {
                  fetched = data.models;
                }
              }
            } catch {
              fetched = await fetchProviderModels(providerId, apiKey, baseUrl);
            }

            if (fetched && fetched.length > 0) {
              set((s) => ({
                dynamicModels: { ...s.dynamicModels, [providerId]: fetched },
              }));
            } else {
              set((s) => ({
                dynamicModels: { ...s.dynamicModels, [providerId]: undefined },
              }));
            }
          } catch (err) {
            set((s) => ({
              dynamicModels: { ...s.dynamicModels, [providerId]: undefined },
            }));
          } finally {
            set((s) => ({
              isLoadingModels: { ...s.isLoadingModels, [providerId]: false },
            }));
          }
        }
      },

      getModelsForProvider: (providerId) => {
        const state = get();
        const list = (state.dynamicModels[providerId] && state.dynamicModels[providerId]!.length > 0)
          ? state.dynamicModels[providerId]!
          : (PROVIDER_MODELS[providerId] || []);

        const seen = new Set<string>();
        return list.filter((m) => {
          if (!m || !m.id || seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
      },

      testConnection: async (providerId) => {
        const { apiKeys } = get();
        const apiKey = apiKeys[providerId]?.apiKey || '';
        let baseUrl = apiKeys[providerId]?.baseUrl;

        if (providerId === 'omniroute' && (!baseUrl || baseUrl.includes('openrouter.ai'))) {
          baseUrl = 'http://localhost:20128/v1';
        } else if (providerId === 'custom' && baseUrl?.includes('openrouter.ai')) {
          baseUrl = 'http://localhost:1234/v1';
        }

        set((s) => ({
          testConnectionStatus: {
            ...s.testConnectionStatus,
            [providerId]: { testing: true, result: undefined },
          },
        }));
        try {
          let result: ProviderConnectionTestResult;
          try {
            const res = await fetch('/api/models/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ providerId, apiKey, baseUrl }),
            });
            result = await res.json();
          } catch {
            result = await testProviderConnection(providerId, apiKey, baseUrl);
          }

          set((s) => ({
            testConnectionStatus: {
              ...s.testConnectionStatus,
              [providerId]: { testing: false, result },
            },
          }));
          // On success, populate dynamic models from the test result
          if (result.success && result.models && result.models.length > 0) {
            set((s) => ({
              dynamicModels: { ...s.dynamicModels, [providerId]: result.models },
            }));
          }
        } catch {
          set((s) => ({
            testConnectionStatus: {
              ...s.testConnectionStatus,
              [providerId]: { testing: false, result: { success: false, message: 'Gagal terhubung' } },
            },
          }));
        }
      },

      clearAllKeys: () => {
        set({ apiKeys: initialApiKeys, dynamicModels: {}, testConnectionStatus: {} });
      },

      importApiKeys: (imported) => {
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            ...imported,
          },
        }));
        get().refreshModels();
      },
    }),
    {
      name: 'anticeil_settings_storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language && typeof document !== 'undefined') {
          document.documentElement.setAttribute('lang', state.language);
          try {
            localStorage.setItem('anticeil_lang', state.language);
          } catch {}
        }
        if (state?.theme && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
        // Auto-migrate persisted localStorage settings
        if (state?.apiKeys) {
          let needsUpdate = false;
          const updatedKeys = { ...state.apiKeys };

          if (!updatedKeys.omniroute || !updatedKeys.omniroute.baseUrl) {
            updatedKeys.omniroute = { apiKey: '', baseUrl: 'http://localhost:20128/v1', isEnabled: true };
            needsUpdate = true;
          }
          if (updatedKeys.custom?.baseUrl?.includes('openrouter.ai')) {
            updatedKeys.custom = { apiKey: '', baseUrl: 'http://localhost:1234/v1', isEnabled: true };
            needsUpdate = true;
          }
          if (needsUpdate) {
            useSettingsStore.setState({ apiKeys: updatedKeys });
          }
        }

        // Auto-fetch live models for configured providers on startup
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            const current = useSettingsStore.getState();
            if (current.refreshModels) {
              current.refreshModels('anticeil');
              current.refreshModels('omniroute');
              if (current.apiKeys) {
                for (const [pId, cfg] of Object.entries(current.apiKeys)) {
                  if (pId === 'omniroute' || (cfg?.apiKey && cfg.apiKey.length > 5)) {
                    current.refreshModels(pId as LLMProviderId);
                  }
                }
              }
            }
          }, 300);
        }
      },
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        dynamicModels: state.dynamicModels,
        activeProviderId: state.activeProviderId,
        activeModelId: state.activeModelId,
        theme: state.theme,
        language: state.language,
        customSupabaseUrl: state.customSupabaseUrl,
        customSupabaseAnonKey: state.customSupabaseAnonKey,
        customR2AccountId: state.customR2AccountId,
        customR2BucketName: state.customR2BucketName,
        customR2AccessKeyId: state.customR2AccessKeyId,
        customR2SecretAccessKey: state.customR2SecretAccessKey,
        customR2PublicUrl: state.customR2PublicUrl,
        activeMediaStorageDriver: state.activeMediaStorageDriver,
      }),
    }
  )
);

// Cross-tab / cross-page synchronized updates
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'anticeil_settings_storage' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.state) {
          const newLang = parsed.state.language;
          const newTheme = parsed.state.theme;
          if (newLang === 'en' || newLang === 'id') {
            document.documentElement.setAttribute('lang', newLang);
          }
          if (newTheme === 'dark' || newTheme === 'light') {
            document.documentElement.setAttribute('data-theme', newTheme);
          }
          useSettingsStore.setState((prev) => ({
            ...prev,
            language: (newLang === 'en' || newLang === 'id') ? newLang : prev.language,
            theme: (newTheme === 'dark' || newTheme === 'light') ? newTheme : prev.theme,
            apiKeys: parsed.state.apiKeys || prev.apiKeys,
            activeProviderId: parsed.state.activeProviderId || prev.activeProviderId,
            activeModelId: parsed.state.activeModelId || prev.activeModelId,
          }));
        }
      } catch {}
    } else if (event.key === 'anticeil_lang' && event.newValue) {
      const newLang = event.newValue as Language;
      if (newLang === 'en' || newLang === 'id') {
        document.documentElement.setAttribute('lang', newLang);
        useSettingsStore.setState({ language: newLang });
      }
    }
  });
}
