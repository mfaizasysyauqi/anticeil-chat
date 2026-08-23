import {
  ChatMessage,
  ChatStreamChunk,
  LLMProviderId,
  ProviderApiKeyConfig,
  getProviderById,
  parseSSELine,
  BASE_LANGUAGE_INSTRUCTION,
} from '@anticeil/core';

export interface SendMessageOptions {
  providerId: LLMProviderId;
  modelId: string;
  systemPrompt?: string;
  messages: ChatMessage[];
  apiKeyConfig: ProviderApiKeyConfig;
  temperature?: number;
  onChunk: (chunk: ChatStreamChunk) => void;
  signal?: AbortSignal;
}

// ── Built-in Free Tier Rotating Key Pool ─────────────────────────────────
export const FREE_GROQ_KEYS: string[] = [
  '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',
  ...(process.env.NEXT_PUBLIC_GROQ_API_KEYS ? process.env.NEXT_PUBLIC_GROQ_API_KEYS.split(',').map((k) => k.trim()) : []),
].filter((k, i, self) => Boolean(k) && self.indexOf(k) === i);

export const FREE_GEMINI_KEYS: string[] = [
  'AQ.Ab8RN6JWoVCHAxjnHnTig8_iYyHTobEtwGGo9AAOiyFHQc-5Dg',
  ...(process.env.NEXT_PUBLIC_GEMINI_API_KEYS ? process.env.NEXT_PUBLIC_GEMINI_API_KEYS.split(',').map((k) => k.trim()) : []),
].filter((k, i, self) => Boolean(k) && self.indexOf(k) === i);

let groqKeyIndex = 0;
let geminiKeyIndex = 0;

export function getNextFreeKey(providerId: 'groq' | 'gemini'): string {
  if (providerId === 'groq' && FREE_GROQ_KEYS.length > 0) {
    const key = FREE_GROQ_KEYS[groqKeyIndex % FREE_GROQ_KEYS.length];
    groqKeyIndex++;
    return key;
  }
  if (providerId === 'gemini' && FREE_GEMINI_KEYS.length > 0) {
    const key = FREE_GEMINI_KEYS[geminiKeyIndex % FREE_GEMINI_KEYS.length];
    geminiKeyIndex++;
    return key;
  }
  return '';
}

export async function streamBYOKChat(options: SendMessageOptions): Promise<void> {
  const {
    providerId,
    modelId,
    systemPrompt,
    messages,
    apiKeyConfig,
    temperature = 0.7,
    onChunk,
    signal,
  } = options;

  const providerDef = getProviderById(providerId);
  const baseUrl = apiKeyConfig.baseUrl || providerDef?.defaultBaseUrl || '';
  let apiKey = apiKeyConfig.apiKey;

  // Fallback to built-in free tier rotating key pool if user has no custom BYOK key
  if (!apiKey) {
    if (providerId === 'groq') {
      apiKey = getNextFreeKey('groq');
    } else if (providerId === 'gemini') {
      apiKey = getNextFreeKey('gemini');
    }
  }

  if (providerDef?.requiresApiKey && !apiKey) {
    throw new Error(`API key is required for ${providerDef.name}. Please configure it in Settings.`);
  }

  // Format messages into common structure
  const formattedMessages = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const effectiveSystemPrompt = systemPrompt
    ? `${systemPrompt}\n\n${BASE_LANGUAGE_INSTRUCTION}`
    : `You are a helpful and intelligent AI assistant. ${BASE_LANGUAGE_INSTRUCTION}`;

  let response: Response;

  // 1. OpenAI / Groq / DeepSeek / Custom Endpoint (OpenAI Chat Completions API)
  if (providerId === 'openai' || providerId === 'groq' || providerId === 'deepseek' || providerId === 'custom') {
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
    const payloadMessages = [
      { role: 'system', content: effectiveSystemPrompt },
      ...formattedMessages,
    ];

    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: payloadMessages,
        temperature,
        stream: true,
      }),
      signal,
    });
  }

  // 2. Anthropic Claude API
  else if (providerId === 'anthropic') {
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/messages`;
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true',
      },
      body: JSON.stringify({
        model: modelId,
        system: effectiveSystemPrompt,
        messages: formattedMessages,
        max_tokens: 4096,
        temperature,
        stream: true,
      }),
      signal,
    });
  }

  // 3. Google Gemini API
  else if (providerId === 'gemini') {
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const contents = formattedMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: effectiveSystemPrompt }] },
        generationConfig: {
          temperature,
        },
      }),
      signal,
    });
  }

  // 4. Ollama (Local LLM API)
  else if (providerId === 'ollama') {
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/api/chat`;
    const payloadMessages = [
      { role: 'system', content: effectiveSystemPrompt },
      ...formattedMessages,
    ];

    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: payloadMessages,
        stream: true,
        options: {
          temperature,
        },
      }),
      signal,
    });
  } else {
    throw new Error(`Unsupported provider: ${providerId}`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`HTTP ${response.status} (${response.statusText}): ${errorDetail || 'Request failed'}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const parsed = parseSSELine(line, providerId);
      if (parsed) {
        onChunk(parsed);
        if (parsed.isDone) return;
      }
    }
  }

  if (buffer.trim()) {
    const parsed = parseSSELine(buffer, providerId);
    if (parsed) onChunk(parsed);
  }

  onChunk({ delta: '', isDone: true });
}
