import { LLMProviderId, ChatStreamChunk } from '../types';

export function parseSSELine(line: string, providerId: LLMProviderId): ChatStreamChunk | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(':')) return null;

  if (trimmed === 'data: [DONE]' || trimmed === 'event: done') {
    return { delta: '', isDone: true };
  }

  if (trimmed.startsWith('data: ')) {
    const jsonStr = trimmed.slice(6);
    try {
      const data = JSON.parse(jsonStr);

      // Anticeil multi-model support (auto-detect Gemini vs Groq/OpenAI response format)
      if (providerId === 'anticeil') {
        if (data.candidates && Array.isArray(data.candidates)) {
          const candidate = data.candidates[0];
          const parts = candidate?.content?.parts || [];
          let delta = '';
          let reasoningDelta = '';

          for (const part of parts) {
            if (part.thought) {
              reasoningDelta += part.thought;
            } else if (part.text) {
              delta += part.text;
            }
          }

          const isDone = candidate?.finishReason !== undefined && candidate?.finishReason !== null;
          return {
            delta,
            reasoningDelta,
            isDone,
            promptTokens: data.usageMetadata?.promptTokenCount,
            completionTokens: data.usageMetadata?.candidatesTokenCount,
          };
        }

        if (data.choices && Array.isArray(data.choices)) {
          const choice = data.choices[0];
          if (!choice) return null;

          const delta = choice.delta?.content || choice.text || '';
          const reasoningDelta =
            choice.delta?.reasoning_content ||
            choice.delta?.reasoning ||
            choice.delta?.thought ||
            '';
          const isDone = choice.finish_reason !== null && choice.finish_reason !== undefined;
          const promptTokens = data.usage?.prompt_tokens;
          const completionTokens = data.usage?.completion_tokens;

          return {
            delta,
            reasoningDelta,
            isDone,
            promptTokens,
            completionTokens,
          };
        }
      }

      // OpenAI / Groq / DeepSeek / OpenRouter / Together / Fireworks / Mistral / xAI / Perplexity / Cohere / Custom
      if (
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
        const choice = data.choices?.[0];
        if (!choice) return null;

        const delta = choice.delta?.content || choice.text || '';
        const reasoningDelta =
          choice.delta?.reasoning_content ||
          choice.delta?.reasoning ||
          choice.delta?.thought ||
          '';
        const isDone = choice.finish_reason !== null && choice.finish_reason !== undefined;
        const promptTokens = data.usage?.prompt_tokens;
        const completionTokens = data.usage?.completion_tokens;

        return {
          delta,
          reasoningDelta,
          isDone,
          promptTokens,
          completionTokens,
        };
      }

      // Anthropic SSE format
      if (providerId === 'anthropic') {
        if (data.type === 'content_block_delta') {
          if (data.delta?.type === 'text_delta') {
            return { delta: data.delta.text || '', isDone: false };
          }
          if (data.delta?.type === 'thinking_delta') {
            return { delta: '', reasoningDelta: data.delta.thinking || '', isDone: false };
          }
        }
        if (data.type === 'message_delta') {
          const isDone = data.delta?.stop_reason !== null && data.delta?.stop_reason !== undefined;
          return {
            delta: '',
            isDone,
            completionTokens: data.usage?.output_tokens,
          };
        }
        if (data.type === 'message_stop') {
          return { delta: '', isDone: true };
        }
      }

      // Gemini SSE format
      if (providerId === 'gemini') {
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        let delta = '';
        let reasoningDelta = '';

        for (const part of parts) {
          if (part.thought) {
            reasoningDelta += part.thought;
          } else if (part.text) {
            delta += part.text;
          }
        }

        const isDone = candidate?.finishReason !== undefined && candidate?.finishReason !== null;
        return {
          delta,
          reasoningDelta,
          isDone,
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount,
        };
      }

      // Ollama SSE/JSON stream format
      if (providerId === 'ollama') {
        const delta = data.message?.content || data.response || '';
        const reasoningDelta = data.message?.reasoning || '';
        return {
          delta,
          reasoningDelta,
          isDone: data.done || false,
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
        };
      }
    } catch {
      // Ignored malformed JSON lines
      return null;
    }
  }

  return null;
}

/**
 * Strips all internal model agentic XML tags (<think>, <tool>, <output>, <call>) from main content
 * and routes them into structured reasoning steps while filtering out web scraping noise & SVG dumps.
 * Guaranteed 100% memory safe with ZERO infinite loop risk.
 */
