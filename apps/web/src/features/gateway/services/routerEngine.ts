import {
  LLMProviderId,
  LLMModel,
  PROVIDER_MODELS,
  PROVIDER_DEFINITIONS,
  getProviderById,
} from '@anticeil/core';
import { FREE_GROQ_KEYS, FREE_GEMINI_KEYS, getNextFreeKey } from '../../chat/data/byokApi';

export interface RouteRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | any;
    name?: string;
  }>;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ModelResolution {
  providerId: LLMProviderId;
  normalizedModelId: string;
  baseUrl: string;
  apiKey: string;
}

// Map common aliases or prefix models to specific providers
export function resolveModelProvider(
  modelInput: string,
  userApiKeys: Record<string, { apiKey: string; baseUrl?: string }> = {}
): ModelResolution {
  const rawModel = (modelInput || 'gpt-4o-mini').trim();
  let providerId: LLMProviderId = 'openai';
  let normalizedModelId = rawModel;

  // 1. Explicit prefix: e.g. "anthropic/claude-3-7-sonnet" or "groq/llama-3.3-70b-versatile"
  if (rawModel.includes('/')) {
    const [prefix, ...rest] = rawModel.split('/');
    const cleanPrefix = prefix.toLowerCase();
    const cleanModel = rest.join('/');

    if (cleanPrefix in PROVIDER_DEFINITIONS || ['openai', 'anthropic', 'gemini', 'groq', 'deepseek', 'ollama', 'openrouter', 'custom'].includes(cleanPrefix)) {
      providerId = (cleanPrefix === 'openrouter' ? 'custom' : cleanPrefix) as LLMProviderId;
      normalizedModelId = cleanModel;
    }
  } else {
    // 2. Infer provider from model name keywords
    const lower = rawModel.toLowerCase();
    if (lower.startsWith('claude')) {
      providerId = 'anthropic';
    } else if (lower.startsWith('gemini')) {
      providerId = 'gemini';
    } else if (lower.startsWith('deepseek')) {
      providerId = 'deepseek';
    } else if (
      lower.includes('llama') ||
      lower.includes('mixtral') ||
      lower.includes('gemma') ||
      lower.includes('qwen')
    ) {
      providerId = 'groq';
    } else if (lower.startsWith('gpt') || lower.startsWith('o1') || lower.startsWith('o3') || lower.startsWith('chatgpt')) {
      providerId = 'openai';
    } else {
      // Look up in known model lists
      for (const [pId, models] of Object.entries(PROVIDER_MODELS)) {
        if (models.some((m) => m.id === rawModel)) {
          providerId = pId as LLMProviderId;
          break;
        }
      }
    }
  }

  // Get provider definition and default base URL
  const def = getProviderById(providerId);
  let baseUrl = userApiKeys[providerId]?.baseUrl || def?.defaultBaseUrl || '';
  let apiKey = userApiKeys[providerId]?.apiKey || process.env[`${providerId.toUpperCase()}_API_KEY`] || '';

  // Fallback to built-in free tier keys for Groq & Gemini if no custom key is provided
  if (!apiKey) {
    if (providerId === 'groq') {
      apiKey = getNextFreeKey('groq');
    } else if (providerId === 'gemini') {
      apiKey = getNextFreeKey('gemini');
    }
  }

  // Default OpenAI base URL if empty
  if (!baseUrl) {
    if (providerId === 'openai') baseUrl = 'https://api.openai.com/v1';
    if (providerId === 'anthropic') baseUrl = 'https://api.anthropic.com/v1';
    if (providerId === 'deepseek') baseUrl = 'https://api.deepseek.com/v1';
    if (providerId === 'groq') baseUrl = 'https://api.groq.com/openai/v1';
    if (providerId === 'gemini') baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  return {
    providerId,
    normalizedModelId,
    baseUrl,
    apiKey,
  };
}

export function getAllGatewayModels(): Array<{ id: string; name: string; provider: string; context_window?: number }> {
  const result: Array<{ id: string; name: string; provider: string; context_window?: number }> = [];

  for (const [providerId, models] of Object.entries(PROVIDER_MODELS)) {
    for (const m of models) {
      // Add standard model ID
      result.push({
        id: m.id,
        name: m.name,
        provider: providerId,
        context_window: m.contextWindow,
      });

      // Also add prefixed version for unambiguous routing (e.g. groq/llama-3.3-70b-versatile)
      result.push({
        id: `${providerId}/${m.id}`,
        name: `${m.name} (${providerId.toUpperCase()})`,
        provider: providerId,
        context_window: m.contextWindow,
      });
    }
  }

  return result;
}
