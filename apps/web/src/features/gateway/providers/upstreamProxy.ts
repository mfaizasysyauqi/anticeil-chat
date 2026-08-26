import { GatewayProvider } from './types';

export const UPSTREAM_PROXY_PROVIDERS: GatewayProvider[] = [
  {
    id: '9router',
    name: '9router',
    category: 'upstream-proxy',
    authType: 'proxy',
    badge: 'Proxy',
    description: 'High-availability upstream traffic proxy router with circuit-breaking and retry policies.',
    website: 'https://9router.com',
    models: ['9router/upstream-pass'],
  },
  {
    id: 'cliproxyapi',
    name: 'CLIProxyAPI',
    category: 'upstream-proxy',
    authType: 'proxy',
    badge: 'Proxy',
    description: 'Local and remote CLI reverse proxy bridge for corporate networks and traffic inspection.',
    website: 'https://github.com/diegosouzapw/OmniRoute',
    models: ['cliproxyapi/tunnel'],
  },
];
