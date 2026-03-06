import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// 1. Definiamo le rotte pubbliche (quelle che non richiedono login di default)
const isPublicRoute = createRouteMatcher([
  '/',
  '/chi-siamo(.*)',
  '/partenze(.*)',
  '/contatti(.*)',
  '/tour(.*)',
  '/prenotazione(.*)',
  '/area-riservata(.*)',
  '/login(.*)',
  '/register(.*)',
  '/sign-in(.*)',
  '/signin(.*)',
  '/domande-frequenti(.*)',
  '/come-funziona(.*)',
  '/informativa-privacy(.*)',
  '/termini-e-condizioni(.*)',
  '/informativa-cookie(.*)',
  '/sitemap.xml',
  '/robots.txt',
  '/categoria(.*)',
  '/api(.*)', // Lasciamo che le API gestiscano la propria protezione o siano pubbliche
  '/sso-callback(.*)',
  '/reset-password(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const hostname = req.nextUrl.hostname;

  // Debug per vedere se il middleware viene eseguito (controllare i log di Vercel/Produzione)
  console.log(`🛡️ Clerk v6 Middleware: ${pathname} [${hostname}]`);

  const isSystemsDomain = hostname === 'systems.gibravo.it' || hostname === 'www.systems.gibravo.it';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  // Redirect per la rotta /admin legacy
  if (pathname === '/admin') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard-viajes';
    return NextResponse.redirect(url);
  }

  // 2. LOGICA PER EL DOMINIO SYSTEMS (Il gestionale interno)
  if (isSystemsDomain) {
    // Se siamo alla root di systems, andiamo al dashboard
    if (pathname === '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard-viajes';
      return NextResponse.redirect(url);
    }

    // Rotte pubbliche specifiche del sottodominio systems
    const publicSystemsPaths = [
      '/api/download-file',
      '/signin',
      '/sign-in',
      '/sign-up',
      '/reset-password',
      '/two-step-verification',
    ];

    const isPublicSystem = publicSystemsPaths.some(path => pathname.startsWith(path));

    if (!isPublicSystem) {
      // Protezione obbligatoria per tutto il resto su systems
      await auth.protect();
    }
    return; // Permetti di procedere senza NextResponse.next()
  }

  // 3. LOGICA PER IL DOMINIO PRINCIPALE / LOCALHOST
  if (!isPublicRoute(req)) {
    // Se non è una rotta pubblica del sito web, proteggiamo o reindirizziamo
    if (!isSystemsDomain && !isLocalhost) {
      // Se si tenta di accedere a rotte non pubbliche dal dominio principale, torna alla home
      const url = req.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    // In altri casi (localhost) proteggi normalmente
    await auth.protect();
  }
  
  // Per default permetti di procedere
  return;
});

export const config = {
  matcher: [
    // Ignora file statici e Next.js internals
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Forza middleware su tutte le API
    '/(api|trpc)(.*)',
  ],
};
