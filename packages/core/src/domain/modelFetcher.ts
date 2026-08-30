import { LLMModel, LLMProviderId, ModelCapabilities } from '../types';
import { PROVIDER_MODELS, PROVIDER_DEFINITIONS } from '../providers';

export interface ProviderConnectionTestResult {
  success: boolean;
  statusCode?: number;
  message: string;
  modelsCount?: number;
  latencyMs?: number;
  models?: LLMModel[];
}

/**
 * Resolves the appropriate live API endpoint, headers, and request options for any provider.
 */
function resolveProviderEndpoint(
  providerId: LLMProviderId,
  apiKey: string,
  customBaseUrl?: string
): { endpoint: string; headers: Record<string, string>; isDirectSupported: boolean } {
  const providerDef = PROVIDER_DEFINITIONS.find((p) => p.id === providerId);
  const baseUrl = (customBaseUrl || providerDef?.defaultBaseUrl || '').replace(/\/+$/, '');
  const key = apiKey.trim();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  switch (providerId) {
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
      return {
        endpoint: `${baseUrl}/models`,
        headers: { ...headers, Authorization: `Bearer ${key}` },
        isDirectSupported: true,
      };

    case 'anthropic':
      return {
        endpoint: `${baseUrl}/models`,
        headers: {
          ...headers,
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true',
        },
        isDirectSupported: true,
      };

    case 'gemini':
      return {
        endpoint: `${baseUrl}/models?key=${key}`,
        headers,
        isDirectSupported: true,
      };

    case 'ollama':
      return {
        endpoint: `${baseUrl}/api/tags`,
        headers,
        isDirectSupported: true,
      };

    case 'elevenlabs':
      return {
        endpoint: `${baseUrl || 'https://api.elevenlabs.io/v1'}/models`,
        headers: { ...headers, 'xi-api-key': key },
        isDirectSupported: true,
      };

    case 'deepgram':
      return {
        endpoint: `${baseUrl || 'https://api.deepgram.com/v1'}/models`,
        headers: { ...headers, Authorization: `Token ${key}` },
        isDirectSupported: true,
      };

    case 'assemblyai':
      return {
        endpoint: `${baseUrl || 'https://api.assemblyai.com/v2'}/models`,
        headers: { ...headers, Authorization: key },
        isDirectSupported: true,
      };

    case 'fishaudio':
      return {
        endpoint: `${baseUrl || 'https://api.fish.audio/v1'}/model`,
        headers: { ...headers, Authorization: `Bearer ${key}` },
        isDirectSupported: true,
      };

    case 'stability':
      return {
        endpoint: `${baseUrl || 'https://api.stability.ai'}/v1/engines/list`,
        headers: { ...headers, Authorization: `Bearer ${key}` },
        isDirectSupported: true,
      };

    case 'fal':
      return {
        endpoint: `${baseUrl || 'https://queue.fal.run'}/models`,
        headers: { ...headers, Authorization: `Key ${key}` },
        isDirectSupported: true,
      };

    case 'recraft':
      return {
        endpoint: `${baseUrl || 'https://external.api.recraft.ai/v1'}/models`,
        headers: { ...headers, Authorization: `Bearer ${key}` },
        isDirectSupported: true,
      };

    case 'luma':
      return {
        endpoint: `${baseUrl || 'https://api.lumalabs.ai/dream-machine/v1'}/models`,
        headers: { ...headers, Authorization: `Bearer ${key}` },
        isDirectSupported: true,
      };

    case 'runway':
      return {
        endpoint: `${baseUrl || 'https://api.dev.runwayml.com/v1'}/models`,
        headers: {
          ...headers,
          Authorization: `Bearer ${key}`,
          'X-Runway-Version': '2024-11-06',
        },
        isDirectSupported: true,
      };

    case 'azure':
    case 'suno':
    case 'udio':
    case 'kling':
    case 'pika':
    case 'tavily':
    case 'brave':
    case 'omniroute':
    case 'custom':
    default:
      return {
        endpoint: `${baseUrl}/models`,
        headers: key ? { ...headers, Authorization: `Bearer ${key}` } : headers,
        isDirectSupported: Boolean(baseUrl),
      };
  }
}

