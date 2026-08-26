export type ProviderCategory =
  | 'oauth'
  | 'ide'
  | 'web-cookie'
  | 'apikey'
  | 'no-auth'
  | 'upstream-proxy'
  | 'aggregators'
  | 'enterprise'
  | 'cloud-agent'
  | 'local'
  | 'search'
  | 'embeddings'
  | 'image'
  | 'audio'
  | 'video';

export type AuthType = 'no-auth' | 'oauth' | 'cookie' | 'apikey' | 'local' | 'proxy';

export interface GatewayProvider {
  id: string;
  name: string;
  category: ProviderCategory;
  authType: AuthType;
  description: string;
  website?: string;
  icon?: string;
  badge?: string;
  models?: string[];
  defaultBaseUrl?: string;
  requiresKey?: boolean;
  requiresCookie?: boolean;
  requiresOAuth?: boolean;
}

export interface ProviderConnection {
  providerId: string;
  isEnabled: boolean;
  apiKey?: string;
  cookieToken?: string;
  oauthToken?: string;
  baseUrl?: string;
  connectedAt?: number;
  lastTestedAt?: number;
  testStatus?: 'success' | 'error' | 'untested';
}
