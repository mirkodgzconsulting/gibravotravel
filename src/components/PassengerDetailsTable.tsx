"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Funciones helper optimizadas (fuera del componente)
const parseIataByService = (iataString: string | null, servicio: string): string | null => {
  if (!iataString) return null;
  try {
    const iataParsed = JSON.parse(iataString);
    if (typeof iataParsed === 'object' && iataParsed !== null && !Array.isArray(iataParsed)) {
      const servicioLower = servicio.toLowerCase().trim();
      
      // Primero intentar con claves predefinidas (para compatibilidad)
      const predefinedKeys: Record<string, string> = {
        'biglietteria': 'biglietteria',
        'express': 'express',
        'polizza': 'polizza',
        'lettera': 'letteraInvito',
        'lettera invito': 'letteraInvito',
        'hotel': 'hotel',
        'volo': 'biglietteria', // Volo es Biglietteria
        'bus': 'bus',
      };
      
      // Buscar en claves predefinidas
      if (predefinedKeys[servicioLower]) {
        const predefinedKey = predefinedKeys[servicioLower];
        if (iataParsed[predefinedKey]) {
          return iataParsed[predefinedKey];
        }
      }
      
      // Si no se encuentra en predefinidas, buscar directamente por el nombre del servicio en minúsculas
      // Esto maneja servicios dinámicos que se guardan con su nombre normalizado
      if (iataParsed[servicioLower]) {
        return iataParsed[servicioLower];
      }
      
      // Buscar por coincidencia parcial (para manejar variaciones)
      const matchingKey = Object.keys(iataParsed).find(key => 
        key.toLowerCase() === servicioLower || 
        servicioLower.includes(key.toLowerCase()) ||
        key.toLowerCase().includes(servicioLower)
      );
      
      if (matchingKey && iataParsed[matchingKey]) {
        return iataParsed[matchingKey];
      }
      
      return null;
    }
    return iataString;
  } catch {
    return iataString;
  }
};

const parseMetodoPagamento = (metodoString: string | null): string | null => {
  if (!metodoString) return null;
  try {
    const metodoParsed = JSON.parse(metodoString);
    if (Array.isArray(metodoParsed)) {
      return metodoParsed.join(', ');
    }
    return metodoString;
  } catch {
    return metodoString;
  }
};

const getCreatorName = (creator: any, creadoPor: string): string => {
  if (creator?.firstName) {
    return `${creator.firstName}${creator.lastName ? ` ${creator.lastName}` : ''}`.trim();
  }
  return creator?.email || creadoPor || 'N/A';
};

// Interfaces
interface PasajeroDetalle {
  id: string;
  pasajeroId: string;
  rowId: string;
  nombrePasajero: string;
  servicio: string;
  iata: string | null;
  andata: string | null;
  ritorno: string | null;
  neto: number | null;
  venduto: number | null;
  cliente: string;
  pnr: string | null;
  itinerario: string;
  dataRegistro: string;
  creadoPor: string;
  estado: string;
  fechaPago: string | null;
  fechaActivacion: string | null;
  notas: string | null;
  pagamento: string | null;
  metodoPag: string | null;
}

interface PassengerDetailsTableProps {
  records: any[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateRecords?: (updatedRecords: any[]) => void;
}

// Constantes
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const SERVICE_MAPPING = {
  biglietteria: ['netoBiglietteria', 'vendutoBiglietteria'],
  express: ['netoExpress', 'vendutoExpress'],
  polizza: ['netoPolizza', 'vendutoPolizza'],
  lettera: ['netoLetteraInvito', 'vendutoLetteraInvito'],
  hotel: ['netoHotel', 'vendutoHotel']
};

const PassengerDetailsTable: React.FC<PassengerDetailsTableProps> = ({ records, isOpen, onClose, onUpdateRecords }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroIata, setFiltroIata] = useState('');
  const [filtroPnr, setFiltroPnr] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [fechaIdaDesde, setFechaIdaDesde] = useState('');
  const [fechaIdaHasta, setFechaIdaHasta] = useState('');
  const [fechaVueltaDesde, setFechaVueltaDesde] = useState('');
  const [fechaVueltaHasta, setFechaVueltaHasta] = useState('');
  const [fechaActivacionDesde, setFechaActivacionDesde] = useState('');
  const [fechaActivacionHasta, setFechaActivacionHasta] = useState('');
  
