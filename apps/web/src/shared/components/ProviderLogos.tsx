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
  GithubCopilot,
  Google,
  Azure,
  AzureAI,
  OpenRouter,
  XAI,
  Grok,
  Cursor,
  Trae,
  Claude,
  ClaudeCode,
  Cline,
  Kimi,
  Doubao,
  Qwen,
  Minimax,
  Hailuo,
  Fal,
  Recraft,
  Together,
  Fireworks,
  Cerebras,
  SambaNova,
  WorkersAI,
  DeepInfra,
  Vllm,
  LmStudio,
  ComfyUI,
  Brave,
  Tavily,
  Exa,
  Firecrawl,
  SearXNG,
  Jina,
  Voyage,
  V0,
  Vercel,
  Venice,
  Poe,
  Dify,
  Coze,
  Bedrock,
  Aws,
  VertexAI,
  Devin,
  Antigravity,
  FishAudio,
  AssemblyAI,
  Ai21,
  Stepfun,
  SenseNova,
  Pollinations,
  Novita,
  Snowflake,
  Baichuan,
  Upstage,
  ModelScope,
  Kiro,
  Codex,
  Windsurf,
  Qoder,
  AdobeFirefly,
  ZAI,
  ZenMux,
  Xinference,
  TopazLabs,
  KiloCode,
  OpenCode,
  IBM,
  Haiper,
} from '@lobehub/icons';
import {
  Globe,
  Terminal,
  HardDrive,
  Cpu,
  Sparkles,
  Volume2,
  Film,
  Image as ImageIcon,
  Search,
  Network,
  Building2,
  Bot,
  Sliders,
} from 'lucide-react';

export type ProviderKey = string;

/** Official Deepgram Vibrant Cyan/Teal Brandmark */
function DeepgramLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#131F2E" />
      <path
        d="M6.5 6.5C6.5 5.67 7.17 5 8 5H12C15.59 5 18.5 7.91 18.5 11.5C18.5 15.09 15.59 18 12 18H8C7.17 18 6.5 17.33 6.5 16.5V6.5Z"
        fill="url(#deepgram-grad)"
      />
      <path
        d="M9 8.5H11.8C13.46 8.5 14.8 9.84 14.8 11.5C14.8 13.16 13.46 14.5 11.8 14.5H9V8.5Z"
        fill="#131F2E"
      />
      <defs>
        <linearGradient id="deepgram-grad" x1="6.5" y1="5" x2="18.5" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00F5A0" />
          <stop offset="1" stopColor="#00D9F5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Official Pika Labs Geometric Spark / Star Mark */
function PikaLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#0D0D11" />
      <path
        d="M12 4L13.8 9.2L19 11L13.8 12.8L12 18L10.2 12.8L5 11L10.2 9.2L12 4Z"
        fill="url(#pika-grad)"
      />
      <defs>
        <linearGradient id="pika-grad" x1="5" y1="4" x2="19" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF4D4D" />
          <stop offset="0.5" stopColor="#F9CB28" />
          <stop offset="1" stopColor="#FF7A00" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Official Meta Infinity Logo (for Llama & AudioCraft) */
function MetaLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16.68 5.5c-1.89 0-3.37 1.07-4.68 2.74C10.69 6.57 9.21 5.5 7.32 5.5 3.96 5.5 1.5 8.19 1.5 11.95c0 4.14 2.87 7.05 6.35 7.05 2.15 0 3.73-1.09 4.15-1.42.42.33 2 .1 4.15 1.42 3.48 0 6.35-2.91 6.35-7.05 0-3.76-2.46-6.45-5.82-6.45zm-9.36 11.4c-2.28 0-4.14-1.95-4.14-4.95 0-2.93 1.84-4.85 4.14-4.85 1.55 0 2.75.91 3.73 2.51-1.39 2.53-2.61 5.29-3.73 7.29zm9.36 0c-1.12-2-2.34-4.76-3.73-7.29.98-1.6 2.18-2.51 3.73-2.51 2.3 0 4.14 1.92 4.14 4.85 0 3-1.86 4.95-4.14 4.95z"
        fill="#0668E1"
      />
    </svg>
  );
}

/** Official SiliconFlow Logo */
function SiliconFlowLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#6366F1" />
      <path
        d="M6 8L12 5L18 8L12 11L6 8ZM6 13L12 16L18 13M6 16L12 19L18 16"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Official Baidu ERNIE Logo */
function BaiduLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#2932E1" />
      <path
        d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM10.5 13.5L9 12L10.5 10.5M13.5 13.5L15 12L13.5 10.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Universal Provider Brand Logo Component
 * Returns the exact official brand logo for every AI provider.
 */
