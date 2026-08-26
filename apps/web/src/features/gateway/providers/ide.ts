import { GatewayProvider } from './types';

export const IDE_PROVIDERS: GatewayProvider[] = [
  {
    id: 'cursor',
    name: 'Cursor IDE',
    category: 'ide',
    authType: 'oauth',
    badge: 'IDE',
    description: 'Imports credentials directly from local Cursor IDE keychain to route Cursor AI models.',
    website: 'https://cursor.com',
    models: ['cursor/claude-3-7-sonnet', 'cursor/cursor-small', 'cursor/cursor-fast'],
    requiresOAuth: true,
  },
  {
    id: 'trae',
    name: 'Trae',
    category: 'ide',
    authType: 'oauth',
    badge: 'IDE',
    description: 'Adaptive AI-native IDE credentials bridge for continuous code completion and chat.',
    website: 'https://trae.ai',
    models: ['trae/claude-3-5-sonnet', 'trae/gpt-4o'],
    requiresOAuth: true,
  },
  {
    id: 'zed',
    name: 'Zed IDE',
    category: 'ide',
    authType: 'oauth',
    badge: 'IDE',
    description: 'Editor dengan langganan AI bawaan. Gunakan halaman penyedia untuk mengimpor kredensial langsung dari gantungan kunci IDE.',
    website: 'https://zed.dev',
    models: ['zed/claude-3-5-sonnet', 'zed/gpt-4o'],
    requiresOAuth: true,
  },
];
