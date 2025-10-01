"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { DatePicker } from "@/components/ui/date-picker/DatePicker";
import { CopyNotification } from "@/components/ui/notification/CopyNotification";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

interface TravelNoteTemplate {
  id: string;
  title: string;
  textContent: string;
  coverImage: string | null;
  pdfFile: string | null;
  tourDate: string;
  travelCost: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface TemplateFormData {
  title: string;
  textContent: string;
  coverImage: File | null;
  pdfFile: File | null;
  tourDate: string;
  travelCost: string;
}

export default function PartenzeNotePage() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { user } = useUser();
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();
  const [templates, setTemplates] = useState<TravelNoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    title: "",
    textContent: "",
    coverImage: null,
    pdfFile: null,
    tourDate: "",
    travelCost: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/travel-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        setError('Error al cargar plantillas');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('textContent', formData.textContent);
      formDataToSend.append('tourDate', formData.tourDate);
      formDataToSend.append('travelCost', formData.travelCost);
      
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }
      if (formData.pdfFile) {
        formDataToSend.append('pdfFile', formData.pdfFile);
      }

      const response = await fetch('/api/travel-templates', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        closeModal();
        setFormData({
          title: "",
          textContent: "",
          coverImage: null,
          pdfFile: null,
          tourDate: "",
          travelCost: "",
        });
        fetchTemplates();
      } else {
        setError('Error al crear plantilla');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyContent = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopyNotification(true);
    } catch {
      setError('Error al copiar al portapapeles');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres enviar esta plantilla a la papelera?')) {
      return;
    }

    try {
      const response = await fetch(`/api/travel-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        setError('Error al eliminar plantilla');
      }
    } catch {
      setError('Error de conexión');
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedTemplate(expandedTemplate === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!userRole || !['ADMIN', 'TI'].includes(userRole)) {
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
      <PageBreadcrumb pageTitle="Partenze / Note" />
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          <p>{error}</p>
          <Button 
            onClick={() => setError(null)}
            size="sm"
            variant="outline"
            className="mt-2"
          >
            Chiudi
          </Button>
        </div>
      )}

      {/* Botón principal para agregar plantilla */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={openModal}
          variant="primary"
          size="md"
          startIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Agregar Plantilla
        </Button>
      </div>

      {/* Modal para agregar plantilla */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className="max-w-lg mx-4"
      >
        <div className="p-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Agregar Nueva Plantilla
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título del Tour *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plantilla de Texto *
            </label>
            <textarea
              name="textContent"
              value={formData.textContent}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Imagen de Portada
            </label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.files?.[0] || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Archivo PDF/Documento
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFormData(prev => ({ ...prev, pdfFile: e.target.files?.[0] || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Fecha del Tour"
              name="tourDate"
              value={formData.tourDate}
              onChange={(value) => setFormData(prev => ({ ...prev, tourDate: value }))}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Costo del Viaje
              </label>
              <input
                type="number"
                name="travelCost"
                value={formData.travelCost}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}
            </button>
          </div>
          </form>
        </div>
      </Modal>

      {/* Grid de plantillas */}
      <ComponentCard title="Plantillas de Notas de Viaje">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No hay plantillas registradas</p>
            <p className="text-sm mt-2">Haz clic en &quot;Agregar Plantilla&quot; para crear la primera</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Imagen de portada */}
                <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                  {template.coverImage ? (
                    <Image
                      src={template.coverImage}
                      alt={template.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-4">
                  {/* Título */}
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                    {template.title}
                  </h3>

                  {/* Fecha y costo */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(template.tourDate)}
                    </span>
                    <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                      {formatCurrency(template.travelCost)}
                    </span>
                  </div>

                  {/* Archivos */}
                  <div className="space-y-2 mb-3">
                    {template.pdfFile && (
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">PDF: </span>
                        <a
                          href={template.pdfFile}
                          download
                          className="text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          {template.pdfFile.split('/').pop()}
                        </a>
                      </div>
                    )}
                    
                    {template.coverImage && (
                      <div className="text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Imagen: </span>
                        <a
                          href={template.coverImage}
                          download
                          className="text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          {template.coverImage.split('/').pop()}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex justify-center space-x-4 mb-3">
                    <button
                      onClick={() => handleCopyContent(template.textContent)}
                      className="p-3 bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                      title="Copiar contenido"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    
                    <button
                      className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                      title="Editar plantilla"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-3 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                      title="Enviar a papelera"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Texto de la plantilla */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {expandedTemplate === template.id ? (
                        <div>
                          <p className="whitespace-pre-wrap">{template.textContent}</p>
                          <button
                            onClick={() => toggleExpanded(template.id)}
                            className="text-brand-600 dark:text-brand-400 hover:underline mt-2"
                          >
                            Leer menos
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="line-clamp-3">
                            {template.textContent.length > 150 
                              ? `${template.textContent.substring(0, 150)}...`
                              : template.textContent
                            }
                          </p>
                          {template.textContent.length > 150 && (
                            <button
                              onClick={() => toggleExpanded(template.id)}
                              className="text-brand-600 dark:text-brand-400 hover:underline mt-2"
                            >
                              Leer más
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información del creador */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Creado por: {template.creator.firstName} {template.creator.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(template.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ComponentCard>

      {/* Notificación de copiado */}
      <CopyNotification
        show={showCopyNotification}
        onHide={() => setShowCopyNotification(false)}
      />
    </div>
  );
}
