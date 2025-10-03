"use client";

import React, { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
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
  documents: string | null;
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
  documents?: File | null;
}

// Lista de países para el select
const paesi = [
  "Italia", "Francia", "Germania", "Spagna", "Regno Unito", "Stati Uniti", 
  "Canada", "Australia", "Brasile", "Argentina", "Messico", "Giappone", 
  "Cina", "India", "Russia", "Altro"
];

export default function ClientiPage() {
  const { canAccessGestione, isLoading: roleLoading } = useUserRole();
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
    documents: null,
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClienti();
  }, []);

  const fetchClienti = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching clienti...');
      
      const response = await fetch('/api/clients');
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Data received:', data);
        setClienti(data.clients || []);
        
        if (data.clients && data.clients.length === 0) {
          console.log('ℹ️ No hay clientes registrados aún');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        setMessage({ 
          type: 'error', 
          text: `Errore durante il caricamento: ${errorData.error || 'Error desconocido'}` 
        });
      }
    } catch (error) {
      console.error('❌ Network error:', error);
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
      documents: null,
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
      
      if (formData.documents) {
        formDataToSend.append('documents', formData.documents);
      }

      console.log('🔍 Updating client:', editingClient.id);

      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      console.log('🔍 Update response status:', response.status);
      const data = await response.json();
      console.log('🔍 Update response data:', data);

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
          documents: null,
        });
        modal.closeModal();
        fetchClienti(); // Recargar la lista
      } else {
        console.error('❌ Update error:', data);
        setMessage({ 
          type: 'error', 
          text: `${data.error || 'Errore durante l\'aggiornamento del cliente'}${data.details ? ': ' + data.details : ''}` 
        });
      }
    } catch (error) {
      console.error('❌ Network error:', error);
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
      console.log('🔍 Deleting client:', clienteId);

      const response = await fetch(`/api/clients/${clienteId}`, {
        method: 'DELETE',
      });

      console.log('🔍 Delete response status:', response.status);
      const data = await response.json();
      console.log('🔍 Delete response data:', data);

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Cliente eliminato con successo!'
        });
        fetchClienti(); // Recargar la lista
      } else {
        console.error('❌ Delete error:', data);
        setMessage({ 
          type: 'error', 
          text: `${data.error || 'Errore durante l\'eliminazione del cliente'}${data.details ? ': ' + data.details : ''}` 
        });
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setMessage({ 
        type: 'error', 
        text: `Errore di connessione: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      documents: file
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
      
      if (formData.documents) {
        formDataToSend.append('documents', formData.documents);
      }

      console.log('🔍 Submitting client data...');
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        body: formDataToSend,
      });

      console.log('🔍 Submit response status:', response.status);
      console.log('🔍 Submit response ok:', response.ok);

      const data = await response.json();
      console.log('🔍 Submit response data:', data);

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
          documents: null,
        });
        modal.closeModal();
        fetchClienti(); // Recargar la lista
      } else {
        console.error('❌ Submit error:', data);
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

      {/* Botón principal centrado */}
      <div className="text-center mb-8">
        <button
          onClick={modal.openModal}
          className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg mx-auto"
          title="Aggiungi Cliente"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Modal de registro */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.closeModal}
        className="max-w-2xl p-6"
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

            <div>
              <label htmlFor="documents" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Documenti
              </label>
              <input
                type="file"
                id="documents"
                name="documents"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
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
                    documents: null,
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
            <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  Clientes: {clienti.length.toLocaleString()}
                </span>
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
                <span className="text-gray-500 dark:text-gray-400">registri</span>
              </div>

              <div className="relative">
                <button className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                      fill=""
                    />
                  </svg>
                </button>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca clienti..."
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
                />
              </div>
            </div>

            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Cliente
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Codice Fiscale
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Telefono
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Indirizzo
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Nato a
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Data Nascita
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Registrato da
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
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
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                {cliente.firstName[0]?.toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {cliente.firstName} {cliente.lastName}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {cliente.fiscalCode}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {cliente.phoneNumber}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {cliente.email}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {cliente.address}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {cliente.birthPlace}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {new Date(cliente.birthDate).toLocaleDateString('it-IT')}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {cliente.creator?.firstName} {cliente.creator?.lastName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
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
