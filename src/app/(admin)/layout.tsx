"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Solo cargar useUserRole si el usuario está autenticado para evitar errores
  const { userRole, isLoading: roleLoading } = useUserRole();

  // Remover la redirección automática del layout - se maneja en la página
  // useEffect(() => {
  //   if (isLoaded && isSignedIn === false) {
  //     console.log('🚀 User not signed in, redirecting to signin');
  //     router.push("/signin");
  //   }
  // }, [isLoaded, isSignedIn, router]);

  // NO redirigir automáticamente - solo mostrar loading mientras carga
  // La validación de permisos se hace a nivel de página

  // Redirigir inmediatamente si el usuario no está autenticado
  useEffect(() => {
    if (isLoaded && !isSignedIn && pathname !== '/signin') {
      router.replace("/signin");
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  // Mostrar loading mientras Clerk se está cargando
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si el usuario no está autenticado, mostrar loading mientras se redirige (nunca retornar null)
  // Esta verificación debe ir ANTES de intentar renderizar componentes que requieren autenticación
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  // En la ruta raíz, mostrar loading mientras se carga el rol para evitar pestañeo
  if (pathname === '/' && isLoaded && isSignedIn && (roleLoading || !userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading solo en la primera carga o si el rol está cargando
  // Permitir continuar si el rol es null PERO el loading ha terminado (el localStorage tiene algo)
  if (roleLoading && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  // Route-specific styles for the main content container
  const getRouteSpecificStyles = () => {
    // Para rutas que empiezan con ciertos paths (incluyendo rutas dinámicas)
    if (pathname.startsWith("/biglietteria")) {
      return "p-4 w-full md:p-6"; // Ancho completo como TOUR AEREO
    }

    switch (pathname) {
      case "/text-generator":
        return "";
      case "/code-generator":
        return "";
      case "/image-generator":
        return "";
      case "/video-generator":
        return "";
      default:
        return "p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6";
    }
  };

  // Solo renderizar el layout completo si el usuario está autenticado
  // Esto evita errores al intentar renderizar componentes que requieren autenticación
  // Esta es una verificación de seguridad adicional antes de renderizar AppSidebar y AppHeader
  if (isLoaded && !isSignedIn) {
    // Ya se mostró el loading arriba, pero esta es una protección adicional
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirigiendo al inicio de sesión...</p>
        </div>
      </div>
    );
  }

  // Fixed margin for main content (sidebar always 200px)
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : "xl:ml-[200px]";

  return (
    <div className="min-h-screen xl:flex overflow-x-hidden">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin} pt-[60px] xl:pt-[72px]`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className={getRouteSpecificStyles()}>{children}</div>
      </div>
    </div>
  );
}

import { SidebarProvider } from "@/context/SidebarContext";
import { SearchProvider } from "@/context/SearchContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <SidebarProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </SidebarProvider>
    </SearchProvider>
  );
}
