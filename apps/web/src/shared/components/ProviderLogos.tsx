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
  Bfl,
  Stability,
  ElevenLabs,
  Suno,
  Runway,
  Kling,
  Microsoft,
  Udio,
  Notion,
  Github,
  Google,
  Azure,
  OpenRouter,
  XAI,
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
  | 'bfl'
  | 'stability'
  | 'elevenlabs'
  | 'suno'
  | 'runway'
  | 'kling'
  | 'microsoft'
  | 'udio'
  | 'notion'
  | 'github'
  | 'xai'
  | 'openrouter'
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
    // ─── LLM Providers ───────────────────────────────────────────────
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
    case 'google-gemini':
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
    case 'xai':
    case 'grok':
      return <XAI size={size} />;
    case 'openrouter':
      return <OpenRouter.Color size={size} />;
    // ─── Luma ────────────────────────────────────────────────────────
    case 'luma':
    case 'luma-ai':
    case 'dream-machine':
      return <Luma.Color size={size} />;
    // ─── Imagine Providers ───────────────────────────────────────────
    case 'bfl':
    case 'black-forest-labs':
    case 'flux':
      return <Bfl size={size} />;
    case 'stability':
    case 'stability-ai':
    case 'stable-diffusion':
      return <Stability.Color size={size} />;
    case 'elevenlabs':
      return <ElevenLabs size={size} />;
    case 'suno':
    case 'suno-ai':
      return <Suno size={size} />;
    case 'runway':
    case 'runway-ml':
      return <Runway size={size} />;
    case 'kling':
    case 'kuaishou':
    case 'kuaishou-kling':
      return <Kling.Color size={size} />;
    case 'microsoft':
    case 'microsoft-azure':
    case 'azure-speech':
      return <Microsoft.Color size={size} />;
    case 'udio':
    case 'udio-ai':
      return <Udio.Color size={size} />;
    // ─── Connectors ──────────────────────────────────────────────────
    case 'notion':
      return <Notion size={size} />;
    case 'github':
      return <Github size={size} />;
    case 'google-drive':
    case 'google-calendar':
    case 'gmail':
    case 'google':
      return <Google.Color size={size} />;
    case 'azure':
      return <Azure.Color size={size} />;
    // ─── Fallbacks ───────────────────────────────────────────────────
    case 'custom':
      return <Sliders size={size} color="var(--brand-primary, #0073ea)" />;
    default:
      return <Sliders size={size} color="var(--text-muted)" />;
  }
}
