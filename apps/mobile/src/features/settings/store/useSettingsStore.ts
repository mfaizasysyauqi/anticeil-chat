import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandAsyncStorage } from '../../../core/storage/storageAdapter';
import {
  LLMProviderId,
  LLMModel,
  ApiKeysState,
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

  setApiKey: (providerId: LLMProviderId, apiKey: string, baseUrl?: string) => void;
  setActiveProviderAndModel: (providerId: LLMProviderId, modelId: string) => void;
  hasConfiguredKey: (providerId: LLMProviderId) => boolean;
  refreshModels: (providerId?: LLMProviderId) => Promise<void>;
  getModelsForProvider: (providerId: LLMProviderId) => LLMModel[];
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      apiKeys: initialApiKeys,
      dynamicModels: {},
      isLoadingModels: {},
      activeProviderId: DEFAULT_PROVIDER_ID,
      activeModelId: DEFAULT_MODEL_ID,

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

        if (trimmedKey.length > 4 || providerId === 'ollama') {
          get().refreshModels(providerId);
        }
      },

      setActiveProviderAndModel: (providerId, modelId) =>
        set({ activeProviderId: providerId, activeModelId: modelId }),

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
            console.warn(`[ChatByok Mobile] Failed refreshing models for ${providerId}:`, err);
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
    }),
    {
      name: 'chatbyok_mobile_settings_storage',
      storage: createJSONStorage(() => zustandAsyncStorage),
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        dynamicModels: state.dynamicModels,
        activeProviderId: state.activeProviderId,
        activeModelId: state.activeModelId,
      }),
    }
  )
);
