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
} from '@anticeil/core';

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
  firecrawl: { apiKey: '', baseUrl: 'https://api.firecrawl.dev/v1', isEnabled: true },
  omniroute: { apiKey: '', baseUrl: 'http://localhost:20128/v1', isEnabled: true },
  custom: { apiKey: '', baseUrl: 'http://localhost:1234/v1', isEnabled: true },
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
        if (providerId === 'anticeil') return true;
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
            console.warn(`[Anticeil Mobile] Failed refreshing models for ${providerId}:`, err);
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
      name: 'anticeil_mobile_settings_storage',
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