  const [editingEstadoId, setEditingEstadoId] = useState<string | null>(null);
  const [editingFechaPagoId, setEditingFechaPagoId] = useState<string | null>(null);
  const [editingFechaActivacionId, setEditingFechaActivacionId] = useState<string | null>(null);
  const [editingNotasId, setEditingNotasId] = useState<string | null>(null);
  
  const [tempFechaPago, setTempFechaPago] = useState<string>('');
  const [tempFechaActivacion, setTempFechaActivacion] = useState<string>('');
  const [tempNotas, setTempNotas] = useState<string>('');

  // Función para procesar datos
  const processRecords = (records: any[]): PasajeroDetalle[] => {
    const processedData: PasajeroDetalle[] = [];

    records.forEach(record => {
      if (record.pasajeros && Array.isArray(record.pasajeros)) {
        record.pasajeros.forEach((pasajero: any) => {
          const servicios = Array.isArray(pasajero.servicios) 
            ? pasajero.servicios 
            : (pasajero.servizio || '').split(',').map((s: string) => s.trim()).filter(Boolean);

          if (servicios.length > 0) {
            servicios.forEach((servicio: string) => {
              const servicioLower = servicio.toLowerCase();
              let neto = null;
              let venduto = null;

              if (SERVICE_MAPPING[servicioLower as keyof typeof SERVICE_MAPPING]) {
                const [netoField, vendutoField] = SERVICE_MAPPING[servicioLower as keyof typeof SERVICE_MAPPING];
                neto = pasajero[netoField] || null;
                venduto = pasajero[vendutoField] || null;
              }

              const iataEspecifico = parseIataByService(pasajero.iata, servicio);

              processedData.push({
                id: `${record.id}-${pasajero.id}`,
                pasajeroId: pasajero.id,
                rowId: `${record.id}-${pasajero.id}-${servicio}`,
                nombrePasajero: pasajero.nombrePasajero || '-',
                servicio: servicio.toUpperCase(),
                iata: iataEspecifico,
                andata: pasajero.andata || null,
                ritorno: pasajero.ritorno || null,
                neto,
                venduto,
                cliente: record.cliente || '-',
                pnr: record.pnr || null,
                itinerario: record.itinerario || '-',
                dataRegistro: record.createdAt,
                creadoPor: getCreatorName(record.creator, record.creadoPor),
                estado: pasajero.estado || 'Pendiente',
                fechaPago: pasajero.fechaPago || null,
                fechaActivacion: pasajero.fechaActivacion || null,
                notas: pasajero.notas || null,
                pagamento: record.pagamento || null,
                metodoPag: parseMetodoPagamento(record.metodoPagamento),
              });
            });
          }
        });
      }
    });

    return processedData;
  };

  const processedData = useMemo(() => processRecords(records), [records]);

  const extractPasajeroId = (rowId: string): string => {
    const parts = rowId.split('-');
    const recordAndPasajero = parts.slice(0, -1).join('-');
    return recordAndPasajero.split('-').slice(-1)[0];
  };

