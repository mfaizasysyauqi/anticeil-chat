import { GatewayProvider } from './types';

export const CLOUD_AGENT_PROVIDERS: GatewayProvider[] = [
  {
    id: 'codex-cloud',
    name: 'Codex Cloud',
    category: 'cloud-agent',
    authType: 'oauth',
    badge: 'Agent',
    description: 'Autonomous cloud execution agent with terminal tools, browser sandboxing, and plan approval.',
    website: 'https://openai.com',
    models: ['codex-cloud/swe-agent-v1'],
    requiresOAuth: true,
  },
  {
    id: 'devin',
    name: 'Devin',
    category: 'cloud-agent',
    authType: 'oauth',
    badge: 'Agent',
    description: 'Cognition AI first autonomous AI software engineer running in remote VM containers.',
    website: 'https://cognition.ai',
    models: ['devin/cloud-instance'],
    requiresOAuth: true,
  },
  {
    id: 'jules',
    name: 'Google Jules',
    category: 'cloud-agent',
    authType: 'oauth',
    badge: 'Agent',
    description: 'Google DeepMind experimental autonomous code transformation and GitHub issue solver agent.',
    website: 'https://deepmind.google',
    models: ['jules/swe-agent'],
    requiresOAuth: true,
  },
];