export function cleanAgenticStream(
  rawAccumulatedText: string,
  rawAccumulatedReasoning: string,
  isDone: boolean
): { cleanContent: string; reasoningContent: string } {
  let combinedReasoning = rawAccumulatedReasoning || '';
  let text = rawAccumulatedText || '';

  // 1. Extract closed <think>...</think> blocks safely without while(exec)
  text = text.replace(/<think>([\s\S]*?)<\/think>/gi, (_, thought) => {
    const trimmed = thought.trim();
    if (trimmed && !combinedReasoning.includes(trimmed)) {
      combinedReasoning = combinedReasoning ? `${combinedReasoning}\n${trimmed}` : trimmed;
    }
    return '';
  });

  // 2. Extract <tool>...</tool> blocks
  text = text.replace(/<tool>([\s\S]*?)(?:<\/tool>|<\/think>|$)/gi, (_, toolCall) => {
    const cleanCall = toolCall
      .trim()
      .replace(/^python\(print\(([\s\S]*?)\)\)$/gi, '$1')
      .replace(/^python\(([\s\S]*?)\)$/gi, '$1');

    if (cleanCall) {
      const summary = cleanCall.startsWith('search(')
        ? `Searched web for ${cleanCall.slice(7, 70).replace(/\)$/, '')}`
        : `Ran tool: ${cleanCall.slice(0, 100)}`;
      combinedReasoning = combinedReasoning ? `${combinedReasoning}\n${summary}` : summary;
    }
    return '';
  });

  // 3. Extract <output>...</output> blocks
  text = text.replace(/<output>([\s\S]*?)(?:<\/output>|<\/think>|$)/gi, (_, outputText) => {
    const titleMatch = outputText.match(/Title:\s*([^\n]+)/i);
    const summary = titleMatch
      ? `Retrieved info: ${titleMatch[1].slice(0, 70).trim()}`
      : 'Retrieved search results';

    combinedReasoning = combinedReasoning ? `${combinedReasoning}\n${summary}` : summary;
    return '';
  });

  // 4. If streaming and an open <think> exists at the end of text
  if (!isDone) {
    const openThinkIdx = text.lastIndexOf('<think>');
    if (openThinkIdx !== -1) {
      const openThought = text.slice(openThinkIdx + 7).trim();
      if (openThought && !combinedReasoning.includes(openThought)) {
        combinedReasoning = combinedReasoning ? `${combinedReasoning}\n${openThought}` : openThought;
      }
      text = text.slice(0, openThinkIdx);
    }
  } else {
    // When done, remove any remaining dangling <think> tag
    text = text.replace(/<think>[\s\S]*?$/gi, (dangling) => {
      const thought = dangling.replace(/^<think>/i, '').trim();
      if (thought && !combinedReasoning.includes(thought)) {
        combinedReasoning = combinedReasoning ? `${combinedReasoning}\n${thought}` : thought;
      }
      return '';
    });
  }

  // 5. Strip all remaining XML tags, Python calls, and tool artifacts from user-facing text
  text = text
    .replace(/<\/?(?:think|tool|output|call|function_call|tool_call)[^>]*>/gi, '')
    .replace(/python\(print\([\s\S]*?\)\)/gi, '')
    .replace(/python\([\s\S]*?\)/gi, '')
    .trim();

  // 6. Sanitize reasoning noise (SVG paths, HTML audio warnings, score floats)
  combinedReasoning = sanitizeReasoningString(combinedReasoning);

  // 7. If stream is done and text was empty (model placed entire response inside thought/tool)
  if (isDone && !text && combinedReasoning) {
    const cleanedAnswer = combinedReasoning
      .replace(/^Ran tool:[\s\S]*?(?=\n\n|\n(?=[A-Z])|$)/gim, '')
      .replace(/^Searched web[\s\S]*?(?=\n\n|\n(?=[A-Z])|$)/gim, '')
      .replace(/^Retrieved info[\s\S]*?(?=\n\n|\n(?=[A-Z])|$)/gim, '')
      .replace(/^Tool output:[\s\S]*?(?=\n\n|\n(?=[A-Z])|$)/gim, '')
      .trim();

    text = cleanedAnswer || combinedReasoning;
  }

  return {
    cleanContent: text,
    reasoningContent: combinedReasoning.trim(),
  };
}

/**
 * Removes raw HTML boilerplate, SVG paths, score floats, and web scrapings from reasoning.
 */
export function sanitizeReasoningString(raw: string): string {
  return raw
    .replace(/<\/?(?:think|tool|output|call|function_call|tool_call)[^>]*>/gi, '')
    .replace(/%3Cpath[\s\S]*?%3E/gi, '')
    .replace(/<path[\s\S]*?>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/Your browser doesn't support HTML5 audio/gi, '')
    .replace(/Score:\s*0\.\d+/gi, '')
    .replace(/stop-opacity='[^']*'/gi, '')
    .replace(/gradientUnits='[^']*'/gi, '')
    .replace(/radialGradient[\s\S]*?<\/defs>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
