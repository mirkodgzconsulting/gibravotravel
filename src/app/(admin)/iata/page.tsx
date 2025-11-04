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
import { EditIcon, TrashIcon } from "lucide-react";

interface Iata {
  id: string;
  iata: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function IataPage() {
  const { canManageUsers, isLoading: roleLoading } = useUserRole();
  const modal = useModal();
  const [iatas, setIatas] = useState<Iata[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [editingIata, setEditingIata] = useState<Iata | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingIatas, setAddingIatas] = useState(false);
  
  const [formData, setFormData] = useState({
    iata: ""
  });

  useEffect(() => {
    fetchIatas();
  }, []);

  const fetchIatas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/iata');
      if (response.ok) {
        const data = await response.json();
        // El endpoint devuelve directamente el array, no dentro de un objeto
        setIatas(Array.isArray(data) ? data : (data.iatas || []));
      }
    } catch (error) {
      console.error('Error fetching iatas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      let response;
      if (isEditMode && editingIata) {
        response = await fetch(`/api/iata/${editingIata.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/iata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: isEditMode ? 'IATA actualizado exitosamente' : 'IATA creado exitosamente'
        });
        
        setEditingIata(null);
        setIsEditMode(false);
        setFormData({ iata: "" });
        modal.closeModal();
        fetchIatas();
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Error al procesar la solicitud'
        });
      }
    } catch {
      setMessage({ 
        type: 'error', 
        text: 'Error al procesar la solicitud'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (iata: Iata) => {
    setEditingIata(iata);
    setIsEditMode(true);
    setFormData({ iata: iata.iata });
    modal.openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este IATA?')) {
      return;
    }

    setDeletingId(id);
    
    try {
      const response = await fetch(`/api/iata/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'IATA eliminado exitosamente' });
        fetchIatas();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error al eliminar'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIata(null);
    setIsEditMode(false);
    modal.closeModal();
    setFormData({ iata: "" });
  };

  const handleAgregarIatas = async () => {
    if (!confirm('¿Estás seguro de que quieres agregar los IATAs predefinidos?\n\nEsto agregará: Shop online, Safer, Dhl, Tbo, Jump Travel, GetYourGuide, Civitatis, Dinamico kkm, Booking hotel')) {
      return;
    }

    setAddingIatas(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/agregar-iatas', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `✅ ${data.agregados} IATAs agregados, ${data.yaExistentes} ya existían. Total: ${data.totalIatas} IATAs activos`
        });
        fetchIatas();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Error al agregar IATAs'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error al procesar la solicitud'
      });
    } finally {
      setAddingIatas(false);
    }
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
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accesso Negato</h1>
          <p className="text-gray-600">Solo gli utenti TI possono accedere a questa pagina.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="IATA" />
      
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      {/* Botones principales centrados */}
      <div className="text-center mb-8 flex gap-4 justify-center">
        <button
          onClick={modal.openModal}
          className="px-8 py-4 text-lg font-medium text-white rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 transition-colors"
        >
          Aggiungi IATA
        </button>
        <button
          onClick={handleAgregarIatas}
          disabled={addingIatas}
          className="px-8 py-4 text-lg font-medium text-white rounded-lg bg-purple-500 shadow-theme-xs hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addingIatas ? 'Agregando...' : 'Agregar IATAs Predefinidos'}
        </button>
      </div>

      <Modal isOpen={modal.isOpen} onClose={handleCancelEdit}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {isEditMode ? 'Modifica IATA' : 'Nuovo IATA'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                IATA *
              </label>
              <input
                type="text"
                value={formData.iata}
                onChange={(e) => setFormData({ iata: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
                placeholder="Es: FCO, MXP, CIA..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Salvando...' : (isEditMode ? 'Aggiorna' : 'Crea')}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ComponentCard title="Lista IATA">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : iatas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Nessun IATA trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>IATA</TableCell>
                  <TableCell>Data Creazione</TableCell>
                  <TableCell className="text-right">Azioni</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {iatas.map((iata) => (
                  <TableRow key={iata.id}>
                    <TableCell className="font-medium">{iata.iata}</TableCell>
                    <TableCell>{new Date(iata.createdAt).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(iata)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(iata.id)}
                          disabled={deletingId === iata.id}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Elimina"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}




