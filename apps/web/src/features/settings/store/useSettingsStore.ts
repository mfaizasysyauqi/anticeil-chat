'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  LLMProviderId,
  LLMModel,
  ApiKeysState,
  ReasoningEffort,
  Language,
  DEFAULT_PROVIDER_ID,
  DEFAULT_MODEL_ID,
  PROVIDER_DEFINITIONS,
  PROVIDER_MODELS,
  fetchProviderModels,
  testProviderConnection,
  ProviderConnectionTestResult,
  isModelActiveAndAvailable,
} from '@anticeil/core';

import { FREE_GEMINI_KEYS, FREE_GROQ_KEYS } from '../../chat/data/freeKeys';
import { useAuthStore } from '../../auth/store/useAuthStore';

export interface SetApiKeyResult {
  success: boolean;
  reason?: 'FREE_LIMIT_EXCEEDED';
  activeProviderId?: LLMProviderId;
}

export type ThemeMode = 'system' | 'dark' | 'light';

export function getEffectiveTheme(theme: ThemeMode): 'dark' | 'light' {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }
  return theme;
}

interface SettingsState {
  apiKeys: ApiKeysState;
  dynamicModels: Partial<Record<LLMProviderId, LLMModel[]>>;
  isLoadingModels: Partial<Record<LLMProviderId, boolean>>;
  testConnectionStatus: Partial<Record<LLMProviderId, { testing: boolean; result?: ProviderConnectionTestResult }>>;
  activeProviderId: LLMProviderId;
  activeModelId: string;
  theme: ThemeMode;
  language: Language;
  isSettingsOpen: boolean;
  isModelSelectorOpen: boolean;
  activeSettingsTab: 'appearance' | 'backup';
  customSupabaseUrl: string;
  customSupabaseAnonKey: string;
  customR2AccountId: string;
  customR2BucketName: string;
  customR2AccessKeyId: string;
  customR2SecretAccessKey: string;
  customR2PublicUrl: string;
  activeMediaStorageDriver: 'supabase' | 'r2';
  disabledModelIds: string[];
  
