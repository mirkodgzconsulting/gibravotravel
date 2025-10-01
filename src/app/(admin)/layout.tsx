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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const { userRole, isLoading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/signin");
    }
  }, [isLoaded, isSignedIn, router]);

  // Debug: Log del estado actual
  useEffect(() => {
    console.log('🔍 Layout useEffect:', { isLoaded, isSignedIn, roleLoading, userRole });
  }, [isLoaded, isSignedIn, roleLoading, userRole]);

  // CRÍTICO: Usar useEffect para manejar la redirección con delay
  useEffect(() => {
    if (isLoaded && isSignedIn && !roleLoading && userRole === null) {
      console.log('❌ No role found after loading - scheduling redirect to unauthorized');
      const timer = setTimeout(() => {
        console.log('🚀 Executing redirect to unauthorized');
        router.push("/unauthorized");
      }, 2000); // Delay de 2 segundos para dar tiempo al hook
      
      return () => {
        console.log('🔄 Clearing redirect timer');
        clearTimeout(timer);
      };
    }
  }, [isLoaded, isSignedIn, roleLoading, userRole, router]);

  if (!isLoaded || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  // Si no hay rol pero todo está cargado, mostrar loading temporal
  if (userRole === null && isLoaded && isSignedIn && !roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Route-specific styles for the main content container
  const getRouteSpecificStyles = () => {
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

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "xl:ml-[290px]"
    : "xl:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className={getRouteSpecificStyles()}>{children}</div>
      </div>
    </div>
  );
}
