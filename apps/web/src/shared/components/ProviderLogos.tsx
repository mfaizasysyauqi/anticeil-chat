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
import { Sliders } from 'lucide-react';

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
  | 'luma'
  | 'custom'
  | string;

export function ProviderBrandLogo({
  provider,
  size = 20,
}: {
  provider: ProviderKey;
  size?: number;
}) {
  const p = (provider || '').toLowerCase();

  switch (p) {
    case 'openai':
    case 'chatgpt':
    case 'gpt':
      return <OpenAI size={size} />;
    case 'anthropic':
    case 'claude':
      return <Anthropic size={size} />;
    case 'groq':
      return <Groq size={size} />;
    case 'ollama':
      return <Ollama size={size} />;
    case 'gemini':
    case 'google':
      return <Gemini.Color size={size} />;
    case 'deepseek':
      return <DeepSeek.Color size={size} />;
    case 'mistral':
      return <Mistral.Color size={size} />;
    case 'perplexity':
      return <Perplexity.Color size={size} />;
    case 'huggingface':
    case 'hf':
      return <HuggingFace.Color size={size} />;
    case 'cohere':
      return <Cohere.Color size={size} />;
    case 'luma':
      return <Luma.Color size={size} />;
    case 'custom':
      return <Sliders size={size} color="var(--brand-primary, #0073ea)" />;
    default:
      return <Sliders size={size} color="var(--text-muted)" />;
  }
}
