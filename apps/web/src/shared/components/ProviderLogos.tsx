'use client';

import React from 'react';
import {
  OpenAI,
  Anthropic,
  Gemini,
  Groq,
  DeepSeek,
  Ollama,
  Mistral,
  Perplexity,
  HuggingFace,
  Cohere,
  Luma,
} from '@lobehub/icons';

// Unified dispatcher — used by page.tsx renderLucideIcon()
// Each provider uses its available variant:
//   .Color  → brand-color SVG (not all providers have this)
//   default → mono/outline version (always available)
export type ProviderKey =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq'
  | 'deepseek'
  | 'ollama'
  | 'mistral'
  | 'perplexity'
  | 'huggingface'
  | 'cohere'
  | 'luma';

export function ProviderBrandLogo({
  provider,
  size = 20,
}: {
  provider: ProviderKey;
  size?: number;
}) {
  switch (provider) {
    // Mono-only (no .Color variant in this version)
    case 'openai':      return <OpenAI size={size} />;
    case 'anthropic':   return <Anthropic size={size} />;
    case 'groq':        return <Groq size={size} />;
    case 'ollama':      return <Ollama size={size} />;
    // Color variants available
    case 'gemini':      return <Gemini.Color size={size} />;
    case 'deepseek':    return <DeepSeek.Color size={size} />;
    case 'mistral':     return <Mistral.Color size={size} />;
    case 'perplexity':  return <Perplexity.Color size={size} />;
    case 'huggingface': return <HuggingFace.Color size={size} />;
    case 'cohere':      return <Cohere.Color size={size} />;
    case 'luma':        return <Luma.Color size={size} />;
    default:            return null;
  }
}
