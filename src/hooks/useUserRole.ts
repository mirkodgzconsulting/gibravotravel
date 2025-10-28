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
      
      try {
        const response = await fetch(`/api/user/role?clerkId=${clerkUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        } else if (response.status === 404) {
          setUserRole(null);
        } else {
          console.error('Error fetching user role:', response.status, response.statusText);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Network error fetching user role:', error);
        setUserRole(null);
        
        // Retry logic para errores de red
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            setHasTriedFetch(false);
          }, 1000 * (retryCount + 1));
        }
      } finally {
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
    canAccessGestione: userRole === 'ADMIN' || userRole === 'TI' || userRole === 'USER', // Admin, TI y USER pueden acceder a GESTIONE
    canAccessUtenti: userRole === 'ADMIN' || userRole === 'TI', // Solo ADMIN y TI pueden acceder a UTENTI
    canAccessModello: userRole === 'ADMIN' || userRole === 'TI' || userRole === 'USER', // Todos pueden acceder a MODELLO
  };
}
