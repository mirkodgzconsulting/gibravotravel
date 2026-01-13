import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const hostname = req.nextUrl.hostname;

  const isSystemsDomain = hostname === 'systems.gibravo.it' || hostname === 'www.systems.gibravo.it';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  // 1. PUBLIC WEBSITE ROUTES (Always allowed on main domain/localhost)
  if (pathname === '/admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard-viajes';
    return NextResponse.redirect(url);
  }

  const isWebsitePublicRoute =
    pathname === '/' ||
    pathname.startsWith('/chi-siamo') ||
    pathname.startsWith('/partenze') ||
    pathname.startsWith('/contatti') ||
    pathname.startsWith('/tour') ||
    pathname.startsWith('/prenotazione') ||
    pathname.startsWith('/area-riservata') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/signin') ||
    pathname.startsWith('/domande-frequenti') ||
    pathname.startsWith('/come-funziona') ||
    pathname.startsWith('/informativa-privacy') ||
    pathname.startsWith('/termini-e-condizioni') ||
    pathname.startsWith('/informativa-cookie') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/categoria') ||
    pathname.startsWith('/api')

  // 2. SYSTEMS DOMAIN LOGIC
  if (isSystemsDomain) {
    // If root, redirect to specific internal dashboard
    if (pathname === '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard-viajes';
      return NextResponse.redirect(url);
    }

    // Public paths within Systems
    const publicPaths = [
      '/api/download-file',
      '/signin', // Legacy path?
      '/sign-in',
      '/sign-up',
      '/reset-password',
      '/two-step-verification',
    ];

    const isPublic = publicPaths.some(path => pathname.startsWith(path));
    if (isPublic) return;

    // Everything else on systems is protected
    await auth.protect();
    return;
  }

  // 3. MAIN DOMAIN / LOCALHOST LOGIC
  // If it is a known Main Website Route, allow access (return empty)
  if (isWebsitePublicRoute) {
    return;
  }

  // 4. FALLBACK PROTECTION
  // If we are here, it's a route not explicitly defined as public on the main site.
  // For safety, we protect it, OR we redirect to home if it's an internal route accessed from public domain.

  if (!isSystemsDomain && !isLocalhost) {
    // If trying to access unknown/internal routes from public domain, redirect to home
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // If localhost and not public route (e.g. testing admin pages locally), require auth
  await auth.protect();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
