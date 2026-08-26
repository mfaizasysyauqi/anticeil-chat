import { OAUTH_PROVIDERS } from './oauth';
import { IDE_PROVIDERS } from './ide';
import { WEB_COOKIE_PROVIDERS } from './webCookie';
import { APIKEY_PROVIDERS } from './apikey';
import { NOAUTH_PROVIDERS } from './noauth';
import { UPSTREAM_PROXY_PROVIDERS } from './upstreamProxy';
import { AGGREGATORS_PROVIDERS } from './aggregators';
import { ENTERPRISE_PROVIDERS } from './enterprise';
import { CLOUD_AGENT_PROVIDERS } from './cloudAgent';
import { LOCAL_PROVIDERS } from './local';
import { SEARCH_PROVIDERS } from './search';
import { EMBEDDINGS_PROVIDERS } from './embeddings';
import { IMAGE_PROVIDERS } from './image';
import { AUDIO_PROVIDERS } from './audio';
import { VIDEO_PROVIDERS } from './video';
import { GatewayProvider, ProviderCategory } from './types';

export * from './types';
export * from './oauth';
export * from './ide';
export * from './webCookie';
export * from './apikey';
export * from './noauth';
export * from './upstreamProxy';
export * from './aggregators';
export * from './enterprise';
export * from './cloudAgent';
export * from './local';
export * from './search';
export * from './embeddings';
export * from './image';
export * from './audio';
export * from './video';

export const ALL_GATEWAY_PROVIDERS: GatewayProvider[] = [
  ...OAUTH_PROVIDERS,
  ...IDE_PROVIDERS,
  ...WEB_COOKIE_PROVIDERS,
  ...APIKEY_PROVIDERS,
  ...NOAUTH_PROVIDERS,
  ...UPSTREAM_PROXY_PROVIDERS,
  ...AGGREGATORS_PROVIDERS,
  ...ENTERPRISE_PROVIDERS,
  ...CLOUD_AGENT_PROVIDERS,
  ...LOCAL_PROVIDERS,
  ...SEARCH_PROVIDERS,
  ...EMBEDDINGS_PROVIDERS,
  ...IMAGE_PROVIDERS,
  ...AUDIO_PROVIDERS,
  ...VIDEO_PROVIDERS,
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
