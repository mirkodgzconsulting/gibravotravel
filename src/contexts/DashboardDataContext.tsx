"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { cachedFetch } from '@/utils/cachedFetch';

interface DashboardData {
  biglietteria: any[];
  tourAereo: any[];
  tourBus: any[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface DashboardDataContextType extends DashboardData {
  refetch: () => Promise<void>;
  isStale: () => boolean;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(undefined);

interface DashboardDataProviderProps {
  children: ReactNode;
  userId?: string;
  waitForUserId?: boolean; // Si es true, espera a que userId esté disponible antes de cargar
}

// TTL del caché: 2 minutos (120,000 ms)
const CACHE_TTL_MS = 120000;

export function DashboardDataProvider({ children, userId, waitForUserId = false }: DashboardDataProviderProps) {
  const [data, setData] = useState<DashboardData>({
    biglietteria: [],
    tourAereo: [],
    tourBus: [],
    loading: true,
    error: null,
    lastFetch: null,
  });

  const fetchData = useCallback(async () => {
    // Si waitForUserId es true y userId no está disponible, no cargar datos aún
    if (waitForUserId && !userId) {
      setData(prev => ({ ...prev, loading: true }));
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const userIdParam = userId ? `?userId=${userId}` : '';
      
      // Hacer las 3 consultas en paralelo con caché
      // Usar cachedFetch para aprovechar el caché existente
      const [biglietteriaData, tourAereoData, tourBusData] = await Promise.all([
        cachedFetch<{ records: any[] }>(`/api/biglietteria${userIdParam}`, { ttlMs: CACHE_TTL_MS }),
        cachedFetch<{ tours: any[] }>(`/api/tour-aereo${userIdParam}`, { ttlMs: CACHE_TTL_MS }),
        cachedFetch<{ tours: any[] }>(`/api/tour-bus${userIdParam}`, { ttlMs: CACHE_TTL_MS }),
      ]);

      setData({
        biglietteria: biglietteriaData.records || [],
        tourAereo: tourAereoData.tours || [],
        tourBus: tourBusData.tours || [],
        loading: false,
        error: null,
        lastFetch: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar datos del dashboard',
      }));
    }
  }, [userId, waitForUserId]);

  // Verificar si los datos están obsoletos (más de 2 minutos)
  const isStale = useCallback(() => {
    if (!data.lastFetch) return true;
    return Date.now() - data.lastFetch > CACHE_TTL_MS;
  }, [data.lastFetch]);

  // Cargar datos al montar o cuando cambia userId
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value: DashboardDataContextType = {
    ...data,
    refetch: fetchData,
    isStale,
  };

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider');
  }
  return context;
}

