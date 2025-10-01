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
          console.log('User role found:', data.role); // Debug log
          setUserRole(data.role);
        } else if (response.status === 404) {
          // Usuario no existe en la DB - no crear automáticamente
          console.log('User not found in database. Please contact admin to create user account.');
          setUserRole(null);
        } else {
          console.error('Error fetching user role:', response.status);
          setUserRole(null);
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