  // Actions
  markModelAsUnavailable: (modelId: string) => void;
  setSettingsOpen: (open: boolean) => void;
  setIsModelSelectorOpen: (open: boolean) => void;
  setSettingsTab: (tab: 'appearance' | 'backup') => void;
  openSettingsTab: (tab: 'appearance' | 'backup') => void;
  getActiveByokProviders: () => LLMProviderId[];
  setApiKey: (providerId: LLMProviderId, apiKey: string, baseUrl?: string, forceReplace?: boolean) => SetApiKeyResult;
  setCustomHeaders: (providerId: LLMProviderId, headers: Record<string, string>) => void;
  setReasoningEffort: (providerId: LLMProviderId, effort: ReasoningEffort) => void;
  clearApiKey: (providerId: LLMProviderId) => void;
  setCustomSupabaseConfig: (url: string, anonKey: string) => void;
  setCustomR2Config: (config: { accountId: string; bucketName: string; accessKeyId: string; secretAccessKey: string; publicUrl: string }) => void;
  setActiveMediaStorageDriver: (driver: 'supabase' | 'r2') => void;
  toggleProvider: (providerId: LLMProviderId, isEnabled: boolean) => void;
  setActiveProviderAndModel: (providerId: LLMProviderId, modelId: string) => void;
  setTheme: (theme: ThemeMode) => void;
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
  'openai-compatible': { apiKey: '', baseUrl: 'http://localhost:20128/v1', isEnabled: true, reasoningEffort: 'none' },
  lmstudio: { apiKey: '', baseUrl: 'http://localhost:1234/v1', isEnabled: true },
  litellm: { apiKey: '', baseUrl: 'http://localhost:4000/v1', isEnabled: true },
  baseten: { apiKey: '', baseUrl: 'https://bridge.baseten.co/v1', isEnabled: true },
  cerebras: { apiKey: '', baseUrl: 'https://api.cerebras.ai/v1', isEnabled: true },
  huggingface: { apiKey: '', baseUrl: 'https://api-inference.huggingface.co/v1', isEnabled: true },
  minimax: { apiKey: '', baseUrl: 'https://api.minimax.chat/v1', isEnabled: true, reasoningEffort: 'none' },
  moonshot: { apiKey: '', baseUrl: 'https://api.moonshot.cn/v1', isEnabled: true },
  zai: { apiKey: '', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', isEnabled: true },
  qwen: { apiKey: '', baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1', isEnabled: true },
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
  firecrawl: { apiKey: '', baseUrl: 'https://api.firecrawl.dev/v1', isEnabled: true },
  brave: { apiKey: '', baseUrl: 'https://api.search.brave.com/res/v1', isEnabled: true },
  omniroute: { apiKey: '', baseUrl: 'http://localhost:20128/v1', isEnabled: true },
  custom: { apiKey: '', baseUrl: 'http://localhost:1234/v1', isEnabled: true },
};

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem('anticeil_lang');
    if (stored === 'id' || stored === 'en') return stored;
    return 'en';
  } catch {
    return 'en';
  }
}

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem('anticeil_settings_storage');
    const theme = stored ? JSON.parse(stored).state?.theme : null;
    if (theme === 'light' || theme === 'dark' || theme === 'system') return theme;
    return 'system';
  } catch {
    return 'system';
  }
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
      isModelSelectorOpen: false,
      activeSettingsTab: 'appearance',
      customSupabaseUrl: '',
      customSupabaseAnonKey: '',
      customR2AccountId: '',
      customR2BucketName: '',
      customR2AccessKeyId: '',
      customR2SecretAccessKey: '',
      customR2PublicUrl: '',
      activeMediaStorageDriver: 'supabase' as 'supabase' | 'r2',
      disabledModelIds: [],

      markModelAsUnavailable: (modelId: string) => {
        if (!modelId) return;
        const clean = modelId.trim().toLowerCase().replace(/^models\//, '');
        const current = get().disabledModelIds || [];
        if (!current.includes(clean)) {
          const nextDisabled = [...current, clean];
          const shouldResetActive =
            get().activeModelId.toLowerCase().replace(/^models\//, '') === clean;
          set({
            disabledModelIds: nextDisabled,
            ...(shouldResetActive ? { activeModelId: DEFAULT_MODEL_ID } : {}),
          });
        }
      },

      setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
      setIsModelSelectorOpen: (open: boolean) => set({ isModelSelectorOpen: open }),
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


      getActiveByokProviders: () => {
        const { apiKeys } = get();
        return (Object.keys(apiKeys) as LLMProviderId[]).filter(
          (p) => p !== 'anticeil' && Boolean(apiKeys[p]?.apiKey?.trim())
        );
      },

      setApiKey: (providerId, apiKey, baseUrl, forceReplace = false) => {
        const trimmedKey = apiKey.trim();
        const trimmedUrl = baseUrl?.trim();

        // If user is attempting to save a non-empty key for a BYOK provider
        if (trimmedKey && providerId !== 'anticeil') {
          const tier = useAuthStore.getState().tier;
          if (tier === 'free') {
            const activeByok = get().getActiveByokProviders();
            const otherActive = activeByok.find((p) => p !== providerId);
            if (otherActive && !forceReplace) {
              return {
                success: false,
                reason: 'FREE_LIMIT_EXCEEDED',
                activeProviderId: otherActive,
              };
            }
            // If forceReplace is true, remove the other active key first
            if (otherActive && forceReplace) {
              set((state) => ({
                apiKeys: {
                  ...state.apiKeys,
                  [otherActive]: {
                    ...state.apiKeys[otherActive],
                    apiKey: '',
                  },
                },
                dynamicModels: {
                  ...state.dynamicModels,
                  [otherActive]: undefined,
                },
              }));
            }
          }
        }

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
          providerId === 'openai-compatible' ||
          providerId === 'lmstudio' ||
          providerId === 'litellm' ||
          Boolean(trimmedUrl)
        ) {
          get().refreshModels(providerId);
        }

        return { success: true };
      },

      setCustomHeaders: (providerId, headers) => {
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [providerId]: {
              ...state.apiKeys[providerId],
              customHeaders: headers,
            },
          },
        }));
      },

      setReasoningEffort: (providerId, effort) => {
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [providerId]: {
              ...state.apiKeys[providerId],
              reasoningEffort: effort,
            },
          },
        }));
      },

      clearApiKey: (providerId) => {
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [providerId]: {
              ...state.apiKeys[providerId],
              apiKey: '',
            },
          },
          dynamicModels: {
            ...state.dynamicModels,
            [providerId]: undefined,
          },
        }));
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
          const effective = getEffectiveTheme(theme);
          document.documentElement.setAttribute('data-theme', effective);
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

        // Local & OpenAI-compatible providers may work without key if base URL is supplied
        if (
          providerId === 'openai-compatible' ||
          providerId === 'lmstudio' ||
          providerId === 'litellm' ||
          providerId === 'ollama' ||
          providerId === 'omniroute' ||
          providerId === 'custom'
        ) {
          return true;
        }

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
          const customHeaders = keyConfig?.customHeaders;

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
            providerId !== 'openai-compatible' &&
            providerId !== 'lmstudio' &&
            providerId !== 'litellm' &&
            (!apiKey || apiKey.length < 4)
          ) {
            if (get().dynamicModels[providerId] !== undefined) {
              set((s) => ({
                dynamicModels: { ...s.dynamicModels, [providerId]: undefined },
              }));
            }
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
                body: JSON.stringify({ providerId, apiKey, baseUrl, customHeaders }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.models && Array.isArray(data.models) && data.models.length > 0) {
                  fetched = data.models;
                }
              }
            } catch {
              fetched = await fetchProviderModels(providerId, apiKey, baseUrl, customHeaders);
            }

            if (fetched && fetched.length > 0) {
              set((s) => ({
                dynamicModels: { ...s.dynamicModels, [providerId]: fetched },
              }));
            } else if (get().dynamicModels[providerId] !== undefined) {
              set((s) => ({
                dynamicModels: { ...s.dynamicModels, [providerId]: undefined },
              }));
            }
          } catch (err) {
            if (get().dynamicModels[providerId] !== undefined) {
              set((s) => ({
                dynamicModels: { ...s.dynamicModels, [providerId]: undefined },
              }));
            }
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
        const disabled = new Set((state.disabledModelIds || []).map((id) => id.toLowerCase()));
        return list.filter((m) => {
          if (!m || !m.id || seen.has(m.id)) return false;
          seen.add(m.id);
          const clean = m.id.toLowerCase().replace(/^models\//, '');
          if (disabled.has(clean)) return false;
          if (!isModelActiveAndAvailable(m)) return false;
          return true;
        });
      },

      testConnection: async (providerId) => {
        const { apiKeys } = get();
        const keyConfig = apiKeys[providerId];
        const apiKey = keyConfig?.apiKey || '';
        let baseUrl = keyConfig?.baseUrl;
        const customHeaders = keyConfig?.customHeaders;

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
              body: JSON.stringify({ providerId, apiKey, baseUrl, customHeaders }),
            });
            result = await res.json();
          } catch {
            result = await testProviderConnection(providerId, apiKey, baseUrl, customHeaders);
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
        if (state?.activeModelId === 'gemini-2.0-flash') {
          useSettingsStore.setState({ activeModelId: 'gemini-3.6-flash' });
        }
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
        disabledModelIds: state.disabledModelIds,
      }),
    }
  )
);

