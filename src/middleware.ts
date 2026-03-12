import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Protected routes — redirect to / if not authenticated
const PROTECTED_ROUTES = ['/home', '/practice', '/analytics', '/settings', '/exam', '/trial', '/gdpr'];

// Public-only routes — redirect to /home if already authenticated
const PUBLIC_ONLY_ROUTES = ['/', '/welcome', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create Supabase client with request cookies
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isPublicOnly = PUBLIC_ONLY_ROUTES.includes(pathname);

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect authenticated users away from public-only onboarding routes
  if (isPublicOnly && user) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)',
  ],
};
