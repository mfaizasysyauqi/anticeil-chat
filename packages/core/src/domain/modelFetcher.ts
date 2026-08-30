import { LLMModel, LLMProviderId, ModelCapabilities } from '../types';
import { PROVIDER_MODELS, PROVIDER_DEFINITIONS } from '../providers';

export interface RawProviderModelResponse {
  data?: Array<{
    id: string;
    name?: string;
    display_name?: string;
    context_window?: number;
    context_length?: number;
    max_input_tokens?: number;
    description?: string;
    active?: boolean;
    owned_by?: string;
    type?: string;
    capabilities?: Record<string, unknown>;
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

  if (
    providerDef?.requiresApiKey &&
    providerId !== 'custom' &&
    providerId !== 'omniroute' &&
    (!apiKey || apiKey.trim().length < 4)
  ) {
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
      case 'anticeil':
      case 'elevenlabs':
      case 'azure':
      case 'deepgram':
      case 'assemblyai':
      case 'fishaudio':
      case 'suno':
      case 'udio':
      case 'stability':
      case 'fal':
      case 'recraft':
      case 'luma':
      case 'kling':
      case 'runway':
      case 'pika':
      case 'tavily':
      case 'brave':
        clearTimeout(timeoutId);
        return fallbackModels;

      case 'openai':
      case 'deepseek':
      case 'groq':
      case 'openrouter':
      case 'together':
      case 'fireworks':
      case 'mistral':
      case 'xai':
      case 'perplexity':
      case 'cohere':
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

      case 'ollama':
        endpoint = `${baseUrl}/api/tags`;
        break;

      case 'omniroute':
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
  const seenIds = new Set<string>();

  // Google Gemini format: { models: [{ name: "models/gemini-2.0-flash", displayName: "..." }] }
  if (providerId === 'gemini' && Array.isArray(data.models)) {
    for (const item of data.models) {
      if (
        item.supportedGenerationMethods &&
        !item.supportedGenerationMethods.includes('generateContent')
      ) {
        continue;
      }
      const rawName = item.name || '';
      const cleanId = rawName.replace(/^models\//, '');
      if (!cleanId) continue;
      if (seenIds.has(cleanId)) continue;
      seenIds.add(cleanId);

      const isVision = cleanId.includes('flash') || cleanId.includes('pro') || cleanId.includes('vision');
      const isReasoning = cleanId.includes('thinking') || cleanId.includes('reasoning') || cleanId.includes('2.0');
      const isImageGen = cleanId.includes('imagen');
      const contextWindow = item.inputTokenLimit || 1048576;

      models.push({
        id: cleanId,
        name: item.displayName || formatModelName(cleanId),
        providerId: 'gemini',
        contextWindow,
        description: item.description || 'Google Gemini multivariant neural model',
        inputCostPer1M: cleanId.includes('pro') ? 1.25 : 0.075,
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
      if (!modelName || seenIds.has(modelName)) continue;
      seenIds.add(modelName);

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
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);

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

      const rawType = (typeof item.type === 'string' ? item.type : '').toLowerCase();
      const rawCapabilities = (typeof item.capabilities === 'object' && item.capabilities !== null)
        ? (item.capabilities as Record<string, boolean>)
        : {};

      const isVideo =
        rawType === 'video' ||
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
        id.includes('seedance') ||
        id.includes('veo') ||
        id.includes('pika');

      const isImageGen =
        rawType === 'image' ||
        id.includes('dall-e') ||
        id.includes('flux') ||
        id.includes('imagen') ||
        id.includes('image');

      const isAudio =
        rawType === 'audio' ||
        rawType === 'speech' ||
        rawType === 'transcription' ||
        id.includes('audio') ||
        id.includes('tts') ||
        id.includes('voice') ||
        id.includes('speech') ||
        id.includes('transcribe') ||
        id.includes('realtime');

      const isReasoning =
        rawCapabilities.reasoning === true ||
        id.includes('r1') ||
        id.includes('reason') ||
        id.startsWith('o1') ||
        id.startsWith('o3');

      const isVision =
        rawCapabilities.vision === true ||
        id.includes('vision') ||
        id.includes('4o') ||
        id.includes('claude') ||
        id.includes('flash') ||
        id.includes('pixtral');

      const isFast =
        providerId === 'groq' ||
        id.includes('mini') ||
        id.includes('haiku') ||
        id.includes('flash') ||
        id.includes('fast');

      const isText = rawType ? (rawType === 'text' || rawType === 'chat' || (!isVideo && !isImageGen)) : true;

      const contextWindow =
        item.context_window ||
        item.context_length ||
        item.max_input_tokens ||
        (id.includes('claude') ? 200000 : id.includes('128k') || id.includes('4o') || id.includes('gemini') ? 128000 : 32768);

      const isWebSearch =
        id.includes('sonar') ||
        id.includes('perplexity') ||
        id.includes('search') ||
        id.includes('online') ||
        id.includes('compound') ||
        providerId === 'gemini';

      const modelDescription =
        item.description ||
        (item.owned_by ? `Routed via ${item.owned_by} (${providerId === 'omniroute' ? 'OmniRoute Gateway' : providerId.toUpperCase()})` : `${providerId === 'omniroute' ? 'OmniRoute' : providerId.toUpperCase()} active API model`);

      models.push({
        id,
        name: item.display_name || item.name || formatModelName(id),
        providerId,
        contextWindow,
        description: modelDescription,
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        supportsStreaming: true,
        supportsReasoning: isReasoning,
        supportsVision: isVision,
        isPopular:
          id.includes('auto/best') ||
          id.includes('4o') ||
          id.includes('sonnet') ||
          id.includes('flash') ||
          id.includes('70b') ||
          id.includes('deepseek-chat'),
        capabilities: {
          text: isText,
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
  if (id.startsWith('auto/')) {
    const slug = id.replace(/^auto\//, '');
    return `Auto: ${slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
  }
  return id
    .replace(/^models\//, '')
    .replace(/:latest$/, '')
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
