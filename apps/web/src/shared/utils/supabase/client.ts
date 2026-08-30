import { createBrowserClient } from '@supabase/ssr';

export interface SupabaseConfigInfo {
  url: string;
  anonKey: string;
  isCustom: boolean;
}

/**
 * Returns either the default managed Supabase credentials or the Enterprise BYOD custom credentials.
 */
export function getSupabaseCredentials(): SupabaseConfigInfo {
  if (typeof window !== 'undefined') {
    try {
      const tier = localStorage.getItem('anticeil_user_tier');
      const customUrl = localStorage.getItem('anticeil_custom_supabase_url');
      const customAnonKey = localStorage.getItem('anticeil_custom_supabase_anon_key');

      if (tier === 'enterprise' && customUrl && customAnonKey) {
        return {
          url: customUrl.trim(),
          anonKey: customAnonKey.trim(),
          isCustom: true,
        };
      }
    } catch {
      // Ignore localStorage access errors
    }
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    isCustom: false,
  };
}

export function createClient(customOverride?: { url: string; anonKey: string }) {
  if (customOverride?.url && customOverride?.anonKey) {
    return createBrowserClient(customOverride.url, customOverride.anonKey);
  }

  const { url, anonKey } = getSupabaseCredentials();
  return createBrowserClient(url, anonKey);
}
