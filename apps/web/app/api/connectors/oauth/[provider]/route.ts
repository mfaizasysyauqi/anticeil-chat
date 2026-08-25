import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../src/shared/utils/supabase/server';
import type { Provider } from '@supabase/supabase-js';

// OAuth scopes per provider
const PROVIDER_SCOPES: Record<string, string[]> = {
  google: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send',
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/drive',
    'openid',
    'email',
    'profile',
  ],
  github: ['repo', 'read:user', 'user:email'],
  notion: [],
};

// Which Supabase provider name to use
const SUPABASE_PROVIDER: Record<string, Provider> = {
  google: 'google',
  github: 'github',
  notion: 'notion',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { origin } = new URL(request.url);

  const supabaseProvider = SUPABASE_PROVIDER[provider];
  if (!supabaseProvider) {
    return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
  }

  const scopes = PROVIDER_SCOPES[provider] ?? [];
  const supabase = await createClient();

  const redirectTo = `${origin}/api/connectors/oauth/callback/${provider}`;

  const options: {
    redirectTo: string;
    scopes?: string;
    queryParams?: Record<string, string>;
  } = { redirectTo };

  if (provider === 'google') {
    options.scopes = scopes.join(' ');
    options.queryParams = {
      access_type: 'offline',
      prompt: 'consent',
    };
  } else if (provider === 'github' && scopes.length > 0) {
    options.scopes = scopes.join(' ');
  }

  // If the user is already logged in, link the identity instead of creating a new session.
  // This avoids overwriting the active auth session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data, error } = await supabase.auth.linkIdentity({
      provider: supabaseProvider,
      options,
    });

    if (error || !data?.url) {
      // linkIdentity may fail if provider is already linked — fall through to signInWithOAuth
      console.warn(
        `[Connector OAuth] linkIdentity failed for ${provider}, falling back to signInWithOAuth:`,
        error?.message
      );
    } else {
      return NextResponse.redirect(data.url);
    }
  }

  // Fallback: standard signInWithOAuth (used when not logged in or linkIdentity unavailable)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: supabaseProvider,
    options,
  });

  if (error || !data?.url) {
    return NextResponse.redirect(
      `${origin}/chat?connector_error=${provider}&reason=${encodeURIComponent(
        error?.message ?? 'oauth_init_failed'
      )}`
    );
  }

  return NextResponse.redirect(data.url);
}