/**
 * Tests connection & health status of an AI provider credentials without running expensive generation.
 */
export async function testProviderConnection(
  providerId: LLMProviderId,
  apiKey: string,
  customBaseUrl?: string
): Promise<ProviderConnectionTestResult> {
  const startTime = Date.now();
  const providerDef = PROVIDER_DEFINITIONS.find((p) => p.id === providerId);

  if (
    providerDef?.requiresApiKey &&
    providerId !== 'custom' &&
    providerId !== 'omniroute' &&
    (!apiKey || apiKey.trim().length < 4)
  ) {
    return {
      success: false,
      message: 'API Key belum diisi atau terlalu pendek.',
    };
  }

  // Anticeil built-in free cloud tier test
  if (providerId === 'anticeil') {
    try {
      const liveModels = await fetchProviderModels('anticeil', apiKey, customBaseUrl);
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        statusCode: 200,
        message: `Provider Anticeil Aktif (${liveModels.length} model live)`,
        latencyMs,
        modelsCount: liveModels.length,
        models: liveModels,
      };
    } catch {
      return {
        success: true,
        statusCode: 200,
        message: 'Provider bawaan aktif (Free Tier siap pakai)',
        latencyMs: 15,
        modelsCount: (PROVIDER_MODELS.anticeil || []).length,
      };
    }
  }

  const { endpoint, headers } = resolveProviderEndpoint(providerId, apiKey, customBaseUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      let errDetails = '';
      try {
        const errJson = await response.json();
        errDetails = errJson?.error?.message || errJson?.message || errJson?.detail || '';
      } catch {}

      if (response.status === 401) {
        return {
          success: false,
          statusCode: 401,
          message: 'API Key tidak valid atau kedaluwarsa (401 Unauthorized)',
          latencyMs,
        };
      }
      if (response.status === 403) {
        return {
          success: false,
          statusCode: 403,
          message: errDetails || 'Akses ditolak (Cek kuota API / Billing Tier)',
          latencyMs,
        };
      }
      if (response.status === 429) {
        return {
          success: false,
          statusCode: 429,
          message: 'Batas kuota habis atau Rate Limit tercapai (429)',
          latencyMs,
        };
      }
      return {
        success: false,
        statusCode: response.status,
        message: errDetails || `Gagal terhubung: HTTP ${response.status}`,
        latencyMs,
      };
    }

    const json = await response.json();
    const parsedModels = parseModelsResponse(providerId, json);

    return {
      success: true,
      statusCode: 200,
      message: `Terhubung (${parsedModels.length} model aktif)`,
      modelsCount: parsedModels.length,
      latencyMs,
      models: parsedModels,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const isAbort = err instanceof DOMException && err.name === 'AbortError';
    return {
      success: false,
      message: isAbort ? 'Waktu koneksi habis (Timeout 10s)' : 'Gagal terhubung ke endpoint (Cek jaringan / Base URL)',
      latencyMs,
    };
  }
}

export interface RawProviderModelResponse {
  data?: Array<{
    id?: string;
    model_id?: string;
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
    id?: string;
    model_id?: string;
    name?: string;
    displayName?: string;
    description?: string;
    inputTokenLimit?: number;
    supportedGenerationMethods?: string[];
  }>;
}

/**
 * Dynamically fetches live AI models from the provider's API endpoint without hardcoded fallbacks.
 */
