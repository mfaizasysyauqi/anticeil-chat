import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // We need to collect cookies set by Supabase and forward them to the browser.
    // Create a mutable headers object to accumulate Set-Cookie entries.
    const cookiesToForward: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
            cookiesToForward.push(...cookiesToSet);
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[signin] Supabase error:', error.status, error.message);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Build the success response and attach all Set-Cookie headers
    const response = NextResponse.json(
      { ok: true, user: data.user, session: data.session },
      { status: 200 }
    );

    for (const { name, value, options } of cookiesToForward) {
      // NextResponse.cookies.set accepts ResponseCookies options
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
    }

    return response;

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[signin] Unexpected error:', msg);
    return NextResponse.json(
      { error: `Server error: ${msg}` },
      { status: 500 }
    );
  }
}
