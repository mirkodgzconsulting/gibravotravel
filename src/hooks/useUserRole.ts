"use client";

import { useUser as useClerkUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

type UserRole = 'USER' | 'ADMIN' | 'TI';

export function useUserRole() {
  const { user: clerkUser, isLoaded } = useClerkUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!isLoaded || !clerkUser) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/role?clerkId=${clerkUser.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
        } else {
          // Si no existe en la DB, crear usuario con rol USER por defecto
          const createResponse = await fetch('/api/user/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clerkId: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              role: 'USER'
            }),
          });

          if (createResponse.ok) {
            setUserRole('USER');
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [isLoaded, clerkUser]);

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
