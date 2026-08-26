import {
  LLMProviderId,
  PROVIDER_MODELS,
  PROVIDER_DEFINITIONS,
  getProviderById,
} from '@anticeil/core';
import { FREE_GROQ_KEYS, FREE_GEMINI_KEYS, getNextFreeKey } from '../../chat/data/byokApi';
import { ALL_GATEWAY_PROVIDERS, getGatewayProviderById } from '../providers';

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
  providerId: string;
  normalizedModelId: string;
  baseUrl: string;
  apiKey: string;
  authType: 'no-auth' | 'oauth' | 'cookie' | 'apikey' | 'local';
}

// Map common aliases or prefix models across all 295+ providers
export function resolveModelProvider(
  modelInput: string,
  userApiKeys: Record<string, { apiKey?: string; baseUrl?: string; cookieToken?: string; oauthToken?: string }> = {}
): ModelResolution {
  const rawModel = (modelInput || 'groq/compound').trim();
  let providerId: string = 'openai';
  let normalizedModelId = rawModel;
  let authType: 'no-auth' | 'oauth' | 'cookie' | 'apikey' | 'local' = 'apikey';

  // 1. Explicit prefix: e.g. "pollinations/flux", "sambanova/DeepSeek-R1", "copilot/gpt-4o"
  if (rawModel.includes('/')) {
    const [prefix, ...rest] = rawModel.split('/');
    const cleanPrefix = prefix.toLowerCase();
    const cleanModel = rest.join('/');

    const matchedProvider = getGatewayProviderById(cleanPrefix) || 
      (cleanPrefix === 'ddg' ? getGatewayProviderById('duckduckgo-web') : undefined) ||
      (cleanPrefix === 'copilot' ? getGatewayProviderById('github') : undefined) ||
      (cleanPrefix === 'cf' ? getGatewayProviderById('cloudflare-ai') : undefined) ||
      (cleanPrefix === 'ollama' ? getGatewayProviderById('ollama-local') : undefined);

    if (matchedProvider) {
      providerId = matchedProvider.id;
      normalizedModelId = cleanModel || rawModel;
      authType = matchedProvider.authType;
    } else if (cleanPrefix in PROVIDER_DEFINITIONS || ['openai', 'anthropic', 'gemini', 'groq', 'deepseek', 'ollama', 'openrouter', 'custom'].includes(cleanPrefix)) {
      providerId = cleanPrefix === 'openrouter' ? 'custom' : cleanPrefix;
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
      lower.includes('qwen') ||
      lower.includes('compound')
    ) {
      providerId = 'groq';
    } else if (lower.startsWith('gpt') || lower.startsWith('o1') || lower.startsWith('o3') || lower.startsWith('chatgpt')) {
      providerId = 'openai';
    } else {
      // Look up in known model lists
      for (const [pId, models] of Object.entries(PROVIDER_MODELS)) {
        if (models.some((m) => m.id === rawModel)) {
          providerId = pId;
          break;
        }
      }
    }
  }

  // Get credentials from user store or environment variables
  let apiKey = userApiKeys[providerId]?.apiKey || process.env[`${providerId.toUpperCase().replace(/-/g, '_')}_API_KEY`] || '';
  const providerMeta = getGatewayProviderById(providerId);
  const def = getProviderById(providerId as LLMProviderId);
  let baseUrl = userApiKeys[providerId]?.baseUrl || providerMeta?.defaultBaseUrl || def?.defaultBaseUrl || '';

  // Smart fallback for DeepSeek and Groq models if no direct key is set
  if (providerId === 'deepseek' && !apiKey) {
    providerId = 'groq';
    normalizedModelId = 'groq/compound';
  }

  // Groq model aliases normalization
  if (providerId === 'groq') {
    if (
      normalizedModelId === 'deepseek-r1' ||
      normalizedModelId === 'deepseek-r1-70b' ||
      normalizedModelId === 'deepseek-r1-distill-llama-70b' ||
      normalizedModelId === 'llama-3.3-70b-versatile' ||
      normalizedModelId === 'compound' ||
      normalizedModelId === 'compound-beta'
    ) {
      normalizedModelId = 'groq/compound';
    } else if (normalizedModelId === 'llama-3.1' || normalizedModelId === 'llama-8b' || normalizedModelId === 'compound-mini') {
      normalizedModelId = 'groq/compound-mini';
    } else if (normalizedModelId.includes('qwen')) {
      normalizedModelId = 'qwen/qwen3.6-27b';
    } else if (normalizedModelId.includes('gpt-oss') || normalizedModelId.includes('oss-120b')) {
      normalizedModelId = 'openai/gpt-oss-120b';
    }
  }

  // Fallback to built-in free tier keys for Groq & Gemini if no custom key is provided
  if (!apiKey) {
    if (providerId === 'groq') {
      apiKey = getNextFreeKey('groq');
    } else if (providerId === 'gemini') {
      apiKey = getNextFreeKey('gemini');
    }
  }

  // Default Base URLs
  if (!baseUrl) {
    if (providerId === 'openai') baseUrl = 'https://api.openai.com/v1';
    if (providerId === 'anthropic') baseUrl = 'https://api.anthropic.com/v1';
    if (providerId === 'deepseek') baseUrl = 'https://api.deepseek.com/v1';
    if (providerId === 'groq') baseUrl = 'https://api.groq.com/openai/v1';
    if (providerId === 'gemini') baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    if (providerId === 'pollinations') baseUrl = 'https://text.pollinations.ai';
    if (providerId === 'ollama-local') baseUrl = 'http://localhost:11434';
  }

  return {
    providerId,
    normalizedModelId,
    baseUrl,
    apiKey,
    authType,
  };
}

export function getAllGatewayModels(): Array<{ id: string; name: string; provider: string; context_window?: number; badge?: string }> {
  const result: Array<{ id: string; name: string; provider: string; context_window?: number; badge?: string }> = [];
  const addedIds = new Set<string>();

  // 1. Add models from all 295+ providers
  for (const p of ALL_GATEWAY_PROVIDERS) {
    if (p.models && p.models.length > 0) {
      for (const mId of p.models) {
        if (!addedIds.has(mId)) {
          addedIds.add(mId);
          result.push({
            id: mId,
            name: `${mId} (${p.name})`,
            provider: p.id,
            badge: p.badge,
            context_window: 128000,
          });
        }
      }
    }
  }

  // 2. Add standard core models
  for (const [providerId, models] of Object.entries(PROVIDER_MODELS)) {
    for (const m of models) {
      if (!addedIds.has(m.id)) {
        addedIds.add(m.id);
        result.push({
          id: m.id,
          name: m.name,
          provider: providerId,
          context_window: m.contextWindow,
        });
      }

      const prefixed = `${providerId}/${m.id}`;
      if (!addedIds.has(prefixed)) {
        addedIds.add(prefixed);
        result.push({
          id: prefixed,
          name: `${m.name} (${providerId.toUpperCase()})`,
          provider: providerId,
          context_window: m.contextWindow,
        });
      }
    }
  }

  return result;
}
