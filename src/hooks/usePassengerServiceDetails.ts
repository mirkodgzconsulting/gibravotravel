import { useState, useEffect, useCallback, useRef } from 'react';

export interface PassengerServiceDetail {
  id: string;
  pasajeroServicioId: string;
  pasajeroId: string;
  biglietteriaId: string;
  cliente: string;
  pasajero: string;
  servicio: string;
  metodoDiAcquisto: string | null;
  andata: string | null;
  ritorno: string | null;
  dataRegistro: string | null;
  iata: string | null;
  neto: number | null;
  venduto: number | null;
  estado: string;
  fechaPago: string | null;
  fechaActivacion: string | null;
  notas: string | null;
  pnr: string | null;
  itinerario: string | null;
  pagamento: string | null;
  metodoPag: string | null;
  creador: string | null;
}

interface PassengerServiceDetailApi {
  id: string;
  pasajeroId: string;
  biglietteriaId: string;
  cliente?: string | null;
  pasajero?: string | null;
  servicio: string;
  metodoDiAcquisto?: string | null;
  andata?: string | null;
  ritorno?: string | null;
  dataRegistro?: string | null;
  iata?: string | null;
  neto?: number | null;
  venduto?: number | null;
  estado?: string | null;
  fechaPago?: string | null;
  fechaActivacion?: string | null;
  notas?: string | null;
  pnr?: string | null;
  itinerario?: string | null;
  pagamento?: string | null;
  metodoPag?: string | null;
  creador?: string | null;
}

interface PassengerServiceApiResponse {
  data?: PassengerServiceDetailApi[];
}

interface UsePassengerServiceDetailsOptions {
  pageSize?: number;
}

export interface PassengerServiceUpdatePayload {
  estado?: string;
  fechaPago?: string | null;
  fechaActivacion?: string | null;
  notas?: string | null;
  metodoDiAcquisto?: string | null;
  neto?: number | null;
  venduto?: number | null;
}

const mapApiItemToDetail = (item: PassengerServiceDetailApi): PassengerServiceDetail => ({
  id: item.id,
  pasajeroServicioId: item.id,
  pasajeroId: item.pasajeroId,
  biglietteriaId: item.biglietteriaId,
  cliente: item.cliente ?? '',
  pasajero: item.pasajero ?? '',
  servicio: item.servicio,
  metodoDiAcquisto: item.metodoDiAcquisto ?? null,
  andata: item.andata ?? null,
  ritorno: item.ritorno ?? null,
  dataRegistro: item.dataRegistro ?? null,
  iata: item.iata ?? null,
  neto: item.neto ?? null,
  venduto: item.venduto ?? null,
  estado: item.estado ?? 'Pendiente',
  fechaPago: item.fechaPago ?? null,
  fechaActivacion: item.fechaActivacion ?? null,
  notas: item.notas ?? null,
  pnr: item.pnr ?? null,
  itinerario: item.itinerario ?? null,
  pagamento: item.pagamento ?? null,
  metodoPag: item.metodoPag ?? null,
  creador: item.creador ?? null,
});

export const usePassengerServiceDetails = (
  shouldFetch: boolean,
  options: UsePassengerServiceDetailsOptions = {}
) => {
  const { pageSize = 2000 } = options;
  const [details, setDetails] = useState<PassengerServiceDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/biglietteria/pasajero-servicio?page=1&pageSize=${pageSize}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error('Error al cargar los detalles de pasajeros');
      }

      const data = (await response.json()) as PassengerServiceApiResponse;
      const items = Array.isArray(data?.data) ? data.data : [];
      setDetails(items.map(mapApiItemToDetail));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching passenger service details:', err);
      setError(
        err instanceof Error ? err.message : 'Error al cargar los detalles de pasajeros'
      );
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    if (shouldFetch) {
      fetchDetails();
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [shouldFetch, fetchDetails]);

  const updateDetail = useCallback(
    async (id: string, payload: PassengerServiceUpdatePayload) => {
      try {
        setIsUpdating(true);
        const response = await fetch(`/api/biglietteria/pasajero-servicio/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorBody.error || 'Error al actualizar el registro');
        }

        // Refrescar datos para mantener consistencia
        await fetchDetails();
      } catch (err) {
        console.error('Error updating passenger service detail:', err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [fetchDetails]
  );

  return {
    details,
    loading,
    error,
    refresh: fetchDetails,
    updateDetail,
    isUpdating,
  };
};

export default usePassengerServiceDetails;

