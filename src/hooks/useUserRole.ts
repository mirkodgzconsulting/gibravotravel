"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";

type UserRole = 'USER' | 'ADMIN' | 'TI';

export function useUserRole() {
  const { user: clerkUser, isLoaded } = useClerkUser();
  
  // Inicializar desde localStorage si existe
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      return stored as UserRole | null;
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(() => {
    // Si tenemos rol en localStorage, no empezar en loading
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      return !stored;
    }
    return true;
  });
  const hasFetchedRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup anterior request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Si no está cargado Clerk o no hay usuario
    if (!isLoaded || !clerkUser) {
      // Limpiar localStorage si no hay usuario
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userRole');
      }
      setUserRole(null);
      setIsLoading(false);
      hasFetchedRef.current = null;
      return;
    }

    // Si ya tenemos un rol en localStorage y coincide con el usuario actual, no hacer fetch
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    
    if (storedRole && storedUserId === clerkUser.id && userRole === storedRole) {
      setIsLoading(false);
      return;
    }

    // Si ya se cargó el rol para este usuario específico, no volver a intentar
    if (hasFetchedRef.current === clerkUser.id && userRole !== null) {
      return;
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    async function fetchUserRole() {
      if (!clerkUser) return;
      
      hasFetchedRef.current = clerkUser.id;
      setIsLoading(true);
      
      try {
        console.log('🔍 Fetching user role for clerkId:', clerkUser.id);
        const response = await fetch(`/api/user/role?clerkId=${clerkUser.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal,
          cache: 'no-store'
        });
        
        console.log('📡 Response status:', response.status);
        
        if (signal.aborted) return;
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ User role data:', data);
          if (!signal.aborted) {
            // Guardar en localStorage
            if (typeof window !== 'undefined' && clerkUser) {
              localStorage.setItem('userRole', data.role);
              localStorage.setItem('userId', clerkUser.id);
            }
            setUserRole(data.role);
          }
        } else if (response.status === 404) {
          console.log('❌ User not found in database');
          if (!signal.aborted) {
            // Limpiar localStorage si el usuario no existe
            if (typeof window !== 'undefined') {
              localStorage.removeItem('userRole');
              localStorage.removeItem('userId');
            }
            setUserRole(null);
          }
        } else {
          console.error('Error fetching user role:', response.status, response.statusText);
          if (!signal.aborted) {
            setUserRole(null);
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('⚠️ Request aborted');
          return;
        }
        console.error('Network error fetching user role:', error);
        if (!signal.aborted) {
          setUserRole(null);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchUserRole();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isLoaded, clerkUser?.id]);

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
