import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/auth/signin
 *
 * Performs email+password sign-in on the **server** side so that
 * @supabase/ssr can write the session into HTTP cookies that the
 * middleware (and every subsequent server request) can read.
 *
 * The browser client (createBrowserClient) stores the session in
 * localStorage — which the server-side middleware cannot access —
 * causing a perpetual redirect loop to /login.  By doing the sign-in
 * here we guarantee the Set-Cookie header travels back to the browser.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // Build the response object first — createServerClient needs to mutate it
  // via setAll() to attach the Set-Cookie header.
  const response = NextResponse.json({ ok: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Return the user + session so the client can hydrate its Zustand state,
  // with the auth cookies already baked into the response headers.
  return NextResponse.json(
    { ok: true, user: data.user, session: data.session },
    {
      status: 200,
      headers: response.headers, // carries the Set-Cookie header(s)
    }
  );
}
