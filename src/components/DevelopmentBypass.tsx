"use client";

import { useEffect, useState } from 'react';

interface DevelopmentBypassProps {
  children: React.ReactNode;
}

export default function DevelopmentBypass({ children }: DevelopmentBypassProps) {
  const [isLocalDevelopment, setIsLocalDevelopment] = useState(false);

  useEffect(() => {
    // Detectar si estamos en desarrollo local
    const isLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    setIsLocalDevelopment(isLocal && process.env.NODE_ENV === 'development');
  }, []);

  // En desarrollo local, mostrar un banner y permitir acceso
  if (isLocalDevelopment) {
    return (
      <div>
        {/* Banner de desarrollo */}
        <div className="fixed top-0 left-0 right-0 z-[999999] bg-yellow-500 text-black p-2 text-center text-sm font-bold">
          🚀 MODO DESARROLLO LOCAL - Acceso sin autenticación
        </div>
        <div className="pt-8"> {/* Espacio para el banner fijo */}
          {children}
        </div>
      </div>
    );
  }

  // En producción, mostrar el contenido normal
  return <>{children}</>;
}
