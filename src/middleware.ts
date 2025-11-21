import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  
  // Rutas públicas que NO requieren autenticación
  const publicPaths = [
    '/api/download-file',
    '/signin',
    '/sign-up',
    '/reset-password',
    '/two-step-verification',
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
