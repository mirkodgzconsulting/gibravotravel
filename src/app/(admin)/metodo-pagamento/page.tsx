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

interface MetodoPagamento {
  id: string;
  metodoPagamento: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MetodoPagamentoPage() {
  const { canManageUsers, isLoading: roleLoading } = useUserRole();
  const modal = useModal();
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [editingMetodoPagamento, setEditingMetodoPagamento] = useState<MetodoPagamento | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    metodoPagamento: ""
  });

  useEffect(() => {
    fetchMetodosPagamento();
  }, []);

  const fetchMetodosPagamento = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metodo-pagamento');
      if (response.ok) {
        const data = await response.json();
        setMetodosPagamento(data.metodosPagamento || []);
      }
    } catch (error) {
      console.error('Error fetching metodos pagamento:', error);
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
      if (isEditMode && editingMetodoPagamento) {
        response = await fetch(`/api/metodo-pagamento/${editingMetodoPagamento.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/metodo-pagamento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: isEditMode ? 'Metodo di pagamento actualizado exitosamente' : 'Metodo di pagamento creado exitosamente'
        });
        
        setEditingMetodoPagamento(null);
        setIsEditMode(false);
        setFormData({ metodoPagamento: "" });
        modal.closeModal();
        fetchMetodosPagamento();
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

  const handleEdit = (metodoPagamento: MetodoPagamento) => {
    setEditingMetodoPagamento(metodoPagamento);
    setIsEditMode(true);
    setFormData({ metodoPagamento: metodoPagamento.metodoPagamento });
    modal.openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este metodo di pagamento?')) {
      return;
    }

    setDeletingId(id);
    
    try {
      const response = await fetch(`/api/metodo-pagamento/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Metodo di pagamento eliminado exitosamente' });
        fetchMetodosPagamento();
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
    setEditingMetodoPagamento(null);
    setIsEditMode(false);
    modal.closeModal();
    setFormData({ metodoPagamento: "" });
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
      <PageBreadcrumb pageTitle="Metodo di Pagamento" />
      
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
          className="px-8 py-4 text-lg font-medium text-white rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 transition-colors"
        >
          Aggiungi Metodo di Pagamento
        </button>
      </div>

      <Modal isOpen={modal.isOpen} onClose={handleCancelEdit}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {isEditMode ? 'Modifica Metodo di Pagamento' : 'Nuovo Metodo di Pagamento'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Metodo di Pagamento *
              </label>
              <input
                type="text"
                value={formData.metodoPagamento}
                onChange={(e) => setFormData({ metodoPagamento: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
                placeholder="Es: Contanti, Carta, Bonifico, PayPal..."
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

      <ComponentCard title="Lista Metodi di Pagamento">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : metodosPagamento.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Nessun metodo di pagamento trovato</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Metodo di Pagamento</TableCell>
                  <TableCell>Data Creazione</TableCell>
                  <TableCell className="text-right">Azioni</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metodosPagamento.map((metodoPagamento) => (
                  <TableRow key={metodoPagamento.id}>
                    <TableCell className="font-medium">{metodoPagamento.metodoPagamento}</TableCell>
                    <TableCell>{new Date(metodoPagamento.createdAt).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(metodoPagamento)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(metodoPagamento.id)}
                          disabled={deletingId === metodoPagamento.id}
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




