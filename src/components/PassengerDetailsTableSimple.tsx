"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import usePassengerServiceDetails, { PassengerServiceUpdatePayload } from '@/hooks/usePassengerServiceDetails';
import { useUserRole } from '@/hooks/useUserRole';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('it-IT');
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return `€${value.toFixed(2)}`;
};

const translateEstado = (estado: string | null | undefined): string => {
  if (!estado) return '-';
  const normalized = estado.toLowerCase();
  if (normalized === 'pagado') return 'Pagato';
  if (normalized === 'pendiente') return 'Attesa';
  return estado;
};

const getReadableNotes = (value: string | null | undefined) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed) {
        const readableFields = [
          'notasUsuario',
          'descripcion',
          'nota',
          'notaUsuario',
          'comentario',
          'osservazioni',
        ];
        const collected: string[] = [];
        readableFields.forEach((field) => {
          const candidate = (parsed as Record<string, unknown>)[field];
          if (typeof candidate === 'string' && candidate.trim()) {
            collected.push(candidate.trim());
          }
        });
        if (collected.length > 0) {
          return collected.join(' - ');
        }
        return '';
      }
    } catch {
      // ignore json parse errors and fallback to original string
    }
  }
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const joined = parsed
          .filter((entry) => typeof entry === 'string' && entry.trim())
          .join(', ');
        return joined || '';
      }
    } catch {
      // ignore json parse errors and fallback to original string
    }
  }
  return trimmed;
};

interface PassengerDetailsTableSimpleProps {
  isOpen: boolean;
  onClose: () => void;
}

