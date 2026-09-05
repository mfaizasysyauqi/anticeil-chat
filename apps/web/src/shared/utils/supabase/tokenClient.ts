import { createClient } from '@supabase/supabase-js';

/**
 * Returns an authenticated Supabase client for Server API routes using the request's Bearer token.
 */
export function getSupabaseWithToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );
}
