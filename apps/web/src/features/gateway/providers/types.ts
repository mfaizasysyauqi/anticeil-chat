export type ProviderCategory =
  | 'no-auth'
  | 'oauth'
  | 'web-cookie'
  | 'apikey'
  | 'local'
  | 'search'
  | 'audio';

export type AuthType = 'no-auth' | 'oauth' | 'cookie' | 'apikey' | 'local';

export interface GatewayProvider {
  id: string;
  name: string;
  category: ProviderCategory;
  authType: AuthType;
  description: string;
  website?: string;
  icon?: string;
  badge?: 'FREE' | 'OAUTH' | 'COOKIE' | 'API KEY' | 'LOCAL' | 'RAG';
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