const PassengerDetailsTableSimple: React.FC<PassengerDetailsTableSimpleProps> = ({ isOpen, onClose }) => {
  const { details, loading, error, updateDetail, isUpdating } = usePassengerServiceDetails(isOpen, { pageSize: 4000 });
  const { userRole, isLoading: roleLoading, isAdmin, isTI } = useUserRole();
  const canEditEstado = !roleLoading && (isAdmin || isTI);
  const canEditFechaPago = canEditEstado;
  const canEditActivacion = !roleLoading && !!userRole;
  const canEditNotas = canEditActivacion;
  const servicioOptions = useMemo(() => {
    const map = new Map<string, string>();
    details.forEach((detail) => {
      if (!detail.servicio) return;
      const upper = detail.servicio.toUpperCase();
      if (!map.has(upper)) {
        map.set(upper, detail.servicio);
      }
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [details]);

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
  const [estadoFilter, setEstadoFilter] = useState('');
  const [servicioFilter, setServicioFilter] = useState('');
  const [metodoCompraFilter, setMetodoCompraFilter] = useState('');

  const [editingEstadoId, setEditingEstadoId] = useState<string | null>(null);
  const [editingFechaPagoId, setEditingFechaPagoId] = useState<string | null>(null);
  const [editingFechaActivacionId, setEditingFechaActivacionId] = useState<string | null>(null);
  const [editingNotasId, setEditingNotasId] = useState<string | null>(null);
  const [tempFechaPago, setTempFechaPago] = useState<string>('');
  const [tempFechaActivacion, setTempFechaActivacion] = useState<string>('');
  const [tempNotas, setTempNotas] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setCurrentPage(1);
      setSearchTerm('');
      setFiltroIata('');
      setFiltroPnr('');
      setFechaDesde('');
      setFechaHasta('');
      setFechaIdaDesde('');
      setFechaIdaHasta('');
      setFechaVueltaDesde('');
      setFechaVueltaHasta('');
      setFechaActivacionDesde('');
      setFechaActivacionHasta('');
      setEstadoFilter('');
      setServicioFilter('');
      setMetodoCompraFilter('');
      setEditingEstadoId(null);
      setEditingFechaPagoId(null);
      setEditingFechaActivacionId(null);
      setEditingNotasId(null);
      setTempFechaPago('');
      setTempFechaActivacion('');
      setTempNotas('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!canEditEstado) {
      setEditingEstadoId(null);
    }
    if (!canEditFechaPago) {
      setEditingFechaPagoId(null);
      setTempFechaPago('');
    }
    if (!canEditActivacion) {
      setEditingFechaActivacionId(null);
      setTempFechaActivacion('');
    }
    if (!canEditNotas) {
      setEditingNotasId(null);
      setTempNotas('');
    }
  }, [canEditEstado, canEditFechaPago, canEditActivacion, canEditNotas]);

  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtroIataLower = filtroIata.toLowerCase();
    const filtroPnrLower = filtroPnr.toLowerCase();
    const metodoCompraLower = metodoCompraFilter.toLowerCase();
    const servicioUpper = servicioFilter.toUpperCase();
    const fechaDesdeDate = fechaDesde ? new Date(fechaDesde) : null;
    const fechaHastaDate = fechaHasta ? new Date(fechaHasta) : null;
    const fechaIdaDesdeDate = fechaIdaDesde ? new Date(fechaIdaDesde) : null;
    const fechaIdaHastaDate = fechaIdaHasta ? new Date(fechaIdaHasta) : null;
    const fechaVueltaDesdeDate = fechaVueltaDesde ? new Date(fechaVueltaDesde) : null;
    const fechaVueltaHastaDate = fechaVueltaHasta ? new Date(fechaVueltaHasta) : null;
    const fechaActivacionDesdeDate = fechaActivacionDesde ? new Date(fechaActivacionDesde) : null;
    const fechaActivacionHastaDate = fechaActivacionHasta ? new Date(fechaActivacionHasta) : null;

    return details.filter(detail => {
      if (searchLower) {
        const matchesSearch =
          detail.pasajero.toLowerCase().includes(searchLower) ||
          detail.cliente.toLowerCase().includes(searchLower) ||
          detail.servicio.toLowerCase().includes(searchLower) ||
          (detail.pnr && detail.pnr.toLowerCase().includes(searchLower)) ||
          (detail.itinerario && detail.itinerario.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      const detailServicioUpper = detail.servicio ? detail.servicio.toUpperCase() : '';
      if (servicioFilter && detailServicioUpper !== servicioUpper) return false;
      if (estadoFilter && detail.estado !== estadoFilter) return false;
      if (metodoCompraLower && (!detail.metodoDiAcquisto || !detail.metodoDiAcquisto.toLowerCase().includes(metodoCompraLower))) return false;

      if (filtroIata && (!detail.iata || !detail.iata.toLowerCase().includes(filtroIataLower))) return false;
      if (filtroPnr && (!detail.pnr || !detail.pnr.toLowerCase().includes(filtroPnrLower))) return false;

      const registroDate = detail.dataRegistro ? new Date(detail.dataRegistro) : null;
      if (fechaDesdeDate && registroDate && registroDate < fechaDesdeDate) return false;
      if (fechaHastaDate && registroDate && registroDate > fechaHastaDate) return false;

      const andataDate = detail.andata ? new Date(detail.andata) : null;
      const ritornoDate = detail.ritorno ? new Date(detail.ritorno) : null;
      if (fechaIdaDesdeDate && andataDate && andataDate < fechaIdaDesdeDate) return false;
      if (fechaIdaHastaDate && andataDate && andataDate > fechaIdaHastaDate) return false;
      if (fechaVueltaDesdeDate && ritornoDate && ritornoDate < fechaVueltaDesdeDate) return false;
      if (fechaVueltaHastaDate && ritornoDate && ritornoDate > fechaVueltaHastaDate) return false;

      const activacionDate = detail.fechaActivacion ? new Date(detail.fechaActivacion) : null;
      if (fechaActivacionDesdeDate && activacionDate && activacionDate < fechaActivacionDesdeDate) return false;
      if (fechaActivacionHastaDate && activacionDate && activacionDate > fechaActivacionHastaDate) return false;

      return true;
    });
  }, [
    details,
    searchTerm,
    filtroIata,
    filtroPnr,
    fechaDesde,
    fechaHasta,
    fechaIdaDesde,
    fechaIdaHasta,
    fechaVueltaDesde,
    fechaVueltaHasta,
    fechaActivacionDesde,
    fechaActivacionHasta,
    estadoFilter,
    servicioFilter,
    metodoCompraFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filtroIata,
    filtroPnr,
    fechaDesde,
    fechaHasta,
    fechaIdaDesde,
    fechaIdaHasta,
    fechaVueltaDesde,
    fechaVueltaHasta,
    fechaActivacionDesde,
    fechaActivacionHasta,
    estadoFilter,
    servicioFilter,
    metodoCompraFilter,
    itemsPerPage,
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const exportToExcel = () => {
    const dataToExport = filteredData.map(item => ({
      Cliente: item.cliente,
      Passeggero: item.pasajero,
      Servizio: item.servicio,
      'Netto Servizio': item.neto || 0,
      IATA: item.iata || '-',
      PNR: item.pnr || '-',
      "Data d'andata": formatDate(item.servicio.toLowerCase().includes('volo') ? item.andata : null),
      'Data di ritorno': formatDate(item.servicio.toLowerCase().includes('volo') ? item.ritorno : null),
      Itinerario: item.itinerario || '-',
      'Metodo di acquisto': item.metodoDiAcquisto || '-',
      Stato: translateEstado(item.estado),
      'Data Pagamento': formatDate(item.fechaPago),
      'Data Attivazione': formatDate(item.fechaActivacion),
      Note: getReadableNotes(item.notas) || '-',
      'Data Registrazione': formatDate(item.dataRegistro),
      'Creato da': item.creador || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Passeggeri');
    XLSX.writeFile(wb, `dettagli_passeggeri_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleSaveFecha = async (id: string) => {
    if (!canEditActivacion) return;
    try {
      await updateDetail(id, { fechaActivacion: tempFechaActivacion || null });
      setEditingFechaActivacionId(null);
      setTempFechaActivacion('');
    } catch (err) {
      alert((err as Error)?.message || "Errore durante l'aggiornamento della data di attivazione");
    }
  };

  const handleSaveNotas = async (id: string) => {
    if (!canEditNotas) return;
    try {
      const value = tempNotas.trim();
      await updateDetail(id, { notas: value ? value : null });
      setEditingNotasId(null);
      setTempNotas('');
    } catch (err) {
      alert((err as Error)?.message || "Errore durante l'aggiornamento delle note");
    }
  };

  const handleSaveEstado = async (id: string, newEstado: string, hasFechaPago: boolean) => {
    if (!canEditEstado) return;
    try {
      const payload: PassengerServiceUpdatePayload = { estado: newEstado };
      if (newEstado === 'Pagado' && !hasFechaPago) {
        payload.fechaPago = new Date().toISOString().split('T')[0];
      }
      await updateDetail(id, payload);
      setEditingEstadoId(null);
    } catch (err) {
      alert((err as Error)?.message || "Errore durante l'aggiornamento dello stato");
    }
  };

  const handleSaveFechaPago = async (id: string) => {
    if (!canEditFechaPago) return;
    try {
      await updateDetail(id, { fechaPago: tempFechaPago || null });
      setEditingFechaPagoId(null);
      setTempFechaPago('');
    } catch (err) {
      alert((err as Error)?.message || "Errore durante l'aggiornamento della data di pagamento");
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999999999] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-none max-h-none flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              Dettagli per Passeggero e Servizio (Semplificato)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Dati individuali per passeggero e servizio
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca per passeggero, cliente, servizio, PNR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filtra per IATA
                </label>
                <input
                  type="text"
                  placeholder="Cerca IATA..."
                  value={filtroIata}
                  onChange={(e) => setFiltroIata(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filtra per PNR
                </label>
                <input
                  type="text"
                  placeholder="Cerca PNR..."
                  value={filtroPnr}
                  onChange={(e) => setFiltroPnr(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data registrazione da
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data registrazione a
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Servizio
                </label>
                <select
                  value={servicioFilter}
                  onChange={(e) => setServicioFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Tutti</option>
                  {servicioOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stato
                </label>
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Tutti</option>
                  <option value="Pendiente">Attesa</option>
                  <option value="Pagado">Pagato</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Metodo di acquisto
                </label>
                <input
                  type="text"
                  placeholder="Cerca metodo..."
                  value={metodoCompraFilter}
                  onChange={(e) => setMetodoCompraFilter(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              {[
                {
                  label: "Data d'andata da",
                  value: fechaIdaDesde,
                  setter: setFechaIdaDesde,
                  containerClass: 'bg-blue-50 dark:bg-blue-900/20',
                  labelClass: 'text-blue-700 dark:text-blue-300',
                  borderClass: 'border-blue-300 dark:border-blue-600',
                  ringClass: 'focus:ring-blue-500',
                },
                {
                  label: "Data d'andata a",
                  value: fechaIdaHasta,
                  setter: setFechaIdaHasta,
                  containerClass: 'bg-blue-50 dark:bg-blue-900/20',
                  labelClass: 'text-blue-700 dark:text-blue-300',
                  borderClass: 'border-blue-300 dark:border-blue-600',
                  ringClass: 'focus:ring-blue-500',
                },
                {
                  label: 'Data di ritorno da',
                  value: fechaVueltaDesde,
                  setter: setFechaVueltaDesde,
                  containerClass: 'bg-green-50 dark:bg-green-900/20',
                  labelClass: 'text-green-700 dark:text-green-300',
                  borderClass: 'border-green-300 dark:border-green-600',
                  ringClass: 'focus:ring-green-500',
                },
                {
                  label: 'Data di ritorno a',
                  value: fechaVueltaHasta,
                  setter: setFechaVueltaHasta,
                  containerClass: 'bg-green-50 dark:bg-green-900/20',
                  labelClass: 'text-green-700 dark:text-green-300',
                  borderClass: 'border-green-300 dark:border-green-600',
                  ringClass: 'focus:ring-green-500',
                },
                {
                  label: 'Data attivazione da',
                  value: fechaActivacionDesde,
                  setter: setFechaActivacionDesde,
                  containerClass: 'bg-yellow-50 dark:bg-yellow-900/20',
                  labelClass: 'text-yellow-700 dark:text-yellow-300',
                  borderClass: 'border-yellow-300 dark:border-yellow-600',
                  ringClass: 'focus:ring-yellow-500',
                },
                {
                  label: 'Data attivazione a',
                  value: fechaActivacionHasta,
                  setter: setFechaActivacionHasta,
                  containerClass: 'bg-yellow-50 dark:bg-yellow-900/20',
                  labelClass: 'text-yellow-700 dark:text-yellow-300',
                  borderClass: 'border-yellow-300 dark:border-yellow-600',
                  ringClass: 'focus:ring-yellow-500',
                },
              ].map(({ label, value, setter, containerClass, labelClass, borderClass, ringClass }) => (
                <div key={label} className={`${containerClass} p-2 rounded-lg`}>
                  <label className={`block text-xs font-medium ${labelClass} mb-1`}>
                    {label}
                  </label>
                  <input
                    type="date"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className={`w-full px-2 py-1.5 border ${borderClass} rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 ${ringClass} focus:border-transparent`}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Mostra:
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToExcel}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                <span>Esporta Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-gray-700 shadow-sm">
                    <TableRow className="bg-gray-700 border-b-2 border-gray-600">
                      {[
                        'Cliente',
                        'Pagamento',
                        'Metodo Pagamento',
                        'Passeggero',
                        'Servizio',
                        'Netto Servizio',
                        'IATA',
                        'PNR',
                        "Data d'andata",
                        'Data di ritorno',
                        'Itinerario',
                        'Metodo di acquisto',
                        'Stato',
                        'Data Pagamento',
                        'Data Attivazione',
                        'Note',
                        'Data Registrazione',
                        'Creato da',
                      ].map(header => (
                        <TableCell
                          key={header}
                          isHeader={true}
                          className={`font-bold text-white py-3 px-4 text-xs uppercase tracking-wide bg-gray-700 ${
                            header === 'Neto Servicio' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={18} className="py-12 text-center text-gray-500 dark:text-gray-400">
                          Cargando detalles...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={18} className="py-12 text-center text-red-500">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={18} className="py-12 text-center text-gray-500 dark:text-gray-400">
                          No se encontraron registros
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((item, index) => (
                        <TableRow
                          key={item.id}
                          className={`hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200 ${
                            index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/50'
                          }`}
                        >
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300">
                            {item.cliente}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300">
                            {item.pagamento || '-'}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300">
                            {item.metodoPag || '-'}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs font-semibold text-gray-900 dark:text-white">
                            {item.pasajero}
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900 dark:to-blue-800 dark:text-blue-200 shadow-sm">
                              {item.servicio}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white font-semibold">
                            {formatCurrency(item.neto)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs font-mono text-gray-700 dark:text-gray-300">
                            {item.iata || '-'}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs font-mono text-gray-700 dark:text-gray-300">
                            {item.pnr || '-'}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300">
                        {item.servicio.toLowerCase().includes('volo') ? formatDate(item.andata) : '-'}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300">
                        {item.servicio.toLowerCase().includes('volo') ? formatDate(item.ritorno) : '-'}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300 truncate max-w-[160px]">
                            <span title={item.itinerario || ''}>
                              {item.itinerario || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300">
                            {item.metodoDiAcquisto || '-'}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs">
                            {canEditEstado && editingEstadoId === item.id ? (
                              <select
                                value={item.estado}
                                onChange={(e) => handleSaveEstado(item.id, e.target.value, !!item.fechaPago)}
                                onBlur={() => setEditingEstadoId(null)}
                                autoFocus
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              >
                                <option value="Pendiente">Attesa</option>
                                <option value="Pagado">Pagato</option>
                              </select>
                            ) : canEditEstado ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingEstadoId(item.id);
                                }}
                                className={`text-xs px-2 py-1 rounded text-center font-medium ${
                                  item.estado === 'Pagado'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-yellow-500 text-white'
                                } hover:opacity-80`}
                                title="Clicca per modificare"
                              >
                                {translateEstado(item.estado)}
                              </button>
                            ) : (
                              <span
                                className={`inline-block text-xs px-2 py-1 rounded text-center font-medium ${
                                  item.estado === 'Pagado'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-yellow-500 text-white'
                                }`}
                              >
                                {translateEstado(item.estado)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300">
                            {canEditFechaPago && editingFechaPagoId === item.id ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="date"
                                  value={tempFechaPago}
                                  onChange={(e) => setTempFechaPago(e.target.value)}
                                  autoFocus
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                                <button
                                  onClick={() => handleSaveFechaPago(item.id)}
                                  disabled={isUpdating}
                                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                  title="Salva"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingFechaPagoId(null);
                                    setTempFechaPago('');
                                  }}
                                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                  title="Annulla"
                                >
                                  ✗
                                </button>
                              </div>
                            ) : canEditFechaPago ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTempFechaPago(item.fechaPago ? item.fechaPago.split('T')[0] : '');
                                  setEditingFechaPagoId(item.id);
                                }}
                                className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 w-full text-left"
                                title="Clicca per modificare"
                              >
                                {formatDate(item.fechaPago)}
                              </button>
                            ) : (
                              <span className="text-xs px-2 py-1 block text-gray-700 dark:text-gray-300">
                                {formatDate(item.fechaPago)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs">
                            {canEditActivacion && editingFechaActivacionId === item.id ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="date"
                                  value={tempFechaActivacion}
                                  onChange={(e) => setTempFechaActivacion(e.target.value)}
                                  autoFocus
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                                <button
                                  onClick={() => handleSaveFecha(item.id)}
                                  disabled={isUpdating}
                                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                  title="Salva"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingFechaActivacionId(null);
                                    setTempFechaActivacion('');
                                  }}
                                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                  title="Annulla"
                                >
                                  ✗
                                </button>
                              </div>
                            ) : canEditActivacion ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTempFechaActivacion(
                                    item.fechaActivacion ? item.fechaActivacion.split('T')[0] : ''
                                  );
                                  setEditingFechaActivacionId(item.id);
                                }}
                                className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 w-full text-left"
                                title="Clicca per modificare"
                              >
                                {formatDate(item.fechaActivacion)}
                              </button>
                            ) : (
                              <span className="text-xs px-2 py-1 block text-gray-700 dark:text-gray-300">
                                {formatDate(item.fechaActivacion)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs">
                            {canEditNotas && editingNotasId === item.id ? (
                              <div className="flex items-center space-x-1">
                                <textarea
                                  value={tempNotas}
                                  onChange={(e) => setTempNotas(e.target.value)}
                                  autoFocus
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white resize-none"
                                  rows={2}
                                  placeholder="Aggiungi note..."
                                />
                                <button
                                  onClick={() => handleSaveNotas(item.id)}
                                  disabled={isUpdating}
                                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                  title="Salva"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNotasId(null);
                                    setTempNotas('');
                                  }}
                                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                  title="Annulla"
                                >
                                  ✗
                                </button>
                              </div>
                            ) : canEditNotas ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTempNotas(getReadableNotes(item.notas));
                                  setEditingNotasId(item.id);
                                }}
                                className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 w-full text-left"
                                title="Clicca per modificare"
                              >
                                {getReadableNotes(item.notas) ? (
                                  <span className="truncate max-w-[180px]" title={getReadableNotes(item.notas)}>
                                    {getReadableNotes(item.notas)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Aggiungi note...</span>
                                )}
                              </button>
                            ) : (
                              <span className="text-xs px-2 py-1 block text-gray-700 dark:text-gray-300">
                                {getReadableNotes(item.notas) ? (
                                  <span className="truncate max-w-[180px]" title={getReadableNotes(item.notas)}>
                                    {getReadableNotes(item.notas)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Aggiungi note...</span>
                                )}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300">
                            {formatDate(item.dataRegistro)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-xs text-gray-700 dark:text-gray-300">
                            {item.creador || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Visualizzazione {filteredData.length === 0 ? 0 : startIndex + 1} -{' '}
              {Math.min(startIndex + itemsPerPage, filteredData.length)} di {filteredData.length} record
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
                Pagina {currentPage} di {totalPages}
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
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PassengerDetailsTableSimple;

