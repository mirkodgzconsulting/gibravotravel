"use client";

import React, { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BiglietteriaRecord {
  id: string;
  pagamento: string;
  data: string;
  iata: string;
  pnr: string | null;
  passeggero: string;
  itinerario: string;
  servizio: string;
  neto: number;
  venduto: number;
  acconto: number;
  daPagare: number;
  metodoPagamento: string;
  feeAgv: number;
  origine: string;
  cliente: string;
  codiceFiscale: string;
  indirizzo: string;
  email: string;
  numeroTelefono: string;
  creadoPor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  address: string;
  email: string;
  phoneNumber: string;
}

interface BiglietteriaFormData {
  cliente: string;
  codiceFiscale: string;
  indirizzo: string;
  email: string;
  numeroTelefono: string;
  pagamento: string;
  data: string;
  iata: string;
  pnr: string;
  passeggero: string;
  itinerario: string;
  servizio: string;
  neto: string;
  venduto: string;
  acconto: string;
  daPagare: string;
  metodoPagamento: string;
  feeAgv: string;
  origine: string;
}



export default function BiglietteriaPage() {
  const { canAccessGestione, isLoading: roleLoading } = useUserRole();
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();
  
  const [records, setRecords] = useState<BiglietteriaRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para datos de referencia
  const [pagamenti, setPagamenti] = useState<string[]>([]);
  const [iataList, setIataList] = useState<string[]>([]);
  const [servizi, setServizi] = useState<string[]>([]);
  const [metodiPagamento, setMetodiPagamento] = useState<string[]>([]);
  const [origini, setOrigini] = useState<string[]>([]);

  const [formData, setFormData] = useState<BiglietteriaFormData>({
    cliente: '',
    codiceFiscale: '',
    indirizzo: '',
    email: '',
    numeroTelefono: '',
    pagamento: '',
    data: '',
    iata: '',
    pnr: '',
    passeggero: '',
    itinerario: '',
    servizio: '',
    neto: '',
    venduto: '',
    acconto: '',
    daPagare: '',
    metodoPagamento: '',
    feeAgv: '',
    origine: ''
  });


  // Fetch datos iniciales
  useEffect(() => {
    fetchRecords();
    fetchClients();
    fetchReferenceData();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/biglietteria');
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      } else {
        console.error('Error fetching records');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchReferenceData = async () => {
    try {
      // Fetch pagamenti
      const pagResponse = await fetch('/api/reference/pagamento');
      if (pagResponse.ok) {
        const pagData = await pagResponse.json();
        setPagamenti(pagData.map((p: { pagamento: string }) => p.pagamento));
      }

      // Fetch iata
      const iataResponse = await fetch('/api/reference/iata');
      if (iataResponse.ok) {
        const iataData = await iataResponse.json();
        setIataList(iataData.map((i: { iata: string }) => i.iata));
      }

      // Fetch servizi
      const servResponse = await fetch('/api/reference/servizio');
      if (servResponse.ok) {
        const servData = await servResponse.json();
        setServizi(servData.map((s: { servizio: string }) => s.servizio));
      }

      // Fetch metodi pagamento
      const metResponse = await fetch('/api/reference/metodo-pagamento');
      if (metResponse.ok) {
        const metData = await metResponse.json();
        setMetodiPagamento(metData.map((m: { metodoPagamento: string }) => m.metodoPagamento));
      }

      // Fetch origini
      const origResponse = await fetch('/api/reference/origine');
      if (origResponse.ok) {
        const origData = await origResponse.json();
        setOrigini(origData.map((o: { origine: string }) => o.origine));
      }
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  // Calcular daPagare automáticamente
  useEffect(() => {
    if (formData.venduto && formData.acconto) {
      const venduto = parseFloat(formData.venduto) || 0;
      const acconto = parseFloat(formData.acconto) || 0;
      const daPagare = venduto - acconto;
      setFormData(prev => ({ ...prev, daPagare: daPagare.toString() }));
    }
  }, [formData.venduto, formData.acconto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/biglietteria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Registro de biglietteria creado exitosamente'
        });
        setFormData({
          cliente: '',
          codiceFiscale: '',
          indirizzo: '',
          email: '',
          numeroTelefono: '',
          pagamento: '',
          data: '',
          iata: '',
          pnr: '',
          passeggero: '',
          itinerario: '',
          servizio: '',
          neto: '',
          venduto: '',
          acconto: '',
          daPagare: '',
          metodoPagamento: '',
          feeAgv: '',
          origine: ''
        });
        closeModal();
        fetchRecords();
      } else {
        const errorData = await response.json();
        setMessage({
          type: 'error',
          text: errorData.error || 'Error al crear el registro'
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({
        type: 'error',
        text: 'Error de conexión'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        cliente: `${selectedClient.firstName} ${selectedClient.lastName}`,
        codiceFiscale: selectedClient.fiscalCode,
        indirizzo: selectedClient.address,
        email: selectedClient.email,
        numeroTelefono: selectedClient.phoneNumber
      }));
    }
  };

  const handleExportToExcel = () => {
    try {
      const exportData = records.map(record => ({
        'Cliente': record.cliente,
        'Codice Fiscale': record.codiceFiscale,
        'Indirizzo': record.indirizzo,
        'Email': record.email,
        'Numero Telefono': record.numeroTelefono,
        'Pagamento': record.pagamento,
        'Data': record.data ? new Date(record.data).toLocaleDateString('it-IT') : '',
        'IATA': record.iata,
        'PNR': record.pnr || '',
        'Passeggero': record.passeggero,
        'Itinerario': record.itinerario,
        'Servizio': record.servizio,
        'Neto': record.neto,
        'Venduto': record.venduto,
        'Acconto': record.acconto,
        'Da Pagare': record.daPagare,
        'Metodo Pagamento': record.metodoPagamento,
        'Fee AGV': record.feeAgv,
        'Origine': record.origine,
        'Creado Por': record.creadoPor,
        'Data Registro': record.createdAt ? new Date(record.createdAt).toLocaleDateString('it-IT') : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Biglietteria');

      const fileName = `biglietteria_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setMessage({
        type: 'success',
        text: `File Excel esportato con successo: ${fileName} (${records.length} registri)`
      });
    } catch (error) {
      console.error('❌ Export error:', error);
      setMessage({
        type: 'error',
        text: 'Errore durante l\'esportazione del file Excel'
      });
    }
  };

  // Filtrado y paginación
  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.cliente.toLowerCase().includes(searchLower) ||
      record.passeggero.toLowerCase().includes(searchLower) ||
      record.itinerario.toLowerCase().includes(searchLower) ||
      record.iata.toLowerCase().includes(searchLower) ||
      (record.pnr && record.pnr.toLowerCase().includes(searchLower))
    );
  });

  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredRecords.slice(startIndex, endIndex);


  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!canAccessGestione) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accesso Negato</h1>
          <p className="text-gray-600">Non hai i permessi per accedere a questa sezione.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mensaje de estado */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Botón para agregar nuevo registro */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuovo Biglietto
        </button>
      </div>

      {/* Tabla de registros */}
      <div className="w-full border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-2xl">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
            {/* Header con selector y buscador */}
            <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  Biglietti: {records.length.toLocaleString()}
                </span>
                <button
                  onClick={handleExportToExcel}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300 rounded transition-colors duration-200"
                  title="Esporta tutti i biglietti in Excel"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
                {/* Paginación selector */}
                <span className="text-gray-500 dark:text-gray-400">Mostra</span>
                <div className="relative z-20 bg-transparent">
                  <select
                    className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    {[10, 15, 50, 100].map((value) => (
                      <option
                        key={value}
                        value={value}
                        className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                      >
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-gray-500 dark:text-gray-400">registri</span>
              </div>

              {/* Buscador */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca biglietti..."
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
                />
              </div>
            </div>

            {/* Tabla */}
            <div className="max-w-full overflow-x-auto">
              <Table className="w-full min-w-[1800px]">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Cliente
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Codice Fiscale
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Indirizzo
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Email
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Telefono
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Pagamento
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Data
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      IATA
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      PNR
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Passeggero
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Itinerario
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Servizio
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Neto (€)
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Venduto (€)
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Acconto (€)
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Da Pagare (€)
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Metodo Pag.
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Fee AGV (€)
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Origine
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Azioni
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={19} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'Nessun biglietto trovato con i criteri di ricerca' : 'Nessun biglietto registrato'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {record.cliente}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.codiceFiscale}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.indirizzo}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.email}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.numeroTelefono}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.pagamento}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {new Date(record.data).toLocaleDateString('it-IT')}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.iata}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.pnr || '-'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.passeggero}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.itinerario}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.servizio}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          €{record.neto.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          €{record.venduto.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          €{record.acconto.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          €{record.daPagare.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.metodoPagamento}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          €{record.feeAgv.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {record.origine}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2">
                            {/* Botón Editar */}
                            <button
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title="Modifica biglietto"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Botón Eliminar */}
                            <button
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title="Elimina biglietto"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>

                            {/* Botón Recibo */}
                            <button
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title="Genera recibo"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Footer de paginación */}
            <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                {/* Información de registros mostrados */}
                <div className="pb-3 xl:pb-0">
                  <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
                    Mostrando {startIndex + 1} a {endIndex} di {totalItems} registri
                  </p>
                </div>

                {/* Controles de paginación */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                  >
                    Precedente
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            currentPage === pageNum
                              ? 'bg-brand-500 text-white'
                              : 'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                  >
                    Successivo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal para agregar/editar */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="w-[700px] max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col mx-auto">
          {/* Header fijo */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Nuovo Biglietto
            </h2>
          </div>
          
          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-8">
            {/* Cliente */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente *
              </label>
              <select
                value={formData.cliente}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Seleziona un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos automáticos del cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  value={formData.codiceFiscale}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Indirizzo
                </label>
                <input
                  type="text"
                  value={formData.indirizzo}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numero di Telefono
                </label>
                <input
                  type="text"
                  value={formData.numeroTelefono}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Campos principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pagamento *
                </label>
                <select
                  value={formData.pagamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, pagamento: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleziona</option>
                  {pagamenti.map((pagamento) => (
                    <option key={pagamento} value={pagamento}>
                      {pagamento}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IATA *
                </label>
                <select
                  value={formData.iata}
                  onChange={(e) => setFormData(prev => ({ ...prev, iata: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleziona</option>
                  {iataList.map((iata) => (
                    <option key={iata} value={iata}>
                      {iata}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PNR
                </label>
                <input
                  type="text"
                  value={formData.pnr}
                  onChange={(e) => setFormData(prev => ({ ...prev, pnr: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Passeggero *
                </label>
                <input
                  type="text"
                  value={formData.passeggero}
                  onChange={(e) => setFormData(prev => ({ ...prev, passeggero: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Itinerario *
              </label>
              <input
                type="text"
                value={formData.itinerario}
                onChange={(e) => setFormData(prev => ({ ...prev, itinerario: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Servizio *
                </label>
                <select
                  value={formData.servizio}
                  onChange={(e) => setFormData(prev => ({ ...prev, servizio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleziona</option>
                  {servizi.map((servizio) => (
                    <option key={servizio} value={servizio}>
                      {servizio}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Origine *
                </label>
                <select
                  value={formData.origine}
                  onChange={(e) => setFormData(prev => ({ ...prev, origine: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleziona</option>
                  {origini.map((origine) => (
                    <option key={origine} value={origine}>
                      {origine}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campos monetarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Neto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.neto}
                  onChange={(e) => setFormData(prev => ({ ...prev, neto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venduto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.venduto}
                  onChange={(e) => setFormData(prev => ({ ...prev, venduto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Acconto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.acconto}
                  onChange={(e) => setFormData(prev => ({ ...prev, acconto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Da Pagare (calcolato)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.daPagare || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Metodo Pagamento *
                </label>
                <select
                  value={formData.metodoPagamento}
                  onChange={(e) => setFormData(prev => ({ ...prev, metodoPagamento: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleziona</option>
                  {metodiPagamento.map((metodo) => (
                    <option key={metodo} value={metodo}>
                      {metodo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fee AGV *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.feeAgv}
                  onChange={(e) => setFormData(prev => ({ ...prev, feeAgv: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            </form>
          </div>
          
          {/* Footer fijo con botones */}
          <div className="flex-shrink-0 px-8 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Salvando...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
