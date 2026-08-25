import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../../src/shared/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get('code');
  const error = searchParams.get('error') || searchParams.get('error_description');

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/chat?connector_error=${provider}&reason=${encodeURIComponent(
        error ?? 'no_code'
      )}`
    );
  }

  try {
    const supabase = await createClient();

    // Exchange code for session. We extract provider_token from the session.
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !data?.session) {
      console.error(`[Connector] ${provider} session exchange failed:`, sessionError?.message);
      return NextResponse.redirect(
        `${origin}/chat?connector_error=${provider}&reason=session`
      );
    }

    const { session } = data;
    const providerToken = session.provider_token ?? '';
    const providerRefreshToken = session.provider_refresh_token ?? '';
    const userEmail = session.user?.email ?? '';
    const userName =
      session.user?.user_metadata?.full_name ||
      session.user?.user_metadata?.name ||
      userEmail.split('@')[0] ||
      (provider === 'notion' ? 'Notion Workspace' : 'User');

    if (!providerToken) {
      console.warn(`[Connector] ${provider} callback: provider_token missing from session`);
      return NextResponse.redirect(
        `${origin}/chat?connector_error=${provider}&reason=no_provider_token`
      );
    }

    // Determine connector identifier
    let connectorId = provider;
    if (provider === 'google') {
      connectorId = 'google';
    }

    const successUrl = new URL(`${origin}/chat`);
    successUrl.searchParams.set('connector_connected', connectorId);
    successUrl.searchParams.set('connector_token', providerToken);
    if (providerRefreshToken) {
      successUrl.searchParams.set('connector_refresh_token', providerRefreshToken);
    }
    successUrl.searchParams.set('connector_email', userEmail);
    successUrl.searchParams.set('connector_name', userName);
    return NextResponse.redirect(successUrl.toString());
  } catch (err) {
    console.error(`[Connector] ${provider} callback unexpected error:`, err);
    return NextResponse.redirect(
      `${origin}/chat?connector_error=${provider}&reason=unknown`
    );
  }
}
