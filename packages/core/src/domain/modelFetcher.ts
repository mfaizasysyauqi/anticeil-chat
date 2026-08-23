import { LLMModel, LLMProviderId, ModelCapabilities } from '../types';
import { PROVIDER_MODELS, PROVIDER_DEFINITIONS } from '../providers';

export interface RawProviderModelResponse {
  data?: Array<{
    id: string;
    name?: string;
    display_name?: string;
    context_window?: number;
    context_length?: number;
    description?: string;
    active?: boolean;
    owned_by?: string;
  }>;
  models?: Array<{
    name: string;
    displayName?: string;
    description?: string;
    inputTokenLimit?: number;
    supportedGenerationMethods?: string[];
  }>;
}

/**
 * Dynamically fetches live AI models from the provider's API endpoint.
 * Falls back to default preset models if API call fails or key is empty.
 */
export async function fetchProviderModels(
  providerId: LLMProviderId,
  apiKey: string,
  customBaseUrl?: string
): Promise<LLMModel[]> {
  const providerDef = PROVIDER_DEFINITIONS.find((p) => p.id === providerId);
  const fallbackModels = PROVIDER_MODELS[providerId] || [];

  if (providerDef?.requiresApiKey && (!apiKey || apiKey.trim().length < 4)) {
    return fallbackModels;
  }

  const baseUrl = (customBaseUrl || providerDef?.defaultBaseUrl || '').replace(/\/+$/, '');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let endpoint = '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (providerId) {
      case 'openai':
        endpoint = `${baseUrl}/models`;
        headers.Authorization = `Bearer ${apiKey.trim()}`;
        break;

      case 'anthropic':
        endpoint = `${baseUrl}/models`;
        headers['x-api-key'] = apiKey.trim();
        headers['anthropic-version'] = '2023-06-01';
        headers['dangerously-allow-browser'] = 'true';
        break;

      case 'gemini':
        endpoint = `${baseUrl}/models?key=${apiKey.trim()}`;
        break;

      case 'deepseek':
        endpoint = `${baseUrl}/models`;
        headers.Authorization = `Bearer ${apiKey.trim()}`;
        break;

      case 'groq':
        endpoint = `${baseUrl}/models`;
        headers.Authorization = `Bearer ${apiKey.trim()}`;
        break;

      case 'ollama':
        endpoint = `${baseUrl}/api/tags`;
        break;

      case 'custom':
      default:
        endpoint = `${baseUrl}/models`;
        if (apiKey.trim()) {
          headers.Authorization = `Bearer ${apiKey.trim()}`;
        }
        break;
    }

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Anticeil] Failed to fetch live models for ${providerId}: HTTP ${response.status}`);
      return fallbackModels;
    }

    const json = await response.json();
    const parsedModels = parseModelsResponse(providerId, json);

    if (parsedModels.length > 0) {
      return parsedModels;
    }
    return fallbackModels;
  } catch (err: unknown) {
    console.warn(`[Anticeil] Network error fetching models for ${providerId}:`, err);
    return fallbackModels;
  }
}

/**
 * Parses raw JSON responses from various AI provider endpoints into unified LLMModel structures with capabilities.
 */
function parseModelsResponse(
  providerId: LLMProviderId,
  data: RawProviderModelResponse & Record<string, unknown>
): LLMModel[] {
  const models: LLMModel[] = [];

  // Google Gemini format: { models: [{ name: "models/gemini-2.0-flash", displayName: "..." }] }
  if (providerId === 'gemini' && Array.isArray(data.models)) {
    for (const item of data.models) {
      if (
        item.supportedGenerationMethods &&
        !item.supportedGenerationMethods.includes('generateContent')
      ) {
        continue;
      }
      const cleanId = item.name.replace(/^models\//, '');
      if (cleanId.includes('embedding') || cleanId.includes('aqa')) {
        continue;
      }

      const contextWindow = item.inputTokenLimit || 1048576;
      const isVision = cleanId.includes('flash') || cleanId.includes('pro');
      const isReasoning = cleanId.includes('thinking') || cleanId.includes('exp');
      const isImageGen = cleanId.includes('imagen');

      models.push({
        id: cleanId,
        name: item.displayName || cleanId,
        providerId: 'gemini',
        contextWindow,
        description: item.description || `Gemini active model (${cleanId})`,
        inputCostPer1M: cleanId.includes('pro') ? 1.25 : 0.1,
        outputCostPer1M: cleanId.includes('pro') ? 5.0 : 0.4,
        supportsStreaming: true,
        supportsVision: isVision,
        supportsReasoning: isReasoning,
        isPopular: cleanId.includes('2.0-flash') || cleanId.includes('1.5-pro'),
        capabilities: {
          text: true,
          vision: isVision,
          reasoning: isReasoning,
          imageGen: isImageGen,
          docAnalysis: contextWindow >= 128000,
          fastLpu: cleanId.includes('flash'),
        },
      });
    }
    return models;
  }

  // Ollama format: { models: [{ name: "llama3.2:latest", ... }] }
  if (providerId === 'ollama' && Array.isArray(data.models)) {
    for (const item of data.models) {
      const modelName = item.name;
      const isReasoning = modelName.includes('r1') || modelName.includes('reasoning');
      const isVision = modelName.includes('vision') || modelName.includes('llava');

      models.push({
        id: modelName,
        name: `${modelName} (Local)`,
        providerId: 'ollama',
        contextWindow: 16384,
        description: 'Locally running Ollama model on your device',
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        supportsStreaming: true,
        supportsReasoning: isReasoning,
        supportsVision: isVision,
        capabilities: {
          text: true,
          vision: isVision,
          reasoning: isReasoning,
          imageGen: false,
          docAnalysis: false,
          fastLpu: false,
        },
      });
    }
    return models;
  }

  // Standard OpenAI-compatible format: { data: [{ id: "...", ... }] }
  if (Array.isArray(data.data)) {
    for (const item of data.data) {
      const id = item.id;
      if (!id) continue;

      // Filter out non-chat models for OpenAI
      if (providerId === 'openai') {
        const isChat =
          id.startsWith('gpt-') ||
          id.startsWith('o1') ||
          id.startsWith('o3') ||
          id.startsWith('chatgpt-');
        const isExcluded =
          id.includes('realtime') ||
          id.includes('audio') ||
          id.includes('tts') ||
          id.includes('dall-e') ||
          id.includes('embedding') ||
          id.includes('moderation');
        if (!isChat || isExcluded) continue;
      }

      // Filter out non-chat models for Groq
      if (providerId === 'groq') {
        if (item.active === false) continue;
        if (id.includes('whisper') || id.includes('guard') || id.includes('tool-use-preview')) {
          continue;
        }
      }

      const isReasoning =
        id.includes('r1') ||
        id.includes('reason') ||
        id.startsWith('o1') ||
        id.startsWith('o3');

      const isVision =
        id.includes('vision') ||
        id.includes('4o') ||
        id.includes('claude') ||
        id.includes('flash') ||
        id.includes('pixtral');

      const isAudio =
        id.includes('audio') ||
        id.includes('tts') ||
        id.includes('voice') ||
        id.includes('speech') ||
        id.includes('realtime') ||
        id.includes('4o');

      const isImageGen = id.includes('dall-e') || id.includes('flux') || id.includes('image');
      const isFast = providerId === 'groq' || id.includes('mini') || id.includes('haiku') || id.includes('flash');

      const contextWindow =
        item.context_window ||
        item.context_length ||
        (id.includes('claude') ? 200000 : id.includes('128k') || id.includes('4o') ? 128000 : 32768);

      const isWebSearch =
        id.includes('sonar') ||
        id.includes('perplexity') ||
        id.includes('search') ||
        id.includes('online') ||
        id.includes('compound') ||
        providerId === 'gemini' ||
        id.includes('4o');

      const isVideo =
        id.includes('video') ||
        id.includes('sora') ||
        id.includes('runway') ||
        id.includes('luma') ||
        id.includes('kling') ||
        id.includes('minimax-video') ||
        id.includes('svd') ||
        id.includes('cogvideo') ||
        id.includes('wan2') ||
        id.includes('ltx') ||
        id.includes('haiper') ||
        id.includes('pika');

      models.push({
        id,
        name: item.display_name || item.name || formatModelName(id),
        providerId,
        contextWindow,
        description: item.description || `${providerId.toUpperCase()} active API model`,
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        supportsStreaming: true,
        supportsReasoning: isReasoning,
        supportsVision: isVision,
        isPopular:
          id.includes('4o') ||
          id.includes('sonnet') ||
          id.includes('flash') ||
          id.includes('70b') ||
          id.includes('deepseek-chat'),
        capabilities: {
          text: true,
          vision: isVision,
          reasoning: isReasoning,
          imageGen: isImageGen,
          docAnalysis: contextWindow >= 128000,
          fastLpu: isFast,
          audio: isAudio,
          tts: isAudio,
          webSearch: isWebSearch,
          video: isVideo,
        },
      });
    }
  }

  return models;
}

/**
 * Converts a raw model ID like 'llama-3.3-70b-versatile' or 'claude-3-7-sonnet-20250219' into a clean human label.
 */
function formatModelName(id: string): string {
  return id
    .replace(/^models\//, '')
    .replace(/:latest$/, '')
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
