import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // These are public/publishable keys — safe to expose in the browser.
  // They MUST be set in .env.local (NEXT_PUBLIC_ prefix makes them
  // available client-side). Never fall back to a placeholder value.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