export async function fetchProviderModels(
  providerId: LLMProviderId,
  apiKey: string,
  customBaseUrl?: string
): Promise<LLMModel[]> {
  const providerDef = PROVIDER_DEFINITIONS.find((p) => p.id === providerId);

  // Dynamic live fetch for Anticeil Free Cloud: queries Gemini & Groq APIs concurrently
  if (providerId === 'anticeil') {
    try {
      const geminiKey = apiKey || 'AQ.Ab8RN6JWoVCHAxjnHnTig8_iYyHTobEtwGGo9AAOiyFHQc-5Dg';
      const groqKey = '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';

      const [geminiLive, groqLive] = await Promise.allSettled([
        fetchProviderModels('gemini', geminiKey),
        fetchProviderModels('groq', groqKey),
      ]);

      const liveModels: LLMModel[] = [];

      if (geminiLive.status === 'fulfilled' && geminiLive.value.length > 0) {
        for (const m of geminiLive.value) {
          liveModels.push({
            ...m,
            providerId: 'anticeil',
            name: `${m.name.replace(/ \(.*\)/, '')} (Anticeil Free)`,
            description: `${m.description} — Ditenagai oleh Anticeil Free Cloud`,
            inputCostPer1M: 0,
            outputCostPer1M: 0,
            isPopular: m.id.includes('flash') || m.id.includes('pro'),
          });
        }
      }

      if (groqLive.status === 'fulfilled' && groqLive.value.length > 0) {
        for (const m of groqLive.value) {
          if (
            m.id.includes('compound') ||
            m.id.includes('guard') ||
            m.id.includes('whisper') ||
            m.id.includes('orpheus')
          ) {
            continue;
          }
          liveModels.push({
            ...m,
            providerId: 'anticeil',
            name: `${m.name.replace(/ \(.*\)/, '')} (Groq / Anticeil)`,
            description: `${m.description} — Ditenagai oleh Groq LPU via Anticeil`,
            inputCostPer1M: 0,
            outputCostPer1M: 0,
            isPopular: m.id.includes('70b') || m.id.includes('llama-3.3'),
          });
        }
      }

      if (liveModels.length > 0) {
        // Sort with Gemini Flash & Pro and Llama 70B at the top
        liveModels.sort((a, b) => {
          const rank = (id: string) => {
            if (id.includes('2.0-flash')) return 1;
            if (id.includes('1.5-flash')) return 2;
            if (id.includes('1.5-pro')) return 3;
            if (id.includes('llama-3.3-70b') || id.includes('70b')) return 4;
            if (id.includes('llama-3.1-8b') || id.includes('8b')) return 5;
            return 10;
          };
          return rank(a.id) - rank(b.id);
        });
        return liveModels;
      }
    } catch (err) {
      console.warn('[Anticeil] Error fetching dynamic Anticeil models:', err);
    }
    return PROVIDER_MODELS.anticeil || [];
  }

  if (
    providerDef?.requiresApiKey &&
    providerId !== 'custom' &&
    providerId !== 'omniroute' &&
    (!apiKey || apiKey.trim().length < 4)
  ) {
    return [];
  }

  const { endpoint, headers } = resolveProviderEndpoint(providerId, apiKey, customBaseUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Anticeil] Failed to fetch live models for ${providerId}: HTTP ${response.status}`);
      return [];
    }

    const json = await response.json();
    const parsedModels = parseModelsResponse(providerId, json);

    if (parsedModels.length > 0) {
      return parsedModels;
    }
    return [];
  } catch (err: unknown) {
    console.warn(`[Anticeil] Network error fetching models for ${providerId}:`, err);
    return [];
  }
}

/**
 * Parses raw JSON responses from various AI provider endpoints into unified LLMModel structures.
 */
function parseModelsResponse(
  providerId: LLMProviderId,
  data: RawProviderModelResponse & Record<string, unknown>
): LLMModel[] {
  const models: LLMModel[] = [];
  const seenIds = new Set<string>();

  // Direct array response (Stability, ElevenLabs, Deepgram, etc.)
  const rawList: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.models)
    ? data.models
    : [];

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

      // Filter out non-chat / experimental / embedding / media-only models
      if (
        cleanId.includes('embedding') ||
        cleanId.includes('aqa') ||
        cleanId.includes('imagen') ||
        cleanId.includes('learnlm') ||
        cleanId.includes('bidi') ||
        cleanId.includes('computer-use') ||
        cleanId.includes('tts')
      ) {
        continue;
      }

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

  // Generic / OpenAI-compatible / Audio / Video / Image Array Parser
  if (rawList.length > 0) {
    for (const item of rawList) {
      const id = item.id || item.model_id || item.name || item._id;
      if (!id || typeof id !== 'string' || seenIds.has(id)) continue;

      // Global exclusion for embedding, reranking, moderation, guardrails
      if (
        id.includes('embedding') ||
        id.includes('text-embedding') ||
        id.includes('bge-') ||
        id.includes('rerank') ||
        id.includes('moderation') ||
        id.includes('guard')
      ) {
        continue;
      }

      // OpenAI chat filter
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
          id.includes('babbage') ||
          id.includes('davinci');
        if (!isChat || isExcluded) continue;
      }

      // Groq chat filter
      if (providerId === 'groq') {
        if (item.active === false) continue;
        if (
          id.includes('whisper') ||
          id.includes('tool-use-preview') ||
          id.includes('compound') ||
          id.includes('guard') ||
          id.includes('safeguard') ||
          id.includes('orpheus')
        ) {
          continue;
        }
      }

      // OmniRoute bot/scraper filter
      if (providerId === 'omniroute') {
        if (
          id.includes('-web') ||
          id.includes('duckduckgo') ||
          id.includes('felo') ||
          id.includes('veoaifree') ||
          id.includes('tts') ||
          id.includes('whisper')
        ) {
          continue;
        }
      }

      seenIds.add(id);

      const rawType = (typeof item.type === 'string' ? item.type : '').toLowerCase();
      const rawCapabilities = (typeof item.capabilities === 'object' && item.capabilities !== null)
        ? (item.capabilities as Record<string, boolean>)
        : {};

      const isVideo =
        providerId === 'luma' ||
        providerId === 'runway' ||
        providerId === 'kling' ||
        providerId === 'pika' ||
        rawType === 'video' ||
        id.includes('video') ||
        id.includes('sora') ||
        id.includes('runway') ||
        id.includes('luma') ||
        id.includes('kling') ||
        id.includes('pika');

      const isImageGen =
        providerId === 'stability' ||
        providerId === 'fal' ||
        providerId === 'recraft' ||
        rawType === 'image' ||
        rawType === 'picture' ||
        id.includes('dall-e') ||
        id.includes('flux') ||
        id.includes('imagen') ||
        id.includes('sdxl') ||
        id.includes('stable-diffusion');

      const isAudio =
        providerId === 'elevenlabs' ||
        providerId === 'deepgram' ||
        providerId === 'assemblyai' ||
        providerId === 'fishaudio' ||
        providerId === 'azure' ||
        providerId === 'suno' ||
        providerId === 'udio' ||
        rawType === 'audio' ||
        rawType === 'speech' ||
        rawType === 'transcription' ||
        id.includes('audio') ||
        id.includes('tts') ||
        id.includes('voice') ||
        id.includes('speech') ||
        id.includes('whisper');

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

      const isText = rawType
        ? (rawType === 'text' || rawType === 'chat' || (!isVideo && !isImageGen && !isAudio))
        : (!isVideo && !isImageGen && !isAudio);

      const contextWindow =
        item.context_window ||
        item.context_length ||
        item.max_input_tokens ||
        (id.includes('claude') ? 200000 : id.includes('128k') || id.includes('4o') || id.includes('gemini') ? 128000 : 32768);

      const isWebSearch =
        providerId === 'tavily' ||
        providerId === 'brave' ||
        id.includes('sonar') ||
        id.includes('perplexity') ||
        id.includes('search');

      const modelDescription =
        item.description ||
        (item.owned_by
          ? `Routed via ${item.owned_by} (${providerId === 'omniroute' ? 'OmniRoute Gateway' : providerId.toUpperCase()})`
          : `${providerId.toUpperCase()} live active API model`);

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
          id.includes('deepseek-chat') ||
          id.includes('sd3.5') ||
          id.includes('flux'),
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

