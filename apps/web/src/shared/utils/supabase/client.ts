import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://orshttowaxmjegclecag.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_b0VAst9djH6nA3YB0uH0gA_hvNLQK58';

  return createBrowserClient(supabaseUrl, supabaseKey);
}
