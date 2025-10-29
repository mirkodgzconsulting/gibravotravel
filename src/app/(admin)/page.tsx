"use client";

import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React, { useEffect } from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useUser();
  const { userRole, isLoading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    // Si Clerk está cargado y el usuario no está autenticado, redirigir a signin
    if (isLoaded && isSignedIn === false) {
      router.push("/signin");
      return;
    }
    
    // Si el usuario está autenticado y el rol está cargado, redirigir a dashboard-viajes
    if (isLoaded && isSignedIn && !roleLoading && userRole) {
      router.push("/dashboard-viajes");
      return;
    }
  }, [isLoaded, isSignedIn, roleLoading, userRole, router]);

  // Mostrar loading mientras se carga todo o mientras se redirige
  if (!isLoaded || roleLoading || (isLoaded && isSignedIn && !userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // MOSTRAR LOADING SIEMPRE para usuarios autenticados en la ruta raíz
  // Esto evita que se renderice E-commerce por milisegundos
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (isSignedIn === false) {
    return null;
  }

  // Si está autenticado y tiene rol, mostrar el dashboard (esto no debería ejecutarse por la redirección)
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />
        <MonthlySalesChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  );
}
