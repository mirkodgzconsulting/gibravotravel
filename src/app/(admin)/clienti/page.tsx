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
  nome: string;
  cognome: string;
  codiceFiscale: string;
  indirizzo: string;
  telefono: string;
  email: string;
  natoA: string;
  dataNascita: string;
  documenti: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClienteFormData {
  nome: string;
  cognome: string;
  codiceFiscale: string;
  indirizzo: string;
  telefono: string;
  email: string;
  natoA: string;
  dataNascita: string;
  documenti?: File | null;
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
  
  const [formData, setFormData] = useState<ClienteFormData>({
    nome: "",
    cognome: "",
    codiceFiscale: "",
    indirizzo: "",
    telefono: "",
    email: "",
    natoA: "Italia",
    dataNascita: "",
    documenti: null,
  });

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClienti();
  }, []);

  const fetchClienti = async () => {
    try {
      setLoading(true);
      // TODO: Implementar API endpoint para clientes
      // const response = await fetch('/api/clienti/list');
      // if (response.ok) {
      //   const data = await response.json();
      //   setClienti(data.clienti || []);
      // }
      
      // Datos de ejemplo por ahora
      setClienti([
        {
          id: "1",
          nome: "Mario",
          cognome: "Rossi",
          codiceFiscale: "RSSMRA80A01H501U",
          indirizzo: "Via Roma 123, Milano",
          telefono: "+39 123 456 7890",
          email: "mario.rossi@email.com",
          natoA: "Milano",
          dataNascita: "1980-01-01",
          documenti: null,
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T10:30:00Z"
        },
        {
          id: "2",
          nome: "Giulia",
          cognome: "Bianchi",
          codiceFiscale: "BNCGLI85B02F205X",
          indirizzo: "Corso Italia 456, Roma",
          telefono: "+39 987 654 3210",
          email: "giulia.bianchi@email.com",
          natoA: "Roma",
          dataNascita: "1985-02-15",
          documenti: null,
          createdAt: "2024-01-20T14:15:00Z",
          updatedAt: "2024-01-20T14:15:00Z"
        }
      ]);
    } catch {
      console.error('Error fetching clienti');
    } finally {
      setLoading(false);
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
      documenti: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nome', formData.nome);
      formDataToSend.append('cognome', formData.cognome);
      formDataToSend.append('codiceFiscale', formData.codiceFiscale);
      formDataToSend.append('indirizzo', formData.indirizzo);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('natoA', formData.natoA);
      formDataToSend.append('dataNascita', formData.dataNascita);
      
      if (formData.documenti) {
        formDataToSend.append('documenti', formData.documenti);
      }

      // TODO: Implementar API endpoint para crear cliente
      // const response = await fetch('/api/clienti/create', {
      //   method: 'POST',
      //   body: formDataToSend,
      // });

      // const data = await response.json();

      // if (response.ok) {
      //   setMessage({ 
      //     type: 'success', 
      //     text: data.message || 'Cliente creato con successo!'
      //   });
      //   setFormData({
      //     nome: "",
      //     cognome: "",
      //     codiceFiscale: "",
      //     indirizzo: "",
      //     telefono: "",
      //     email: "",
      //     natoA: "Italia",
      //     dataNascita: "",
      //     documenti: null,
      //   });
      //   modal.closeModal();
      //   fetchClienti();
      // } else {
      //   setMessage({ type: 'error', text: data.error || 'Errore durante la creazione del cliente' });
      // }

      // Simulación por ahora
      console.log('Datos del cliente:', Object.fromEntries(formDataToSend));
      setMessage({ type: 'success', text: 'Cliente creato con successo!' });
      modal.closeModal();
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Errore durante la creazione del cliente' });
    } finally {
      setSubmitting(false);
    }
  };


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
      <PageBreadcrumb pageTitle="Gestione Clienti" />
      
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
              Registra Nuovo Cliente
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Compila i dati per registrare un nuovo cliente nel sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cognome *
                </label>
                <input
                  type="text"
                  id="cognome"
                  name="cognome"
                  value={formData.cognome}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="codiceFiscale" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Codice Fiscale *
              </label>
              <input
                type="text"
                id="codiceFiscale"
                name="codiceFiscale"
                value={formData.codiceFiscale}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Indirizzo *
              </label>
              <input
                type="text"
                id="indirizzo"
                name="indirizzo"
                value={formData.indirizzo}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefono *
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
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
                <label htmlFor="natoA" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nato a *
                </label>
                <select
                  id="natoA"
                  name="natoA"
                  value={formData.natoA}
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
                <label htmlFor="dataNascita" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data di nascita *
                </label>
                <input
                  type="date"
                  id="dataNascita"
                  name="dataNascita"
                  value={formData.dataNascita}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="documenti" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Documenti
              </label>
              <input
                type="file"
                id="documenti"
                name="documenti"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={modal.closeModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creazione..." : "Registra Cliente"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Tabla de clientes */}
      <ComponentCard title="Clienti Registrati">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
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
                      Contatto
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
                      Azioni
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {clienti.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        Nessun cliente registrato
                      </TableCell>
                    </TableRow>
                  ) : (
                    clienti.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                {cliente.nome[0]?.toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {cliente.nome} {cliente.cognome}
                              </span>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                ID: {cliente.id}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {cliente.codiceFiscale}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <div>
                            <div>{cliente.email}</div>
                            <div className="text-xs text-gray-400">{cliente.telefono}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {cliente.indirizzo}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {cliente.natoA}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {new Date(cliente.dataNascita).toLocaleDateString('it-IT')}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center gap-2">
                            {/* Botón Editar */}
                            <button
                              onClick={() => console.log('Editar cliente:', cliente.id)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title="Editar cliente"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            
                            {/* Botón Eliminar */}
                            <button
                              onClick={() => console.log('Eliminar cliente:', cliente.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                              title="Eliminar cliente"
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
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
