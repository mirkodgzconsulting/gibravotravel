"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type UserRole = 'USER' | 'ADMIN' | 'TI';

export function useUserRole() {
  const { user: clerkUser, isLoaded } = useClerkUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriedFetch, setHasTriedFetch] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchUserRole() {
      if (!isLoaded || !clerkUser) {
        setUserRole(null);
        setIsLoading(false);
        setHasTriedFetch(false);
        setRetryCount(0);
        return;
      }

      // Si ya intentamos y tenemos un rol, no volver a intentar
      if (hasTriedFetch && userRole !== null) {
        return;
      }

      setHasTriedFetch(true);
      console.log('🚀 Starting role fetch for clerkId:', clerkUser.id);
      
      try {
        const response = await fetch(`/api/user/role?clerkId=${clerkUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Agregar timeout para evitar requests colgados
          signal: AbortSignal.timeout(10000)
        });
        
        console.log('📡 API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ User role found:', data.role);
          setUserRole(data.role);
        } else if (response.status === 404) {
          console.log('❌ User not found in database (404). ClerkId:', clerkUser.id);
          setUserRole(null);
        } else {
          console.error('❌ Error fetching user role:', response.status, response.statusText);
          const errorData = await response.text();
          console.error('Error details:', errorData);
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ Network error fetching user role:', error);
        setUserRole(null);
        
        // Retry logic para errores de red
        if (retryCount < 2) {
          console.log(`🔄 Retrying... (${retryCount + 1}/2)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            setHasTriedFetch(false);
          }, 1000 * (retryCount + 1)); // Delay incremental
        }
      } finally {
        console.log('🏁 Role fetch completed');
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [isLoaded, clerkUser, hasTriedFetch, retryCount, userRole]);

  return {
    userRole,
    isLoading,
    isAdmin: userRole === 'ADMIN',
    isTI: userRole === 'TI',
    isUser: userRole === 'USER',
    canManageUsers: userRole === 'TI', // Solo TI puede crear usuarios
    canAccessGestione: userRole === 'ADMIN' || userRole === 'TI', // Admin y TI pueden acceder a GESTIONE
  };
}
