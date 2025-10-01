"use client";

import React, { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  photo: string | null;
  role: 'USER' | 'ADMIN' | 'TI';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: 'USER' | 'ADMIN' | 'TI';
  photo?: File | null;
}

export default function CreaUtentiPage() {
  const { canManageUsers, isLoading: roleLoading } = useUserRole();
  const modal = useModal();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string; password?: string } | null>(null);
  
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "USER",
    photo: null,
  });

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/list');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Error fetching users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
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
      photo: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('role', formData.role);
      
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      const response = await fetch('/api/user/create', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: data.message || 'Utente creato con successo!',
          password: data.temporaryPassword 
        });
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          phoneNumber: "",
          role: "USER",
          photo: null,
        });
        modal.closeModal();
        fetchUsers(); // Recargar la lista de usuarios
      } else {
        setMessage({ type: 'error', text: data.error || 'Errore durante la creazione dell\'utente' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Errore durante la creazione dell\'utente' });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'TI': return 'error';
      case 'ADMIN': return 'warning';
      case 'USER': return 'success';
      default: return 'light';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Accesso Negato
          </h1>
          <p className="text-gray-600">
            Solo gli utenti TI possono accedere a questa pagina.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Gestione Utenti" />
      
      {/* Mensaje de estado */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          <div className="space-y-2">
            <p>{message.text}</p>
            {message.password && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  🔑 Password temporanea per il primo accesso:
                </p>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 rounded text-sm font-mono">
                    {message.password}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(message.password!)}
                    className="px-2 py-1 text-xs bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 rounded hover:bg-yellow-300 dark:hover:bg-yellow-600"
                  >
                    Copia
                  </button>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                  ⚠️ Condividi questa password con l&apos;utente. Dovrà cambiarla al primo accesso.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón principal centrado */}
      <div className="text-center mb-8">
        <button
          onClick={modal.openModal}
          className="px-8 py-4 text-lg font-medium text-white rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 transition-colors"
        >
          Registra Utenti
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
              Registra Nuovo Utente
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Compila i dati per creare un nuovo utente nel sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
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

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numero di Telefono
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ruolo *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="USER">Utente</option>
                <option value="ADMIN">Amministratore</option>
                <option value="TI">TI</option>
              </select>
            </div>

            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foto Profilo
              </label>
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
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
                {submitting ? "Creazione..." : "Crea Utente"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Tabla de usuarios */}
      <ComponentCard title="Utenti Registrati">
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
                      Utente
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
                      Telefono
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Ruolo
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Stato
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Data Creazione
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        Nessun utente registrato
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              {user.photo ? (
                                <Image
                                  width={40}
                                  height={40}
                                  src={user.photo}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                  {user.firstName?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                ID: {user.clerkId.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {user.email}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {user.phoneNumber || 'N/A'}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Badge
                            size="sm"
                            color={getRoleBadgeColor(user.role)}
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <Badge
                            size="sm"
                            color={getStatusBadgeColor(user.isActive)}
                          >
                            {user.isActive ? 'Attivo' : 'Inattivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString('it-IT')}
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