  const updatePasajero = async (pasajeroId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/biglietteria/pasajero/${pasajeroId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedPasajero = await response.json();
        console.log('✅ Pasajero actualizado:', updatedPasajero);
        return updatedPasajero;
      } else {
        const errorData = await response.json();
        console.error('❌ Error actualizando pasajero:', errorData);
        alert(`Error al actualizar: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('❌ Error en la petición:', error);
      alert('Error de conexión al actualizar el pasajero');
    }
    return null;
  };

  const handleEstadoChange = async (rowId: string, newEstado: string) => {
    const pasajeroId = extractPasajeroId(rowId);
    setEditingEstadoId(null);
    
    const updateData: any = { estado: newEstado };
    
    if (newEstado === 'Pagado') {
      updateData.fechaPago = new Date().toISOString().split('T')[0];
    }
    
    const updatedPasajero = await updatePasajero(pasajeroId, updateData);
    
    if (updatedPasajero && onUpdateRecords) {
      const updatedRecords = records.map(record => ({
        ...record,
        pasajeros: record.pasajeros.map((pasajero: any) => 
          pasajero.id === pasajeroId 
            ? { ...pasajero, estado: newEstado, fechaPago: updateData.fechaPago || pasajero.fechaPago }
            : pasajero
        )
      }));
      onUpdateRecords(updatedRecords);
      alert(`Estado actualizado a: ${newEstado}`);
    } else if (updatedPasajero) {
      alert(`Estado actualizado a: ${newEstado}`);
    }
  };

  const handleFechaChange = useCallback(async (rowId: string, newFecha: string, type: 'pago' | 'activacion') => {
    const pasajeroId = extractPasajeroId(rowId);
    
    if (type === 'pago') setEditingFechaPagoId(null);
    else setEditingFechaActivacionId(null);
    
    const updateData = {
      [type === 'pago' ? 'fechaPago' : 'fechaActivacion']: newFecha || null
    };
    
    const updatedPasajero = await updatePasajero(pasajeroId, updateData);
    
    if (updatedPasajero && onUpdateRecords) {
      const updatedRecords = records.map(record => ({
        ...record,
        pasajeros: record.pasajeros.map((pasajero: any) => 
          pasajero.id === pasajeroId 
            ? { ...pasajero, [type === 'pago' ? 'fechaPago' : 'fechaActivacion']: newFecha || null }
            : pasajero
        )
      }));
      onUpdateRecords(updatedRecords);
      alert(`Fecha de ${type} actualizada: ${newFecha || 'Eliminada'}`);
    } else if (updatedPasajero) {
      alert(`Fecha de ${type} actualizada: ${newFecha || 'Eliminada'}`);
    }
  }, [records, onUpdateRecords]);

  const handleNotasChange = useCallback(async (rowId: string, newNotas: string) => {
    const pasajeroId = extractPasajeroId(rowId);
    setEditingNotasId(null);
    
    const updateData = {
      notas: newNotas || null
    };
    
    const updatedPasajero = await updatePasajero(pasajeroId, updateData);
    
    if (updatedPasajero && onUpdateRecords) {
      const updatedRecords = records.map(record => ({
        ...record,
        pasajeros: record.pasajeros.map((pasajero: any) => 
          pasajero.id === pasajeroId 
            ? { ...pasajero, notas: newNotas || null }
            : pasajero
        )
      }));
      onUpdateRecords(updatedRecords);
      alert(`Notas actualizadas: ${newNotas || 'Eliminadas'}`);
    } else if (updatedPasajero) {
      alert(`Notas actualizadas: ${newNotas || 'Eliminadas'}`);
    }
  }, [records, onUpdateRecords]);

  const startEditingFecha = (rowId: string, type: 'pago' | 'activacion', currentValue: string | null) => {
    if (type === 'pago') {
      setEditingFechaPagoId(rowId);
      setTempFechaPago(currentValue ? new Date(currentValue).toISOString().split('T')[0] : '');
    } else {
      setEditingFechaActivacionId(rowId);
      setTempFechaActivacion(currentValue ? new Date(currentValue).toISOString().split('T')[0] : '');
    }
  };

  const saveFecha = useCallback(async (rowId: string, type: 'pago' | 'activacion') => {
    const tempValue = type === 'pago' ? tempFechaPago : tempFechaActivacion;
    const item = processedData.find(item => item.rowId === rowId);
    if (!item) return;
    
    const originalValue = type === 'pago' 
      ? (item.fechaPago ? new Date(item.fechaPago).toISOString().split('T')[0] : '')
      : (item.fechaActivacion ? new Date(item.fechaActivacion).toISOString().split('T')[0] : '');

    if (tempValue !== originalValue) {
      await handleFechaChange(rowId, tempValue, type);
    }

    if (type === 'pago') {
      setEditingFechaPagoId(null);
      setTempFechaPago('');
    } else {
      setEditingFechaActivacionId(null);
      setTempFechaActivacion('');
    }
  }, [tempFechaPago, tempFechaActivacion, processedData, handleFechaChange]);

  const cancelEditingFecha = (type: 'pago' | 'activacion') => {
    if (type === 'pago') {
      setEditingFechaPagoId(null);
      setTempFechaPago('');
    } else {
      setEditingFechaActivacionId(null);
      setTempFechaActivacion('');
    }
  };

  const startEditingNotas = (rowId: string, currentValue: string | null) => {
    setEditingNotasId(rowId);
    setTempNotas(currentValue || '');
  };

  const saveNotas = useCallback(async (rowId: string) => {
    const tempValue = tempNotas;
    const item = processedData.find(item => item.rowId === rowId);
    const originalValue = item?.notas || '';

    if (tempValue !== originalValue) {
      await handleNotasChange(rowId, tempValue);
    }

    setEditingNotasId(null);
    setTempNotas('');
  }, [tempNotas, processedData, handleNotasChange]);

  const cancelEditingNotas = () => {
    setEditingNotasId(null);
    setTempNotas('');
  };
  
  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtroIataLower = filtroIata.toLowerCase();
    const filtroPnrLower = filtroPnr.toLowerCase();
    const fechaDesdeDate = fechaDesde ? new Date(fechaDesde) : null;
    const fechaHastaDate = fechaHasta ? new Date(fechaHasta) : null;
    const fechaIdaDesdeDate = fechaIdaDesde ? new Date(fechaIdaDesde) : null;
    const fechaIdaHastaDate = fechaIdaHasta ? new Date(fechaIdaHasta) : null;
    const fechaVueltaDesdeDate = fechaVueltaDesde ? new Date(fechaVueltaDesde) : null;
    const fechaVueltaHastaDate = fechaVueltaHasta ? new Date(fechaVueltaHasta) : null;
    const fechaActivacionDesdeDate = fechaActivacionDesde ? new Date(fechaActivacionDesde) : null;
    const fechaActivacionHastaDate = fechaActivacionHasta ? new Date(fechaActivacionHasta) : null;

    return processedData.filter(item => {
      if (searchTerm) {
        const matchesSearch = item.nombrePasajero.toLowerCase().includes(searchLower) ||
          item.cliente.toLowerCase().includes(searchLower) ||
          item.servicio.toLowerCase().includes(searchLower) ||
          (item.pnr && item.pnr.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      if (filtroIata && (!item.iata || !item.iata.toLowerCase().includes(filtroIataLower))) return false;
      if (filtroPnr && (!item.pnr || !item.pnr.toLowerCase().includes(filtroPnrLower))) return false;
      
      if (fechaDesdeDate && item.dataRegistro && new Date(item.dataRegistro) < fechaDesdeDate) return false;
      if (fechaHastaDate && item.dataRegistro && new Date(item.dataRegistro) > fechaHastaDate) return false;
      if (fechaIdaDesdeDate && item.andata && new Date(item.andata) < fechaIdaDesdeDate) return false;
      if (fechaIdaHastaDate && item.andata && new Date(item.andata) > fechaIdaHastaDate) return false;
      if (fechaVueltaDesdeDate && item.ritorno && new Date(item.ritorno) < fechaVueltaDesdeDate) return false;
      if (fechaVueltaHastaDate && item.ritorno && new Date(item.ritorno) > fechaVueltaHastaDate) return false;
      if (fechaActivacionDesdeDate && item.fechaActivacion && new Date(item.fechaActivacion) < fechaActivacionDesdeDate) return false;
      if (fechaActivacionHastaDate && item.fechaActivacion && new Date(item.fechaActivacion) > fechaActivacionHastaDate) return false;

      return true;
    });
  }, [processedData, searchTerm, filtroIata, filtroPnr, fechaDesde, fechaHasta, fechaIdaDesde, fechaIdaHasta, fechaVueltaDesde, fechaVueltaHasta, fechaActivacionDesde, fechaActivacionHasta]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const totalNeto = filteredData.reduce((sum, item) => sum + (item.neto || 0), 0);
  const totalVenduto = filteredData.reduce((sum, item) => sum + (item.venduto || 0), 0);

  // Exportar a Excel
  const handleExportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Pasajero': item.nombrePasajero,
      'Cliente': item.cliente,
      'Servicio': item.servicio,
      'IATA': item.iata || '',
      'PNR': item.pnr || '',
      'Fecha Ida': item.andata ? new Date(item.andata).toLocaleDateString('it-IT') : '',
      'Fecha Vuelta': item.ritorno ? new Date(item.ritorno).toLocaleDateString('it-IT') : '',
      'Itinerario': item.itinerario,
      'Neto': item.neto || 0,
      'Venduto': item.venduto || 0,
      'Estado': item.estado,
      'Fecha Pago': item.fechaPago ? new Date(item.fechaPago).toLocaleDateString('it-IT') : '',
      'Fecha Activación': item.fechaActivacion ? new Date(item.fechaActivacion).toLocaleDateString('it-IT') : '',
      'Notas': item.notas || '',
      'Fecha Registro': new Date(item.dataRegistro).toLocaleDateString('it-IT'),
      'Creado Por': item.creadoPor
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalles Pasajeros');
    XLSX.writeFile(wb, 'detalles_pasajeros.xlsx');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroIata, filtroPnr, fechaDesde, fechaHasta, fechaIdaDesde, fechaIdaHasta, fechaVueltaDesde, fechaVueltaHasta, fechaActivacionDesde, fechaActivacionHasta]);

  if (!isOpen) return null;

  const columns = [
    'Cliente', 'Pagamento', 'Metodo Pag', 'Pasajero', 'Servicio', 'IATA', 'PNR', 'Fecha Ida', 'Fecha Vuelta', 
    'Itinerario', 'Neto', 'Venduto', 'Estado', 'Fecha Pago', 'Fecha Activación', 
    'Notas', 'Fecha Registro', 'Creado Por'
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999999999] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-none max-h-none flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Detalles por Pasajero y Servicio</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controles */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            {/* Búsqueda global */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por pasajero, cliente, servicio, PNR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por IATA</label>
                <input
                  type="text"
                  placeholder="Buscar IATA..."
                  value={filtroIata}
                  onChange={(e) => setFiltroIata(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por PNR</label>
                <input
                  type="text"
                  placeholder="Buscar PNR..."
                  value={filtroPnr}
                  onChange={(e) => setFiltroPnr(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Registro Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Registro Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Fecha Ida - Fondo Azul */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Fecha Ida Desde</label>
                <input
                  type="date"
                  value={fechaIdaDesde}
                  onChange={(e) => setFechaIdaDesde(e.target.value)}
                  className="w-full px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Fecha Ida Hasta</label>
                <input
                  type="date"
                  value={fechaIdaHasta}
                  onChange={(e) => setFechaIdaHasta(e.target.value)}
                  className="w-full px-2 py-1.5 border border-blue-300 dark:border-blue-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Fecha Vuelta - Fondo Verde */}
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">Fecha Vuelta Desde</label>
                <input
                  type="date"
                  value={fechaVueltaDesde}
                  onChange={(e) => setFechaVueltaDesde(e.target.value)}
                  className="w-full px-2 py-1.5 border border-green-300 dark:border-green-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">Fecha Vuelta Hasta</label>
                <input
                  type="date"
                  value={fechaVueltaHasta}
                  onChange={(e) => setFechaVueltaHasta(e.target.value)}
                  className="w-full px-2 py-1.5 border border-green-300 dark:border-green-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              {/* Fecha Activación - Fondo Amarillo */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg">
                <label className="block text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">Fecha Activación Desde</label>
                <input
                  type="date"
                  value={fechaActivacionDesde}
                  onChange={(e) => setFechaActivacionDesde(e.target.value)}
                  className="w-full px-2 py-1.5 border border-yellow-300 dark:border-yellow-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg">
                <label className="block text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">Fecha Activación Hasta</label>
                <input
                  type="date"
                  value={fechaActivacionHasta}
                  onChange={(e) => setFechaActivacionHasta(e.target.value)}
                  className="w-full px-2 py-1.5 border border-yellow-300 dark:border-yellow-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Controles adicionales */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Mostrar:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleExportToExcel}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="flex-1 overflow-auto">
          <div className="p-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-700 shadow-sm">
                  <TableRow className="bg-gray-700 border-b-2 border-gray-600">
                    {columns.map((header, index) => (
                      <TableCell key={header} isHeader={true} className={`font-bold text-white py-3 px-4 text-xs uppercase tracking-wide bg-gray-700 ${index >= 8 ? 'text-right' : ''}`}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <TableRow 
                        key={item.rowId}
                        className={`hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/50'
                        }`}
                      >
                        <TableCell className="py-2 px-3">
                          <div className="text-gray-600 dark:text-gray-300 text-xs">{item.cliente}</div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200">
                            {item.pagamento || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="text-gray-600 dark:text-gray-300 text-xs">
                            {item.metodoPag || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="font-semibold text-gray-900 dark:text-white text-xs">{item.nombrePasajero}</div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900 dark:to-blue-800 dark:text-blue-200 shadow-sm">
                            {item.servicio}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="text-gray-600 dark:text-gray-300 font-mono text-xs">{item.iata || '-'}</div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="text-gray-600 dark:text-gray-300 font-mono text-xs">{item.pnr || '-'}</div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="text-gray-600 dark:text-gray-300 text-xs">
                            {item.andata ? new Date(item.andata).toLocaleDateString('it-IT') : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="text-gray-600 dark:text-gray-300 text-xs">
                            {item.ritorno ? new Date(item.ritorno).toLocaleDateString('it-IT') : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="text-gray-600 dark:text-gray-300 truncate max-w-[150px] text-xs" title={item.itinerario}>
                            {item.itinerario}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right">
                          <div className="font-semibold font-mono text-xs text-gray-900 dark:text-white">
                            {item.neto ? `€${item.neto.toFixed(2)}` : '-'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right">
                          <div className="font-semibold font-mono text-xs text-gray-900 dark:text-white">
                            {item.venduto ? `€${item.venduto.toFixed(2)}` : '-'}
                          </div>
                        </TableCell>
                        
                        {/* Estado */}
                        <TableCell className="py-2 px-3">
                          {editingEstadoId === item.rowId ? (
                            <select
                              value={item.estado}
                              autoFocus
                              onChange={(e) => handleEstadoChange(item.rowId, e.target.value)}
                              onBlur={() => setEditingEstadoId(null)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                            >
                              <option value="Pendiente">Pendiente</option>
                              <option value="Pagado">Pagado</option>
                            </select>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingEstadoId(item.rowId);
                              }}
                              className={`text-xs px-2 py-1 rounded text-center font-medium ${
                                item.estado === 'Pagado' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                              } hover:opacity-80`}
                              title="Clic para editar"
                            >
                              {item.estado}
                            </button>
                          )}
                        </TableCell>
                        
                        {/* Fecha Pago */}
                        <TableCell className="py-2 px-3">
                          {editingFechaPagoId === item.rowId ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="date"
                                value={tempFechaPago}
                                onChange={(e) => setTempFechaPago(e.target.value)}
                                autoFocus
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                              />
                              <button
                                onClick={() => saveFecha(item.rowId, 'pago')}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                title="Guardar"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => cancelEditingFecha('pago')}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                title="Cancelar"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startEditingFecha(item.rowId, 'pago', item.fechaPago);
                              }}
                              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                              title="Clic para editar"
                            >
                              {item.fechaPago ? new Date(item.fechaPago).toLocaleDateString('it-IT') : '-'}
                            </button>
                          )}
                        </TableCell>
                        
                        {/* Fecha Activación */}
                        <TableCell className="py-2 px-3">
                          {editingFechaActivacionId === item.rowId ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="date"
                                value={tempFechaActivacion}
                                onChange={(e) => setTempFechaActivacion(e.target.value)}
                                autoFocus
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                              />
                              <button
                                onClick={() => saveFecha(item.rowId, 'activacion')}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                title="Guardar"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => cancelEditingFecha('activacion')}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                title="Cancelar"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startEditingFecha(item.rowId, 'activacion', item.fechaActivacion);
                              }}
                              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                              title="Clic para editar"
                            >
                              {item.fechaActivacion ? new Date(item.fechaActivacion).toLocaleDateString('it-IT') : '-'}
                            </button>
                          )}
                        </TableCell>
                        
                        {/* Notas */}
                        <TableCell className="py-2 px-3">
                          {editingNotasId === item.rowId ? (
                            <div className="flex items-center space-x-1">
                              <textarea
                                value={tempNotas}
                                onChange={(e) => setTempNotas(e.target.value)}
                                autoFocus
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white resize-none"
                                rows={2}
                                placeholder="Agregar notas..."
                              />
                              <button
                                onClick={() => saveNotas(item.rowId)}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                title="Guardar"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => cancelEditingNotas()}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                title="Cancelar"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startEditingNotas(item.rowId, item.notas);
                              }}
                              className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left min-h-[32px] flex items-center"
                              title="Clic para editar"
                            >
                              {item.notas ? (
                                <span className="truncate max-w-[150px]" title={item.notas}>
                                  {item.notas}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">Agregar notas...</span>
                              )}
                            </button>
                          )}
                        </TableCell>
                        
                        <TableCell className="py-2 px-3">
                          <div className="text-gray-600 dark:text-gray-300 text-xs">
                            {new Date(item.dataRegistro).toLocaleDateString('it-IT')}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {item.creadoPor}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={18} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                            {searchTerm ? 'No se encontraron resultados' : 'No hay datos disponibles'}
                          </div>
                          <div className="text-gray-400 dark:text-gray-500 text-sm">
                            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Los datos aparecerán aquí cuando se registren pasajeros'}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {/* Fila de Total */}
                  {currentData.length > 0 && (
                    <TableRow className="bg-purple-50 dark:bg-purple-900/20 border-t-2 border-purple-200 dark:border-purple-700">
                      <TableCell colSpan={1} className="py-2 px-3 text-left font-semibold text-purple-800 dark:text-purple-200 text-xs">
                        Total:
                      </TableCell>
                      <TableCell colSpan={9} className="py-2 px-3">&nbsp;</TableCell>
                      <TableCell className="py-2 px-3 text-right">
                        <div className="font-bold text-purple-900 dark:text-purple-100 text-sm">
                          €{totalNeto.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-3 text-right">
                        <div className="font-bold text-purple-900 dark:text-purple-100 text-sm">
                          €{totalVenduto.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell colSpan={6} className="py-2 px-3">&nbsp;</TableCell>
                    </TableRow>
                  )}
                </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredData.length)} de {filteredData.length} registros
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PassengerDetailsTable;