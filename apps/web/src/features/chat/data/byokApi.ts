import {
  ChatMessage,
  ChatStreamChunk,
  LLMProviderId,
  ProviderApiKeyConfig,
  UserTier,
  getProviderById,
  getTierAiLimits,
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
  maxTokens?: number;
  tier?: UserTier;
  enableWebSearch?: boolean;
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
    maxTokens,
    tier,
    enableWebSearch = false,
    onChunk,
    signal,
  } = options;

  const providerDef = getProviderById(providerId);
  const baseUrl = apiKeyConfig.baseUrl || providerDef?.defaultBaseUrl || '';
  const apiKey = apiKeyConfig.apiKey;

  if (providerDef?.requiresApiKey && !apiKey) {
    throw new Error(`API key is required for ${providerDef.name}. Please configure it in Settings.`);
  }

  // Get active tier limits for token budget protection
  const effectiveTier: UserTier =
    tier ||
    (typeof window !== 'undefined' && (localStorage.getItem('anticeil_user_tier') as UserTier)) ||
    'free';
  const tierAiLimits = getTierAiLimits(effectiveTier);

  // Format messages into common structure and filter empty content
  let rawFormatted = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content && m.content.trim())
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.trim(),
    }));

  // For built-in Anticeil provider: enforce developer token & cost protection limits
  if (providerId === 'anticeil') {
    if (rawFormatted.length > tierAiLimits.maxHistoryMessages) {
      rawFormatted = rawFormatted.slice(-tierAiLimits.maxHistoryMessages);
    }
    rawFormatted = rawFormatted.map((m) => ({
      role: m.role,
      content:
        m.content.length > tierAiLimits.maxInputChars
          ? m.content.slice(0, tierAiLimits.maxInputChars) + '\n...[truncated for token optimization]'
          : m.content,
    }));
  }

  // Merge consecutive same-role messages to guarantee strict role alternation (required by Gemini & Anthropic)
  const formattedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (const m of rawFormatted) {
    if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === m.role) {
      formattedMessages[formattedMessages.length - 1].content += `\n\n${m.content}`;
    } else {
      formattedMessages.push({ role: m.role, content: m.content });
    }
  }

  const effectiveSystemPrompt = systemPrompt
    ? `${systemPrompt}\n\n${BASE_LANGUAGE_INSTRUCTION}`
    : `You are a helpful and intelligent AI assistant. ${BASE_LANGUAGE_INSTRUCTION}`;

  let response: Response;

  // 0. Anticeil Free Multi-Provider Gateway (Google Gemini + Groq Cloud LPU)
  if (providerId === 'anticeil') {
    const isGeminiModel = modelId.startsWith('gemini') || modelId.includes('gemini');

    if (isGeminiModel) {
      const geminiKey = apiKey || getNextFreeKey('gemini');
      const geminiBaseUrl = baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
      const endpoint = `${geminiBaseUrl.replace(/\/+$/, '')}/models/${modelId}:streamGenerateContent?alt=sse&key=${geminiKey}`;
      const contents = formattedMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const anticeilBody: Record<string, unknown> = {
        contents,
        systemInstruction: { parts: [{ text: effectiveSystemPrompt }] },
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens || tierAiLimits.maxOutputTokens,
        },
      };
      // Native Google Search Grounding — no external API needed
      if (enableWebSearch) anticeilBody.tools = [{ googleSearch: {} }];

      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anticeilBody),
        signal,
      });
    } else {
      // Groq Models
      const groqKey = apiKey || getNextFreeKey('groq');
      const groqBaseUrl = baseUrl || 'https://api.groq.com/openai/v1';
      const endpoint = `${groqBaseUrl.replace(/\/+$/, '')}/chat/completions`;
      const payloadMessages = [
        { role: 'system', content: effectiveSystemPrompt },
        ...formattedMessages,
      ];

      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages: payloadMessages,
          temperature,
          max_tokens: maxTokens || tierAiLimits.maxOutputTokens,
          stream: true,
        }),
        signal,
      });
    }
  }

  // 1. OpenAI / Groq / DeepSeek / OpenRouter / Together / Fireworks / Mistral / xAI / Perplexity / Cohere / Custom Endpoint
  else if (
    providerId === 'openai' ||
    providerId === 'groq' ||
    providerId === 'deepseek' ||
    providerId === 'openrouter' ||
    providerId === 'together' ||
    providerId === 'fireworks' ||
    providerId === 'mistral' ||
    providerId === 'xai' ||
    providerId === 'perplexity' ||
    providerId === 'cohere' ||
    providerId === 'omniroute' ||
    providerId === 'custom'
  ) {
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
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
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
        max_tokens: maxTokens || 4096,
        temperature,
        stream: true,
      }),
      signal,
    });
  }

  // 3. Google Gemini API (BYOK)
  else if (providerId === 'gemini') {
    const endpoint = `${baseUrl.replace(/\/+$/, '')}/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const contents = formattedMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const geminiBody: Record<string, unknown> = {
      contents,
      systemInstruction: { parts: [{ text: effectiveSystemPrompt }] },
      generationConfig: {
        temperature,
        ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
      },
    };
    // Native Google Search Grounding — no external API needed
    if (enableWebSearch) geminiBody.tools = [{ googleSearch: {} }];

    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
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
          ...(maxTokens ? { num_predict: maxTokens } : {}),
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
