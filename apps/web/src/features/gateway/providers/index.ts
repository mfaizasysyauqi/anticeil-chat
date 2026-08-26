import { NOAUTH_PROVIDERS } from './noauth';
import { OAUTH_PROVIDERS } from './oauth';
import { WEB_COOKIE_PROVIDERS } from './webCookie';
import { APIKEY_PROVIDERS } from './apikey';
import { LOCAL_PROVIDERS } from './local';
import { SEARCH_PROVIDERS } from './search';
import { AUDIO_PROVIDERS } from './audio';
import { GatewayProvider, ProviderCategory } from './types';

export * from './types';
export * from './noauth';
export * from './oauth';
export * from './webCookie';
export * from './apikey';
export * from './local';
export * from './search';
export * from './audio';

export const ALL_GATEWAY_PROVIDERS: GatewayProvider[] = [
  ...NOAUTH_PROVIDERS,
  ...OAUTH_PROVIDERS,
  ...WEB_COOKIE_PROVIDERS,
  ...APIKEY_PROVIDERS,
  ...LOCAL_PROVIDERS,
  ...SEARCH_PROVIDERS,
  ...AUDIO_PROVIDERS,
];

export const PROVIDER_MAP = new Map<string, GatewayProvider>(
  ALL_GATEWAY_PROVIDERS.map((p) => [p.id, p])
);

export function getGatewayProviderById(id: string): GatewayProvider | undefined {
  return PROVIDER_MAP.get(id);
}

export function getProvidersByCategory(category: ProviderCategory): GatewayProvider[] {
  return ALL_GATEWAY_PROVIDERS.filter((p) => p.category === category);
}

export const PROVIDER_CATEGORY_LABELS: Record<ProviderCategory, { label: string; icon: string; description: string }> = {
  'no-auth': {
    label: 'Tingkat Gratis (No-Auth)',
    icon: 'Sparkles',
    description: 'Endpoint publik gratis tanpa perlu akun atau API Key — langsung aktif.',
  },
  oauth: {
    label: 'OAuth2 & IDE Tokens',
    icon: 'ShieldCheck',
    description: 'Koneksi sekali masuk lewat token GitHub Copilot, Cursor IDE, Claude Code, dan Windsurf.',
  },
  'web-cookie': {
    label: 'Web Cookie Sessions',
    icon: 'Cookie',
    description: 'Gunakan sesi browser akun web Anda (ChatGPT Plus, Claude.ai, DeepSeek Web, Gemini Web).',
  },
  apikey: {
    label: 'Kunci API (192+)',
    icon: 'Key',
    description: 'Konektor standar API key untuk Cerebras, SambaNova, Cloudflare AI, GitHub Models, OpenAI, dll.',
  },
  local: {
    label: 'Lokal PC & Mesin Pribadi',
    icon: 'HardDrive',
    description: 'Jalankan model lokal pribadi offline dengan Ollama, LM Studio, dan vLLM.',
  },
  search: {
    label: 'Pencarian & RAG Web',
    icon: 'Search',
    description: 'Penyedia indeks pencarian internet dan crawler untuk melengkapi konteks jawaban AI.',
  },
  audio: {
    label: 'Audio & Text-to-Speech',
    icon: 'Volume2',
    description: 'Sintesis suara ultra-realistis dan transkripsi audio real-time.',
  },
};
