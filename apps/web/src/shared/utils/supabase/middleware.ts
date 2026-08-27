import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require an authenticated session
const PROTECTED_ROUTES = [
  '/chat',
  '/imagine',
  '/gateway',
  '/prompts',
  '/settings',
];

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

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    // Return a redirect — but STILL use supabaseResponse as the base so any
    // refreshed-token cookies are forwarded (they update the redirect response).
    const redirectResponse = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // Always return supabaseResponse (not a plain NextResponse.next()) so the
  // potentially-refreshed access token cookie reaches the browser.
  return supabaseResponse;
}
