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
} from 'lucide-react';

export type ProviderKey = string;

export function ProviderBrandLogo({
  provider,
  size = 20,
}: {
  provider: ProviderKey;
  size?: number;
}) {
  const p = (provider || '').toLowerCase().trim();

  switch (p) {
    // ─── OAuth Providers ────────────────────────────────────────────────
    case 'kimi-coding':
      return <Kimi.Color size={size} />;
    case 'amazon-q':
      return <Aws.Color size={size} />;
    case 'antigravity':
      return <Antigravity.Color size={size} />;
    case 'agy':
      return <Antigravity size={size} />;
    case 'claude':
      return <ClaudeCode.Color size={size} />;
    case 'cline':
    case 'clinepass':
      return <Cline size={size} />;
    case 'codebuddy-cn':
      return <Bot size={size} color="#14b8a6" />;
    case 'devin-cli':
      return <Devin.Color size={size} />;
    case 'github':
    case 'ghe-copilot':
      return <GithubCopilot size={size} />;
    case 'gitlab-duo':
      return <Github size={size} />;
    case 'grok-cli':
    case 'xai-oauth':
      return <Grok size={size} />;
    case 'kilocode':
      return <KiloCode size={size} />;
    case 'kiro':
      return <Kiro.Color size={size} />;
    case 'codex':
      return <Codex.Color size={size} />;
    case 'opencode':
      return <OpenCode size={size} />;
    case 'windsurf':
      return <Windsurf size={size} />;
    case 'qoder':
      return <Qoder.Color size={size} />;

    // ─── IDE Providers ──────────────────────────────────────────────────
    case 'cursor':
      return <Cursor size={size} />;
    case 'trae':
      return <Trae.Color size={size} />;
    case 'zed':
    case 'zed-hosted':
      return <Terminal size={size} color="#38bdf8" />;

    // ─── Web Cookie Providers ───────────────────────────────────────────
    case 'adobe-firefly':
      return <AdobeFirefly.Color size={size} />;
    case 'chatgpt-web':
      return <OpenAI size={size} />;
    case 'claude-web':
      return <Claude.Color size={size} />;
    case 'copilot-web':
    case 'copilot-m365-web':
      return <GithubCopilot size={size} />;
    case 'deepseek-web':
      return <DeepSeek.Color size={size} />;
    case 'doubao-web':
      return <Doubao.Color size={size} />;
    case 'gemini-web':
    case 'gemini-business':
      return <Gemini.Color size={size} />;
    case 'grok-web':
      return <Grok size={size} />;
    case 'hailuo-web':
      return <Hailuo.Color size={size} />;
    case 'huggingchat':
      return <HuggingFace.Color size={size} />;
    case 'microsoft-designer-web':
    case 'muse-spark-web':
      return <Microsoft.Color size={size} />;
    case 'notion-web':
      return <Notion size={size} />;
    case 'perplexity-web':
      return <Perplexity.Color size={size} />;
    case 'poe-web':
      return <Poe.Color size={size} />;
    case 'qwen-web':
      return <Qwen.Color size={size} />;
    case 'v0-vercel-web':
      return <V0 size={size} />;
    case 'venice-web':
      return <Venice.Color size={size} />;
    case 'zai-web':
      return <ZAI size={size} />;
    case 'zenmux-free':
      return <ZenMux size={size} />;
    case 'kimi-web':
      return <Kimi.Color size={size} />;
    case 'lmarena':
    case 'adapta-web':
    case 'blackbox-web':
    case 'felo-web':
    case 'hyperagent':
    case 'inner-ai':
    case 'promptql':
    case 't3-web':
    case 'yuanbao-web':
      return <Globe size={size} color="#60a5fa" />;

    // ─── Aggregator / Gateway Providers ────────────────────────────────
    case 'openrouter':
      return <OpenRouter.Color size={size} />;
    case 'poe':
      return <Poe.Color size={size} />;
    case 'novita':
      return <Novita.Color size={size} />;
    case 'pollinations':
    case 'g4f-pollinations':
      return <Pollinations size={size} />;
    case 'g4f-gemini':
      return <Gemini.Color size={size} />;
    case 'g4f-groq':
      return <Groq size={size} />;
    case 'g4f-nvidia':
      return <Cpu size={size} color="#76b900" />;
    case 'g4f-ollama':
      return <Ollama size={size} />;
    case 'vercel-ai-gateway':
      return <Vercel size={size} />;
    case 'piapi':
    case 'aimlapi':
    case 'agentrouter':
    case 'chutes':
    case 'empower':
    case 'fenayai':
    case 'freetheai':
    case 'getgoapi':
    case 'hackclub':
    case 'kilo-gateway':
    case 'laozhang':
    case 'synthetic':
    case 'thebai':
      return <Network size={size} color="#ec4899" />;

    // ─── Enterprise / Cloud Providers ──────────────────────────────────
    case 'bedrock':
      return <Bedrock.Color size={size} />;
    case 'azure-openai':
    case 'azure-ai':
      return <AzureAI.Color size={size} />;
    case 'vertex':
    case 'vertex-partner':
      return <VertexAI.Color size={size} />;
    case 'snowflake':
      return <Snowflake.Color size={size} />;
    case 'watsonx':
      return <IBM size={size} />;
    case 'databricks':
    case 'heroku':
    case 'clarifai':
    case 'datarobot':
    case 'modal':
    case 'oci':
    case 'sap':
      return <Building2 size={size} color="#f59e0b" />;

    // ─── Cloud Agent Providers ──────────────────────────────────────────
    case 'codex-cloud':
      return <Codex.Color size={size} />;
    case 'devin':
      return <Devin.Color size={size} />;
    case 'jules':
      return <Google.Color size={size} />;

    // ─── Local Inference Providers ──────────────────────────────────────
    case 'ollama-local':
      return <Ollama size={size} />;
    case 'lm-studio':
      return <LmStudio size={size} />;
    case 'vllm':
      return <Vllm.Color size={size} />;
    case 'comfyui':
      return <ComfyUI.Color size={size} />;
    case 'xinference':
      return <Xinference.Color size={size} />;
    case 'llama-cpp':
    case 'llamafile':
    case 'oobabooga':
    case 'sdwebui':
    case 'docker-model-runner':
    case 'lemonade':
    case 'triton':
      return <HardDrive size={size} color="#eab308" />;

    // ─── Search & Web Fetch ─────────────────────────────────────────────
    case 'brave-search':
      return <Brave.Color size={size} />;
    case 'tavily-search':
      return <Tavily.Color size={size} />;
    case 'exa-search':
      return <Exa.Color size={size} />;
    case 'firecrawl':
      return <Firecrawl.Color size={size} />;
    case 'searxng-search':
      return <SearXNG.Color size={size} />;
    case 'jina-ai':
      return <Jina size={size} />;
    case 'ollama-search':
      return <Ollama size={size} />;
    case 'perplexity-search':
      return <Perplexity.Color size={size} />;
    case 'google-pse-search':
      return <Google.Color size={size} />;
    case 'linkup-search':
    case 'searchapi-search':
    case 'serper-search':
    case 'youcom-search':
      return <Search size={size} color="#3b82f6" />;

    // ─── Embeddings ─────────────────────────────────────────────────────
    case 'voyage-ai':
      return <Voyage.Color size={size} />;

    // ─── Image Providers ────────────────────────────────────────────────
    case 'black-forest-labs':
      return <Bfl size={size} />;
    case 'fal-ai':
      return <Fal.Color size={size} />;
    case 'recraft':
      return <Recraft size={size} />;
    case 'stability-ai':
      return <Stability.Color size={size} />;
    case 'topaz':
      return <TopazLabs size={size} />;
    case 'freepik':
    case 'segmind':
      return <ImageIcon size={size} color="#d946ef" />;

    // ─── Audio Providers ────────────────────────────────────────────────
    case 'elevenlabs':
      return <ElevenLabs size={size} />;
    case 'fishaudio':
      return <FishAudio size={size} />;
    case 'assemblyai':
      return <AssemblyAI.Color size={size} />;
    case 'aws-polly':
      return <Aws.Color size={size} />;
    case 'gladia':
    case 'cartesia':
    case 'deepgram':
    case 'inworld':
    case 'playht':
    case 'rev-ai':
    case 'speechmatics':
      return <Volume2 size={size} color="#f43f5e" />;

    // ─── Video Providers ─────────────────────────────────────────────────
    case 'runwayml':
      return <Runway size={size} />;
    case 'haiper':
      return <Haiper size={size} />;
    case 'novita-video':
      return <Novita.Color size={size} />;
    case 'segmind-video':
    case 'leonardo':
    case 'minimax':
      return <Film size={size} color="#ef4444" />;
    case 'together':
      return <Together.Color size={size} />;

    // ─── No-Auth Providers ──────────────────────────────────────────────
    case 'aihorde':
      return <Cpu size={size} color="#10b981" />;
    case 'auggie':
      return <Sparkles size={size} color="#10b981" />;
    case 'duckduckgo-web':
      return <Search size={size} color="#ff6f00" />;
    case 'chipotle':
    case 'mimocode':
    case 'opencode':
    case 'theoldllm':
    case 'veoaifree-web':
      return <Sparkles size={size} color="#10b981" />;

    // ─── Upstream Proxy ─────────────────────────────────────────────────
    case '9router':
    case 'cliproxyapi':
      return <Network size={size} color="#64748b" />;

    // ─── Catch-all with smart prefix matching ───────────────────────────
    default: {
      if (p.includes('claude') || p.includes('anthropic')) return <Claude.Color size={size} />;
      if (p.includes('gpt') || p.includes('openai')) return <OpenAI size={size} />;
      if (p.includes('gemini') || p.includes('google')) return <Gemini.Color size={size} />;
      if (p.includes('deepseek')) return <DeepSeek.Color size={size} />;
      if (p.includes('grok') || p.includes('xai')) return <Grok size={size} />;
      if (p.includes('mistral')) return <Mistral.Color size={size} />;
      if (p.includes('qwen')) return <Qwen.Color size={size} />;
      if (p.includes('kimi') || p.includes('moonshot')) return <Kimi.Color size={size} />;
      if (p.includes('copilot') || p.includes('github')) return <GithubCopilot size={size} />;
      if (p.includes('azure')) return <Azure.Color size={size} />;
      if (p.includes('aws') || p.includes('amazon') || p.includes('bedrock')) return <Aws.Color size={size} />;
      if (p.includes('ollama')) return <Ollama size={size} />;
      if (p.includes('groq')) return <Groq size={size} />;
      if (p.includes('novita')) return <Novita.Color size={size} />;
      if (p.includes('pollinations')) return <Pollinations size={size} />;
      if (p.includes('openrouter')) return <OpenRouter.Color size={size} />;
      if (p.includes('search')) return <Search size={size} color="#60a5fa" />;
      if (p.includes('audio') || p.includes('voice') || p.includes('speech')) return <Volume2 size={size} color="#f43f5e" />;
      if (p.includes('video')) return <Film size={size} color="#ef4444" />;
      if (p.includes('image') || p.includes('img')) return <ImageIcon size={size} color="#d946ef" />;
      if (p.includes('poe')) return <Poe.Color size={size} />;

      return <Sparkles size={size} color="var(--brand-primary, #0073ea)" />;
    }
  }
}