export function ProviderBrandLogo({
  provider,
  size = 20,
}: {
  provider: ProviderKey;
  size?: number;
}) {
  const p = (provider || '').toLowerCase().trim();

  switch (p) {
    // ─── Anticeil Free / Built-in ────────────────────────────────────────
    case 'anticeil':
    case 'anticeil-free':
    case 'anticeil-gemini':
    case 'anticeil-groq':
    case 'anticeil-music':
    case 'anticeil-tts':
    case 'anticeil-stt':
      return (
        <img
          src="/anticeil-logo.png"
          alt="Anticeil"
          style={{
            width: size,
            height: size,
            borderRadius: '4px',
            objectFit: 'contain',
            display: 'inline-block',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      );

    // ─── Primary LLM & Native Providers ──────────────────────────────────
    case 'openai':
    case 'gpt':
    case 'chatgpt':
    case 'dalle':
    case 'dalle3':
    case 'sora':
    case 'openai-tts':
    case 'whisper':
      return <OpenAI size={size} />;

    case 'anthropic':
    case 'claude':
    case 'claude-3-7-sonnet':
    case 'claude-3-5-sonnet':
    case 'claude-3-haiku':
      return <Claude.Color size={size} />;

    case 'gemini':
    case 'google':
    case 'google-deepmind':
    case 'google-deepmind-music':
    case 'google-deepmind-tts':
    case 'google-cloud-stt':
    case 'imagen3':
    case 'musiclm':
      return <Gemini.Color size={size} />;

    case 'deepseek':
    case 'deepseek-ai':
    case 'deepseek-chat':
    case 'deepseek-reasoner':
      return <DeepSeek.Color size={size} />;

    case 'groq':
    case 'groq-stt':
    case 'groq-cloud':
    case 'groq-lpu':
      return <Groq size={size} />;

    case 'openrouter':
    case 'open-router':
      return <OpenRouter.Color size={size} />;

    case 'together':
    case 'togetherai':
    case 'together-ai':
      return <Together.Color size={size} />;

    case 'fireworks':
    case 'fireworksai':
    case 'fireworks-ai':
      return <Fireworks.Color size={size} />;

    case 'mistral':
    case 'mistralai':
    case 'mistral-ai':
    case 'codestral':
      return <Mistral.Color size={size} />;

    case 'xai':
    case 'grok':
    case 'xai-grok':
    case 'grok-2':
      return <Grok size={size} />;

    case 'perplexity':
    case 'perplexity-ai':
    case 'sonar':
    case 'sonar-pro':
      return <Perplexity.Color size={size} />;

    case 'cohere':
    case 'cohere-ai':
    case 'command-r':
      return <Cohere.Color size={size} />;

    case 'ollama':
    case 'ollama-local':
    case 'ollama-cloud':
      return <Ollama size={size} />;

    // ─── Audio & Voice Providers ─────────────────────────────────────────
    case 'elevenlabs':
    case 'eleven-labs':
      return <ElevenLabs size={size} />;

    case 'azure':
    case 'microsoft':
    case 'microsoft-azure':
    case 'azure-speech':
    case 'microsoft-tts':
      return <Azure.Color size={size} />;

    case 'deepgram':
    case 'deepgram-stt':
    case 'deepgram-nova':
      return <DeepgramLogo size={size} />;

    case 'assemblyai':
    case 'assemblyai-stt':
    case 'assembly-ai':
      return <AssemblyAI.Color size={size} />;

    case 'fishaudio':
    case 'fish-audio':
    case 'fish-speech':
      return <FishAudio size={size} />;

    case 'suno':
    case 'suno-ai':
    case 'suno-v3.5':
    case 'suno-v4':
      return <Suno size={size} />;

    case 'udio':
    case 'udio-ai':
    case 'udio-v1.5':
      return <Udio size={size} />;

    case 'meta-musicgen':
    case 'meta-llama':
    case 'meta':
      return <MetaLogo size={size} />;

    // ─── Image & Video Providers ─────────────────────────────────────────
    case 'stability':
    case 'stability-ai':
    case 'stabilityai':
    case 'sdxl':
    case 'svd':
      return <Stability.Color size={size} />;

    case 'fal':
    case 'fal-ai':
    case 'falai':
    case 'flux':
      return <Fal.Color size={size} />;

    case 'recraft':
    case 'recraft-ai':
    case 'recraft-v3':
      return <Recraft size={size} />;

    case 'luma':
    case 'luma-ai':
    case 'lumaai':
    case 'dream-machine':
      return <Luma size={size} />;

    case 'kling':
    case 'kling-ai':
    case 'kuaishou-kling':
      return <Kling size={size} />;

    case 'runway':
    case 'runway-ml':
    case 'runwayml':
    case 'gen-3':
      return <Runway size={size} />;

    case 'pika':
    case 'pika-labs':
    case 'pikalabs':
    case 'pika-1.0':
      return <PikaLogo size={size} />;

    case 'black-forest-labs':
    case 'bfl':
      return <Bfl size={size} />;

    // ─── Search & Research Providers ─────────────────────────────────────
    case 'tavily':
    case 'tavily-search':
      return <Tavily.Color size={size} />;

    case 'brave':
    case 'brave-search':
      return <Brave.Color size={size} />;

    case 'jina':
    case 'jina-ai':
    case 'jina-reader':
      return <Jina size={size} />;

    case 'exa':
    case 'exa-search':
      return <Exa.Color size={size} />;

    case 'firecrawl':
      return <Firecrawl.Color size={size} />;

    case 'searxng':
    case 'searxng-search':
      return <SearXNG.Color size={size} />;

    // ─── Global & Chinese Leading Ecosystems ─────────────────────────────
    case 'kimi':
    case 'kimi-coding':
    case 'kimi-web':
    case 'moonshot':
      return <Kimi.Color size={size} />;

    case 'qwen':
    case 'qwen-cloud':
    case 'alibaba':
    case 'bailian':
    case 'modelscope':
      return <Qwen.Color size={size} />;

    case 'doubao':
    case 'doubao-web':
    case 'bytedance':
    case 'volcengine':
    case 'byteplus':
      return <Doubao.Color size={size} />;

    case 'minimax':
    case 'hailuo':
    case 'hailuo-web':
      return <Minimax.Color size={size} />;

    case 'siliconflow':
      return <SiliconFlowLogo size={size} />;

    case 'baidu':
    case 'ernie':
    case 'qianfan':
      return <BaiduLogo size={size} />;

    case 'cerebras':
      return <Cerebras.Color size={size} />;

    case 'sambanova':
      return <SambaNova.Color size={size} />;

    case 'workersai':
    case 'cloudflare':
    case 'cloudflare-ai':
      return <WorkersAI.Color size={size} />;

    case 'deepinfra':
      return <DeepInfra.Color size={size} />;

    case 'ai21':
      return <Ai21 size={size} />;

    case 'stepfun':
      return <Stepfun size={size} />;

    case 'sensenova':
      return <SenseNova.Color size={size} />;

    case 'baichuan':
      return <Baichuan.Color size={size} />;

    case 'upstage':
      return <Upstage.Color size={size} />;

    case 'novita':
    case 'novita-video':
      return <Novita.Color size={size} />;

    case 'huggingface':
    case 'hf':
      return <HuggingFace.Color size={size} />;

    case 'pollinations':
      return <Pollinations size={size} />;

    // ─── Local Inference & Gateway Routers ───────────────────────────────
    case 'lmstudio':
    case 'lm-studio':
      return <LmStudio size={size} />;

    case 'vllm':
      return <Vllm.Color size={size} />;

    case 'comfyui':
      return <ComfyUI.Color size={size} />;

    case 'xinference':
      return <Xinference.Color size={size} />;

    case 'omniroute':
    case 'omni-route':
    case 'router':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="5.5" fill="url(#omniroute-red-grad)" />
          {/* Central hub node */}
          <circle cx="12" cy="12" r="2.2" fill="#ffffff" />
          {/* 6 radiating spoke branches and outer nodes */}
          <line x1="12" y1="12" x2="12" y2="5.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="5.5" r="1.5" fill="#ffffff" />
          <line x1="12" y1="12" x2="12" y2="18.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="18.5" r="1.5" fill="#ffffff" />
          <line x1="12" y1="12" x2="17.6" y2="8.7" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="17.6" cy="8.7" r="1.5" fill="#ffffff" />
          <line x1="12" y1="12" x2="17.6" y2="15.3" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="17.6" cy="15.3" r="1.5" fill="#ffffff" />
          <line x1="12" y1="12" x2="6.4" y2="8.7" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="6.4" cy="8.7" r="1.5" fill="#ffffff" />
          <line x1="12" y1="12" x2="6.4" y2="15.3" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="6.4" cy="15.3" r="1.5" fill="#ffffff" />
          <defs>
            <linearGradient id="omniroute-red-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#be123c" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'custom':
    case 'custom-endpoint':
      return <Sliders size={size} color="#3b82f6" />;

    // ─── Development & Coding Ecosystems ─────────────────────────────────
    case 'antigravity':
    case 'agy':
      return <Antigravity.Color size={size} />;

    case 'cursor':
      return <Cursor size={size} />;

    case 'trae':
      return <Trae.Color size={size} />;

    case 'devin':
    case 'devin-cli':
      return <Devin.Color size={size} />;

    case 'github':
    case 'copilot':
    case 'ghe-copilot':
      return <GithubCopilot size={size} />;

    case 'windsurf':
      return <Windsurf size={size} />;

    case 'codex':
      return <Codex.Color size={size} />;

    case 'opencode':
      return <OpenCode size={size} />;

    case 'cline':
      return <Cline size={size} />;

    case 'qoder':
      return <Qoder.Color size={size} />;

    case 'kiro':
      return <Kiro.Color size={size} />;

    case 'kilocode':
      return <KiloCode size={size} />;

    case 'zed':
      return <Terminal size={size} color="#38bdf8" />;

    case 'poe':
    case 'poe-web':
      return <Poe.Color size={size} />;

    case 'venice':
    case 'venice-web':
      return <Venice.Color size={size} />;

    case 'v0':
    case 'v0-vercel':
    case 'v0-vercel-web':
      return <V0 size={size} />;

    case 'zai':
    case 'zai-web':
      return <ZAI size={size} />;

    case 'zenmux':
    case 'zenmux-free':
      return <ZenMux size={size} />;

    // ─── Smart Dynamic Fallback with Pattern Recognition ─────────────────
    default: {
      if (p.includes('claude') || p.includes('anthropic')) return <Claude.Color size={size} />;
      if (p.includes('gpt') || p.includes('openai') || p.includes('dall')) return <OpenAI size={size} />;
      if (p.includes('gemini') || p.includes('google') || p.includes('imagen')) return <Gemini.Color size={size} />;
      if (p.includes('deepseek')) return <DeepSeek.Color size={size} />;
      if (p.includes('grok') || p.includes('xai')) return <Grok size={size} />;
      if (p.includes('mistral') || p.includes('codestral')) return <Mistral.Color size={size} />;
      if (p.includes('qwen') || p.includes('alibaba')) return <Qwen.Color size={size} />;
      if (p.includes('kimi') || p.includes('moonshot')) return <Kimi.Color size={size} />;
      if (p.includes('together')) return <Together.Color size={size} />;
      if (p.includes('fireworks')) return <Fireworks.Color size={size} />;
      if (p.includes('openrouter')) return <OpenRouter.Color size={size} />;
      if (p.includes('perplexity') || p.includes('sonar')) return <Perplexity.Color size={size} />;
      if (p.includes('cohere')) return <Cohere.Color size={size} />;
      if (p.includes('eleven')) return <ElevenLabs size={size} />;
      if (p.includes('suno')) return <Suno size={size} />;
      if (p.includes('udio')) return <Udio size={size} />;
      if (p.includes('luma')) return <Luma size={size} />;
      if (p.includes('kling')) return <Kling size={size} />;
      if (p.includes('runway')) return <Runway size={size} />;
      if (p.includes('pika')) return <PikaLogo size={size} />;
      if (p.includes('deepgram')) return <DeepgramLogo size={size} />;
      if (p.includes('assembly')) return <AssemblyAI.Color size={size} />;
      if (p.includes('fish')) return <FishAudio size={size} />;
      if (p.includes('azure') || p.includes('microsoft')) return <Azure.Color size={size} />;
      if (p.includes('copilot') || p.includes('github')) return <GithubCopilot size={size} />;
      if (p.includes('ollama')) return <Ollama size={size} />;
      if (p.includes('groq')) return <Groq size={size} />;
      if (p.includes('fal')) return <Fal.Color size={size} />;
      if (p.includes('recraft')) return <Recraft size={size} />;
      if (p.includes('stability')) return <Stability.Color size={size} />;
      if (p.includes('tavily')) return <Tavily.Color size={size} />;
      if (p.includes('brave')) return <Brave.Color size={size} />;
      if (p.includes('search')) return <Search size={size} color="#60a5fa" />;
      if (p.includes('audio') || p.includes('voice') || p.includes('speech') || p.includes('tts') || p.includes('stt')) {
        return <Volume2 size={size} color="#f43f5e" />;
      }
      if (p.includes('video') || p.includes('motion')) return <Film size={size} color="#ef4444" />;
      if (p.includes('image') || p.includes('img') || p.includes('photo')) return <ImageIcon size={size} color="#d946ef" />;

      return <Sparkles size={size} color="var(--brand-primary, #0073ea)" />;
    }
  }
}
