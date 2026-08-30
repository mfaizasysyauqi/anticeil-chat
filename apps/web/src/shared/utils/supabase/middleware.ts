import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';


export async function updateSession(request: NextRequest) {
  // Start with a response that passes the request through unchanged
  let supabaseResponse = NextResponse.next({ request });

  // ⚠️  Never fall back to a placeholder key — if the env var is missing, fail
  //     loudly rather than silently accepting every token as unauthenticated.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // IMPORTANT: mirror every cookie the Supabase client writes onto both
      // the mutated request AND the response so the refreshed token travels
      // all the way to the browser and the next server request.
      setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: do NOT run any logic between createServerClient and getUser().
  // A stale getSession() can return cached data; getUser() validates against
  // the Supabase Auth server and is the only reliable check.
  const {
    data: { user },
  } = await supabase.auth.getUser();


  // Auth is handled client-side via AuthModal — no server-side redirect needed.


  // Always return supabaseResponse (not a plain NextResponse.next()) so the
  // potentially-refreshed access token cookie reaches the browser.
  return supabaseResponse;
}
