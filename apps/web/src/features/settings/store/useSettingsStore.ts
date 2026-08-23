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
} from '@chatbyok/core';

interface SettingsState {
  apiKeys: ApiKeysState;
  dynamicModels: Partial<Record<LLMProviderId, LLMModel[]>>;
  isLoadingModels: Partial<Record<LLMProviderId, boolean>>;
  activeProviderId: LLMProviderId;
  activeModelId: string;
  theme: 'dark' | 'light';
  language: Language;
  isSettingsOpen: boolean;
  
  // Actions
  setSettingsOpen: (open: boolean) => void;
  setApiKey: (providerId: LLMProviderId, apiKey: string, baseUrl?: string) => void;
  toggleProvider: (providerId: LLMProviderId, isEnabled: boolean) => void;
  setActiveProviderAndModel: (providerId: LLMProviderId, modelId: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLanguage: (lang: Language) => void;
  hasConfiguredKey: (providerId: LLMProviderId) => boolean;
  refreshModels: (providerId?: LLMProviderId) => Promise<void>;
  getModelsForProvider: (providerId: LLMProviderId) => LLMModel[];
  clearAllKeys: () => void;
  importApiKeys: (imported: Partial<ApiKeysState>) => void;
}

const initialApiKeys: ApiKeysState = {
  openai: { apiKey: '', isEnabled: true },
  anthropic: { apiKey: '', isEnabled: true },
  gemini: { apiKey: '', isEnabled: true },
  deepseek: { apiKey: '', isEnabled: true },
  groq: { apiKey: '', isEnabled: true },
  ollama: { apiKey: '', baseUrl: 'http://localhost:11434', isEnabled: true },
  custom: { apiKey: '', baseUrl: 'https://openrouter.ai/api/v1', isEnabled: true },
};

function getInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const direct = localStorage.getItem('chatbyok_lang');
      if (direct === 'en' || direct === 'id') return direct;
      const raw = localStorage.getItem('chatbyok_settings_storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.language === 'en' || parsed?.state?.language === 'id') {
          return parsed.state.language;
        }
      }
    } catch {}
  }
  return 'en';
}

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('chatbyok_settings_storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.state?.theme === 'dark' || parsed?.state?.theme === 'light') {
          return parsed.state.theme;
        }
      }
    } catch {}
  }
  return 'dark';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKeys: initialApiKeys,
      dynamicModels: {},
      isLoadingModels: {},
      activeProviderId: DEFAULT_PROVIDER_ID,
      activeModelId: DEFAULT_MODEL_ID,
      theme: getInitialTheme(),
      language: getInitialLanguage(),
      isSettingsOpen: false,

      setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),

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
        if (trimmedKey.length > 4 || providerId === 'ollama') {
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
            localStorage.setItem('chatbyok_lang', language);
            document.documentElement.setAttribute('lang', language);
          } catch {}
        }
        set({ language });
      },

      hasConfiguredKey: (providerId) => {
        const config = get().apiKeys[providerId];
        const providerDef = PROVIDER_DEFINITIONS.find((p) => p.id === providerId);
        if (!providerDef?.requiresApiKey) return true;
        return Boolean(config?.apiKey && config.apiKey.length > 5);
      },

      refreshModels: async (targetProviderId) => {
        const state = get();
        const providersToFetch = targetProviderId
          ? [targetProviderId]
          : (Object.keys(state.apiKeys) as LLMProviderId[]);

        for (const providerId of providersToFetch) {
          const keyConfig = state.apiKeys[providerId];
          const apiKey = keyConfig?.apiKey || '';
          const baseUrl = keyConfig?.baseUrl;

          set((s) => ({
            isLoadingModels: { ...s.isLoadingModels, [providerId]: true },
          }));

          try {
            const fetched = await fetchProviderModels(providerId, apiKey, baseUrl);
            if (fetched && fetched.length > 0) {
              set((s) => ({
                dynamicModels: { ...s.dynamicModels, [providerId]: fetched },
              }));
            }
          } catch (err) {
            console.warn(`[ChatByok] Failed refreshing models for ${providerId}:`, err);
          } finally {
            set((s) => ({
              isLoadingModels: { ...s.isLoadingModels, [providerId]: false },
            }));
          }
        }
      },

      getModelsForProvider: (providerId) => {
        const state = get();
        const dynamic = state.dynamicModels[providerId];
        if (dynamic && dynamic.length > 0) {
          return dynamic;
        }
        return PROVIDER_MODELS[providerId] || [];
      },

      clearAllKeys: () => {
        set({ apiKeys: initialApiKeys, dynamicModels: {} });
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
      name: 'chatbyok_settings_storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.language && typeof document !== 'undefined') {
          document.documentElement.setAttribute('lang', state.language);
          try {
            localStorage.setItem('chatbyok_lang', state.language);
          } catch {}
        }
        if (state?.theme && typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        dynamicModels: state.dynamicModels,
        activeProviderId: state.activeProviderId,
        activeModelId: state.activeModelId,
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);

// Cross-tab / cross-page synchronized updates
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'chatbyok_settings_storage' && event.newValue) {
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
    } else if (event.key === 'chatbyok_lang' && event.newValue) {
      const newLang = event.newValue as Language;
      if (newLang === 'en' || newLang === 'id') {
        document.documentElement.setAttribute('lang', newLang);
        useSettingsStore.setState({ language: newLang });
      }
    }
  });
}