// Cross-tab / cross-page synchronized updates & OS theme listener
if (typeof window !== 'undefined') {
  // Listen to OS theme changes when theme is 'system'
  const mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)');
  const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
    const currentTheme = useSettingsStore.getState().theme;
    if (currentTheme === 'system') {
      document.documentElement.setAttribute('data-theme', e.matches ? 'light' : 'dark');
    }
  };
  if (mediaQuery?.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else if (mediaQuery?.addListener) {
    mediaQuery.addListener(handleSystemThemeChange);
  }

  window.addEventListener('storage', (event) => {
    if (event.key === 'anticeil_settings_storage' && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.state) {
          const newLang = parsed.state.language;
          const newTheme = parsed.state.theme as ThemeMode;
          if (newLang === 'en' || newLang === 'id') {
            document.documentElement.setAttribute('lang', newLang);
          }
          if (newTheme === 'dark' || newTheme === 'light' || newTheme === 'system') {
            const effective = getEffectiveTheme(newTheme);
            document.documentElement.setAttribute('data-theme', effective);
          }
          useSettingsStore.setState((prev) => ({
            ...prev,
            language: (newLang === 'en' || newLang === 'id') ? newLang : prev.language,
            theme: (newTheme === 'dark' || newTheme === 'light' || newTheme === 'system') ? newTheme : prev.theme,
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
