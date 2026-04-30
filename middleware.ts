import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getServerEnv } from '@/lib/env';

// Refreshes the Supabase Auth session cookie on each request so that
// Server Components and route handlers see a fresh admin session.
// Required by @supabase/ssr — without this, expired sessions hang.
//
// Skips Twilio webhooks (no admin session involved there) and static assets.
// Falls through cleanly if env vars are missing (dev-time setup).
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  let env;
  try {
    env = getServerEnv();
  } catch {
    // Env not configured yet — let the request through unchanged.
    return response;
  }

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and Twilio webhooks.
    '/((?!_next/static|_next/image|favicon.ico|api/twilio|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
