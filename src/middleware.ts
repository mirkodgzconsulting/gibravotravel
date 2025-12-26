import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const hostname = req.nextUrl.hostname;

  const isSystemsDomain = hostname === 'systems.gibravo.it' || hostname === 'www.systems.gibravo.it';

  // 1. PROTECCIÓN DE DOMINIO PÚBLICO (gibravo.it)
  // Si NO es el dominio de sistemas y NO es la raíz (landing) ni una API pública,
  // Bloquear acceso a rutas internas (/signin, /dashboard, etc.) redirigiendo a Home.
  if (!isSystemsDomain && pathname !== '/' && !pathname.startsWith('/api')) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 2. Lógica para Dominio de Sistemas (systems.gibravo.it)
  // Si entran a la raíz, redirigir al Dashboard
  if (isSystemsDomain && pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard-viajes';
    return NextResponse.redirect(url);
  }

  // Rutas públicas que NO requieren autenticación (Para systems.gibravo.it)
  const publicPaths = [
    '/api/download-file',
    '/signin',
    '/sign-up',
    '/reset-password',
    '/two-step-verification',
    // '/' ya está manejado arriba
  ];

  // Verificar si la ruta es pública (exacta o subruta)
  const isPublic = publicPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  // Si es pública, retornar inmediatamente sin ejecutar protección
  // Esto evita cualquier redirección
  if (isPublic) {
    return;
  }

  // Solo proteger rutas que NO son públicas
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes (el middleware verificará si es pública)
    '/(api|trpc)(.*)',
  ],
};
