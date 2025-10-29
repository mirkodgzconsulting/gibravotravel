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
    let isMounted = true;

    async function fetchUserRole() {
      if (!isLoaded || !clerkUser) {
        if (isMounted) {
          setUserRole(null);
          setIsLoading(false);
          setHasTriedFetch(false);
          setRetryCount(0);
        }
        return;
      }

      // Solo marcar que intentamos una vez si no tenemos rol
      if (!hasTriedFetch) {
        setHasTriedFetch(true);
      }
      
      try {
        console.log('🔍 Fetching user role for clerkId:', clerkUser.id);
        const response = await fetch(`/api/user/role?clerkId=${clerkUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
          cache: 'no-store' // Forzar no cache
        });
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ User role data:', data);
          if (isMounted) {
            setUserRole(data.role);
          }
        } else if (response.status === 404) {
          console.log('❌ User not found in database');
          if (isMounted) {
            setUserRole(null);
          }
        } else {
          console.error('Error fetching user role:', response.status, response.statusText);
          if (isMounted) {
            setUserRole(null);
          }
        }
      } catch (error) {
        console.error('Network error fetching user role:', error);
        if (isMounted) {
          setUserRole(null);
        }
        
        // Retry logic para errores de red
        if (retryCount < 2 && isMounted) {
          setTimeout(() => {
            if (isMounted) {
              setRetryCount(prev => prev + 1);
            }
          }, 1000 * (retryCount + 1));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchUserRole();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, clerkUser, retryCount]);

  return {
    userRole,
    isLoading,
    isAdmin: userRole === 'ADMIN',
    isTI: userRole === 'TI',
    isUser: userRole === 'USER',
    canManageUsers: userRole === 'TI', // Solo TI puede crear usuarios
    canAccessGestione: userRole === 'ADMIN' || userRole === 'TI' || userRole === 'USER', // Admin, TI y USER pueden acceder a GESTIONE
    canAccessUtenti: userRole === 'ADMIN' || userRole === 'TI', // Solo ADMIN y TI pueden acceder a UTENTI
    canAccessModello: userRole === 'ADMIN' || userRole === 'TI' || userRole === 'USER', // Todos pueden acceder a MODELLO
  };
}
