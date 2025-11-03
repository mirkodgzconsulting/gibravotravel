"use client";

import React, { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import ComponentCard from "@/components/common/ComponentCard";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Cliente {
  id: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  address: string;
  phoneNumber: string;
  email: string;
  birthPlace: string;
  birthDate: string;
  document1: string | null;
  document1Name: string | null;
  document2: string | null;
  document2Name: string | null;
  document3: string | null;
  document3Name: string | null;
  document4: string | null;
  document4Name: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface ClienteFormData {
  firstName: string;
  lastName: string;
  fiscalCode: string;
  address: string;
  phoneNumber: string;
  email: string;
  birthPlace: string;
  birthDate: string;
  document1: File | null;
  document2: File | null;
  document3: File | null;
  document4: File | null;
}

// Lista completa de países para el select
const paesi = [
  // Europa
  "Italia",
  "España",
  "Francia",
  "Alemania",
  "Reino Unido",
  "Portugal",
  "Países Bajos",
  "Bélgica",
  "Suiza",
  "Austria",
  "Grecia",
  "Polonia",
  "Rumania",
  "Suecia",
  "Noruega",
  "Dinamarca",
  "Finlandia",
  "Irlanda",
  "República Checa",
  "Hungría",
  "Bulgaria",
  "Croacia",
  "Eslovaquia",
  "Eslovenia",
  "Lituania",
  "Letonia",
  "Estonia",
  "Luxemburgo",
  "Malta",
  "Chipre",
  "Islandia",
  "Serbia",
  "Ucrania",
  "Rusia",
  "Turquía",
  
  // América Latina
  "Argentina",
  "Brasil",
  "Chile",
  "Colombia",
  "México",
  "Perú",
  "Venezuela",
  "Ecuador",
  "Bolivia",
  "Paraguay",
  "Uruguay",
  "Costa Rica",
  "Panamá",
  "Cuba",
  "República Dominicana",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Puerto Rico",
  "Jamaica",
  "Haití",
  "Trinidad y Tobago",
  
  // América del Norte
  "Estados Unidos",
  "Canadá",
  
  // Asia
  "China",
  "Japón",
  "India",
  "Corea del Sur",
  "Tailandia",
  "Vietnam",
  "Filipinas",
  "Indonesia",
  "Malasia",
  "Singapur",
  "Pakistán",
  "Bangladesh",
  "Afganistán",
  "Irán",
  "Irak",
  "Israel",
  "Arabia Saudita",
  "Emiratos Árabes Unidos",
  "Líbano",
  "Jordania",
  "Siria",
  "Yemen",
  
  // África
  "Egipto",
  "Marruecos",
  "Argelia",
  "Túnez",
  "Libia",
  "Sudáfrica",
  "Nigeria",
  "Kenia",
  "Etiopía",
  "Ghana",
  "Senegal",
  "Costa de Marfil",
  "Camerún",
  
  // Oceanía
  "Australia",
  "Nueva Zelanda",
  
  // Otros
  "Otro"
];

export default function ClientiPage() {
  const { canAccessGestione, isLoading: roleLoading, isUser } = useUserRole();
  const modal = useModal();
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formData, setFormData] = useState<ClienteFormData>({
    firstName: "",
    lastName: "",
    fiscalCode: "",
    address: "",
    phoneNumber: "",
    email: "",
    birthPlace: "Italia",
    birthDate: "",
    document1: null,
    document2: null,
    document3: null,
    document4: null,
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    // Solo cargar cuando el rol esté completamente cargado
    if (!roleLoading) {
      fetchClienti();
    }
  }, [roleLoading]); // Cargar cuando termine de cargar el rol

  const fetchClienti = async () => {
    try {
      setLoading(true);
      
      // Verificación adicional: no hacer la llamada si el rol aún está cargando
      if (roleLoading) {
        setLoading(false);
        return;
      }
      
      // Todos los roles (ADMIN, TI, USER) deben ver la misma información completa
      const response = await fetch('/api/clients');
      
      if (response.ok) {
        const data = await response.json();
        setClienti(data.clients || []);
      } else {
        const errorData = await response.json();
        setMessage({ 
          type: 'error', 
          text: `Errore durante il caricamento: ${errorData.error || 'Error desconocido'}` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Errore di connessione: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = (cliente: Cliente) => {
    setEditingClient(cliente);
    setFormData({
      firstName: cliente.firstName,
      lastName: cliente.lastName,
      fiscalCode: cliente.fiscalCode,
      address: cliente.address,
      phoneNumber: cliente.phoneNumber,
      email: cliente.email,
      birthPlace: cliente.birthPlace,
      birthDate: cliente.birthDate.split('T')[0], // Convertir a formato YYYY-MM-DD
      document1: null,
      document2: null,
      document3: null,
      document4: null,
    });
    modal.openModal();
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('fiscalCode', formData.fiscalCode);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('birthPlace', formData.birthPlace);
      formDataToSend.append('birthDate', formData.birthDate);
      
      // Agregar archivos si se seleccionaron nuevos
      if (formData.document1) formDataToSend.append('document1', formData.document1);
      if (formData.document2) formDataToSend.append('document2', formData.document2);
      if (formData.document3) formDataToSend.append('document3', formData.document3);
      if (formData.document4) formDataToSend.append('document4', formData.document4);

      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Cliente aggiornato con successo!'
        });
        setEditingClient(null);
        setFormData({
          firstName: "",
          lastName: "",
          fiscalCode: "",
          address: "",
          phoneNumber: "",
          email: "",
          birthPlace: "Italia",
          birthDate: "",
          document1: null,
          document2: null,
          document3: null,
          document4: null,
        });
        modal.closeModal();
        fetchClienti(); // Recargar la lista
      } else {
        setMessage({ 
          type: 'error', 
          text: `${data.error || 'Errore durante l\'aggiornamento del cliente'}${data.details ? ': ' + data.details : ''}` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Errore di connessione: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (clienteId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata.')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clienteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Cliente eliminato con successo!'
        });
        fetchClienti(); // Recargar la lista
      } else {
        setMessage({ 
          type: 'error', 
          text: `${data.error || 'Errore durante l\'eliminazione del cliente'}${data.details ? ': ' + data.details : ''}` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Errore di connessione: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    }
  };

  const handleExportToExcel = () => {
    try {
      // Preparar los datos para exportar
      const exportData = clienti.map(cliente => ({
        'Nome': cliente.firstName,
        'Cognome': cliente.lastName,
        'Codice Fiscale': cliente.fiscalCode,
        'Indirizzo': cliente.address,
        'Telefono': cliente.phoneNumber,
        'E-mail': cliente.email,
        'Nato a': cliente.birthPlace,
        'Data di nascita': cliente.birthDate ? new Date(cliente.birthDate).toLocaleDateString('it-IT') : '',
        'Registrato da': cliente.creator ? `${cliente.creator.firstName} ${cliente.creator.lastName}` : '',
        'Data registrazione': cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('it-IT') : '',
        'Stato': cliente.isActive ? 'Attivo' : 'Inattivo'
      }));

      // Crear el workbook y worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clienti');

      // Ajustar el ancho de las columnas
      const columnWidths = [
        { wch: 15 }, // Nome
        { wch: 20 }, // Cognome
        { wch: 18 }, // Codice Fiscale
        { wch: 30 }, // Indirizzo
        { wch: 15 }, // Telefono
        { wch: 25 }, // E-mail
        { wch: 15 }, // Nato a
        { wch: 15 }, // Data di nascita
        { wch: 20 }, // Registrato da
        { wch: 18 }, // Data registrazione
        { wch: 10 }  // Stato
      ];
      worksheet['!cols'] = columnWidths;

      // Generar el archivo
      const fileName = `clienti_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setMessage({
        type: 'success',
        text: `File Excel esportato con successo: ${fileName} (${clienti.length} clienti)`
      });
    } catch (error) {
      console.error('❌ Export error:', error);
      setMessage({
        type: 'error',
        text: 'Errore durante l\'esportazione del file Excel'
      });
    }
  };

  const handleImportClientes = async () => {
    if (!canAccessGestione) {
      setMessage({
        type: 'error',
        text: 'Solo gli amministratori possono importare clienti'
      });
      return;
    }

    if (!confirm('Sei sicuro di voler importare i clienti da dataClientes.xlsx? Questa operazione potrebbe richiedere alcuni minuti.')) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/import-clientes', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante l\'importazione');
      }

      setMessage({
        type: 'success',
        text: `Importazione completata: ${data.resultados.creados} clienti creati, ${data.resultados.omitidos} omessi, ${data.resultados.errores} errori`
      });

      // Recargar los clientes
      fetchClienti();

    } catch (error) {
      console.error('❌ Import error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Errore durante l\'importazione dei clienti'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminarDuplicados = async () => {
    if (!canAccessGestione) {
      setMessage({
        type: 'error',
        text: 'Solo gli amministratori possono eliminare duplicati'
      });
      return;
    }

    if (!confirm('⚠️ ATTENZIONE: Questa operazione eliminerà i clienti duplicati mantenendo solo il più antico.\n\nSei sicuro di voler procedere?')) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/eliminar-duplicados', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la pulizia dei duplicati');
      }

      setMessage({
        type: 'success',
        text: `✅ Pulizia completata: ${data.resultados.eliminados} duplicati eliminati, ${data.resultados.restantes} clienti rimanenti`
      });

      // Recargar los clientes
      fetchClienti();

    } catch (error) {
      console.error('❌ Cleanup error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Errore durante la pulizia dei duplicati'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, documentNumber: 1 | 2 | 3 | 4) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [`document${documentNumber}`]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {

      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('fiscalCode', formData.fiscalCode);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('birthPlace', formData.birthPlace);
      formDataToSend.append('birthDate', formData.birthDate);
      
      // Agregar archivos
      if (formData.document1) formDataToSend.append('document1', formData.document1);
      if (formData.document2) formDataToSend.append('document2', formData.document2);
      if (formData.document3) formDataToSend.append('document3', formData.document3);
      if (formData.document4) formDataToSend.append('document4', formData.document4);

      const response = await fetch('/api/clients', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Cliente creato con successo!'
        });
        setFormData({
          firstName: "",
          lastName: "",
          fiscalCode: "",
          address: "",
          phoneNumber: "",
          email: "",
          birthPlace: "Italia",
          birthDate: "",
          document1: null,
          document2: null,
          document3: null,
          document4: null,
        });
        modal.closeModal();
        fetchClienti(); // Recargar la lista
      } else {
        setMessage({ 
          type: 'error', 
          text: `${data.error || 'Errore durante la creazione del cliente'}${data.details ? ': ' + data.details : ''}` 
        });
      }
      
    } catch {
      setMessage({ type: 'error', text: 'Errore durante la creazione del cliente' });
    } finally {
      setSubmitting(false);
    }
  };


  // Filtrar clientes basado en el término de búsqueda
  const filteredClienti = clienti.filter((cliente) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.firstName.toLowerCase().includes(searchLower) ||
      cliente.lastName.toLowerCase().includes(searchLower) ||
      cliente.fiscalCode.toLowerCase().includes(searchLower) ||
      cliente.email.toLowerCase().includes(searchLower) ||
      cliente.phoneNumber.toLowerCase().includes(searchLower) ||
      cliente.address.toLowerCase().includes(searchLower) ||
      cliente.birthPlace.toLowerCase().includes(searchLower) ||
      (cliente.creator?.firstName && cliente.creator.firstName.toLowerCase().includes(searchLower)) ||
      (cliente.creator?.lastName && cliente.creator.lastName.toLowerCase().includes(searchLower))
    );
  });

  // Lógica de paginación
  const totalItems = filteredClienti.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentData = filteredClienti.slice(startIndex, endIndex);

  // Resetear página cuando cambie el filtro o items por página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Manejar copia de texto completo para celdas truncadas
  useEffect(() => {
    const handleCopy = (event: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const selectedElement = range.commonAncestorContainer.parentElement;
      
      // Buscar si el elemento seleccionado tiene un data-full-value
      if (selectedElement && selectedElement.hasAttribute('data-full-value')) {
        const fullValue = selectedElement.getAttribute('data-full-value');
        if (fullValue) {
          event.preventDefault();
          event.clipboardData?.setData('text/plain', fullValue);
        }
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, []);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }
  
  // Carga progresiva: Mostrar skeleton de tabla mientras cargan los datos
  if (loading && clienti.length === 0) {
    return (
      <div>
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        
        {/* Tabla skeleton */}
        <div className="bg-white dark:bg-white/[0.03] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Header de tabla */}
          <div className="bg-gray-50 dark:bg-gray-800/50 grid grid-cols-8 gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
          {/* Filas skeleton */}
          {Array.from({ length: 10 }).map((_, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-8 gap-4 px-4 py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              {Array.from({ length: 8 }).map((_, colIdx) => (
                <div key={colIdx} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ animationDelay: `${rowIdx * 50}ms` }}></div>
              ))}
            </div>
          ))}
          {/* Paginación skeleton */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessGestione) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Accesso Negato
          </h1>
          <p className="text-gray-600">
            Solo gli amministratori possono accedere a questa sezione.
          </p>
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
          <p>{message.text}</p>
        </div>
      )}


      {/* Modal de registro */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.closeModal}
        className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {editingClient ? 'Modifica Cliente' : 'Registra Nuovo Cliente'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {editingClient ? 'Modifica i dati del cliente' : 'Compila i dati per registrare un nuovo cliente nel sistema'}
            </p>
          </div>

          <form onSubmit={editingClient ? handleUpdateClient : handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cognome *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fiscalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Codice Fiscale *
              </label>
              <input
                type="text"
                id="fiscalCode"
                name="fiscalCode"
                value={formData.fiscalCode}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Indirizzo *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefono *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nato a *
                </label>
                <select
                  id="birthPlace"
                  name="birthPlace"
                  value={formData.birthPlace}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  {paesi.map((paese) => (
                    <option key={paese} value={paese}>
                      {paese}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data di nascita *
                </label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Sección de Documentos */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Documenti
              </h3>
              
              {/* Documento 1 - Opcionale */}
              <div>
                <label htmlFor="document1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documento 1 <span className="text-xs text-gray-500">(Opzionale)</span>
                </label>
                <input
                  type="file"
                  id="document1"
                  name="document1"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                />
                {editingClient?.document1 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Archivo actual: {editingClient.document1Name || 'documento.pdf'}
                  </p>
                )}
              </div>

              {/* Documento 2 - Opcional */}
              <div>
                <label htmlFor="document2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documento 2 <span className="text-xs text-gray-500">(Opzionale)</span>
                </label>
                <input
                  type="file"
                  id="document2"
                  name="document2"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 2)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                />
                {editingClient?.document2 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Archivo actual: {editingClient.document2Name || 'documento.pdf'}
                  </p>
                )}
              </div>

              {/* Documento 3 - Opcional */}
              <div>
                <label htmlFor="document3" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documento 3 <span className="text-xs text-gray-500">(Opzionale)</span>
                </label>
                <input
                  type="file"
                  id="document3"
                  name="document3"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 3)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                />
                {editingClient?.document3 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Archivo actual: {editingClient.document3Name || 'documento.pdf'}
                  </p>
                )}
              </div>

              {/* Documento 4 - Opcional */}
              <div>
                <label htmlFor="document4" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Documento 4 <span className="text-xs text-gray-500">(Opzionale)</span>
                </label>
                <input
                  type="file"
                  id="document4"
                  name="document4"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, 4)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                />
                {editingClient?.document4 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Archivo actual: {editingClient.document4Name || 'documento.pdf'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  modal.closeModal();
                  setEditingClient(null);
                  setFormData({
                    firstName: "",
                    lastName: "",
                    fiscalCode: "",
                    address: "",
                    phoneNumber: "",
                    email: "",
                    birthPlace: "Italia",
                    birthDate: "",
                    document1: null,
                    document2: null,
                    document3: null,
                    document4: null,
                  });
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting 
                  ? (editingClient ? "Aggiornamento..." : "Creazione...") 
                  : (editingClient ? "Aggiorna Cliente" : "Registra Cliente")
                }
              </button>
            </div>
          </form>
        </div>
      </Modal>


      {/* Tabla de clientes */}
      <ComponentCard title="">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl">
            {/* Header con selector y buscador */}
            <div className="flex flex-col gap-1 lg:gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between flex-wrap">
              {/* Controles izquierdos */}
              <div className="flex items-center gap-1 lg:gap-2 flex-wrap">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  Record: {clienti.length.toLocaleString()}
                </span>
                {canAccessGestione && (
                  <>
                    <button
                      onClick={handleEliminarDuplicados}
                      disabled={submitting}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Elimina clienti duplicati (mantiene il più antico)"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {submitting ? 'Pulendo...' : 'Elimina Duplicati'}
                    </button>
                    <button
                      onClick={handleImportClientes}
                      disabled={submitting}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Importa clienti da dataClientes.xlsx"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {submitting ? 'Importando...' : 'Importar'}
                    </button>
                  </>
                )}
                <button
                  onClick={handleExportToExcel}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300 rounded transition-colors duration-200"
                  title="Esporta tutti i clienti in Excel"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
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
                  <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                    <svg
                      className="stroke-current"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                        stroke=""
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Buscador y botón Nuovo */}
              <div className="flex items-center gap-1 lg:gap-2 flex-shrink-0">
                {/* Buscador mejorado */}
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cerca clienti..."
                    className="dark:bg-dark-900 h-10 w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-10 pr-4 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[250px] lg:w-[200px] md:w-[180px]"
                  />
                </div>
                
                {/* Botón Nuovo */}
                <button
                  onClick={modal.openModal}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuovo
                </button>
              </div>
            </div>

            <div className="max-w-full overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-3 py-2 font-bold text-white text-start text-xs bg-[#0366D6] w-[150px]"
                    >
                      Cliente
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-3 py-2 font-bold text-white text-start text-xs bg-[#0366D6] w-[140px]"
                    >
                      Codice Fiscale
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-3 py-2 font-bold text-white text-start text-xs bg-[#0366D6] w-[120px]"
                    >
                      Telefono
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-3 py-2 font-bold text-white text-start text-xs bg-[#0366D6] w-[200px]"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-3 py-2 font-bold text-white text-start text-xs bg-[#0366D6] w-[180px]"
                    >
                      Indirizzo
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-3 py-2 font-bold text-white text-start text-xs bg-[#0366D6] w-[100px]"
                    >
                      Nato a
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-3 py-2 font-bold text-white text-start text-xs bg-[#0366D6] w-[120px]"
                    >
                      Data Nascita
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-3 py-2 font-bold text-white text-start text-xs bg-[#0366D6] w-[140px]"
                    >
                      Agente
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-3 py-2 font-bold text-white text-start text-xs bg-[#0366D6] w-[120px] sticky right-0 z-10 shadow-lg"
                    >
                      Azioni
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'Nessun cliente trovato con i criteri di ricerca' : 'Nessun cliente registrato'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="px-3 py-2 text-start w-[150px]">
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            {cliente.firstName} {cliente.lastName}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-start w-[140px]">
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            {cliente.fiscalCode}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-start w-[120px]">
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            {cliente.phoneNumber}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-start w-[200px]">
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            {cliente.email}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-start w-[180px]">
                          <span 
                            className="text-gray-600 dark:text-gray-300 text-xs truncate"
                            title={cliente.address}
                            data-full-value={cliente.address}
                          >
                            {cliente.address.length > 25 ? `${cliente.address.substring(0, 25)}...` : cliente.address}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-start w-[100px]">
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            {cliente.birthPlace}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-start w-[120px]">
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            {new Date(cliente.birthDate).toLocaleDateString('it-IT')}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-start w-[140px]">
                          <span className="text-gray-600 dark:text-gray-300 text-xs">
                            {cliente.creator?.firstName} {cliente.creator?.lastName}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-start w-[120px] sticky right-0 z-10 bg-white dark:bg-gray-900">
                          <div className="flex items-center gap-2">
                            {/* Botón Editar */}
                            <button
                              onClick={() => handleEditClient(cliente)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title="Modifica cliente"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Botón Eliminar */}
                            <button
                              onClick={() => handleDeleteClient(cliente.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title="Elimina cliente"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
      </ComponentCard>
    </div>
  );
}
