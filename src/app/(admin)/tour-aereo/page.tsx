"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { useSearch } from "@/context/SearchContext";
import { Modal } from "@/components/ui/modal";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { CopyNotification } from "@/components/ui/notification/CopyNotification";
import { PlaneIcon, CalendarIcon, TargetIcon, DollarSignIcon, TrashIcon, EditIcon, EyeIcon } from "lucide-react";
import Image from "next/image";

interface TourAereo {
  id: string;
  titulo: string;
  precioAdulto: number;
  precioNino: number;
  fechaViaje: string | null;
  fechaFin: string | null;
  meta: number;
  acc: string | null;
  guidaLocale: number | null;
  coordinatore: number | null;
  hotel: number | null;
  transfer: number | null;
  transporte: number | null;
  notas: string | null;
  notasCoordinador: string | null;
  coverImage: string | null;
  coverImageName: string | null;
  pdfFile: string | null;
  pdfFileName: string | null;
  descripcion: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  _count?: {
    ventas: number;
  };
}

interface TourFormData {
  titulo: string;
  precioAdulto: string;
  precioNino: string;
  fechaViaje: string;
  fechaFin: string;
  meta: string;
  acc: string;
  guidaLocale: string;
  coordinatore: string;
  transporte: string;
  notas: string;
  notasCoordinador: string;
  coverImage: File | null;
  pdfFile: File | null;
  descripcion: string;
}

export default function TourAereoPage() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();
  const { searchTerm, searchResults } = useSearch();
  const [tours, setTours] = useState<TourAereo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [formData, setFormData] = useState<TourFormData>({
    titulo: "",
    precioAdulto: "",
    precioNino: "",
    fechaViaje: "",
    fechaFin: "",
    meta: "",
    acc: "",
    guidaLocale: "",
    coordinatore: "",
    transporte: "",
    notas: "",
    notasCoordinador: "",
    coverImage: null,
    pdfFile: null,
    descripcion: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTour, setEditingTour] = useState<TourAereo | null>(null);

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Todos los usuarios ven todos los tours para poder realizar ventas
      const response = await fetch('/api/tour-aereo');
      if (response.ok) {
        const data = await response.json();
        setTours(data.tours || []);
      } else {
        setError('Error al cargar los tours aéreos');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    if (!roleLoading) {
      fetchTours();
    }
  }, [roleLoading, fetchTours]);

  const filteredTours: TourAereo[] = searchTerm && searchResults.length > 0 ? searchResults as TourAereo[] : tours;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('precioAdulto', formData.precioAdulto);
      formDataToSend.append('precioNino', formData.precioNino);
      formDataToSend.append('fechaViaje', formData.fechaViaje);
      formDataToSend.append('fechaFin', formData.fechaFin);
      formDataToSend.append('meta', formData.meta);
      formDataToSend.append('acc', formData.acc);
      formDataToSend.append('guidaLocale', formData.guidaLocale);
      formDataToSend.append('coordinatore', formData.coordinatore);
      formDataToSend.append('transporte', formData.transporte);
      formDataToSend.append('notas', formData.notas);
      formDataToSend.append('notasCoordinador', formData.notasCoordinador);
      formDataToSend.append('descripcion', formData.descripcion);
      
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }
      if (formData.pdfFile) {
        formDataToSend.append('pdfFile', formData.pdfFile);
      }

      const response = await fetch('/api/tour-aereo', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setTours(prev => [data.tour, ...prev]);
        setFormData({
          titulo: "",
          precioAdulto: "",
          precioNino: "",
          fechaViaje: "",
          fechaFin: "",
          meta: "",
          acc: "",
          guidaLocale: "",
          coordinatore: "",
          transporte: "",
          notas: "",
          notasCoordinador: "",
          coverImage: null,
          pdfFile: null,
          descripcion: "",
        });
        closeModal();
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear tour');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTour = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTour || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('precioAdulto', formData.precioAdulto);
      formDataToSend.append('precioNino', formData.precioNino);
      formDataToSend.append('fechaViaje', formData.fechaViaje);
      formDataToSend.append('fechaFin', formData.fechaFin);
      formDataToSend.append('meta', formData.meta);
      formDataToSend.append('acc', formData.acc);
      formDataToSend.append('guidaLocale', formData.guidaLocale);
      formDataToSend.append('coordinatore', formData.coordinatore);
      formDataToSend.append('transporte', formData.transporte);
      formDataToSend.append('notas', formData.notas);
      formDataToSend.append('notasCoordinador', formData.notasCoordinador);
      formDataToSend.append('descripcion', formData.descripcion);
      
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }
      if (formData.pdfFile) {
        formDataToSend.append('pdfFile', formData.pdfFile);
      }

      const response = await fetch(`/api/tour-aereo/${editingTour.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setTours(prev => prev.map(tour => 
          tour.id === editingTour.id ? data.tour : tour
        ));
        setFormData({
          titulo: "",
          precioAdulto: "",
          precioNino: "",
          fechaViaje: "",
          fechaFin: "",
          meta: "",
          acc: "",
          guidaLocale: "",
          coordinatore: "",
          transporte: "",
          notas: "",
          notasCoordinador: "",
          coverImage: null,
          pdfFile: null,
          descripcion: "",
        });
        setEditingTour(null);
        closeModal();
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar tour');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTour = (tour: TourAereo) => {
    setEditingTour(tour);
    setFormData({
      titulo: tour.titulo,
      precioAdulto: tour.precioAdulto.toString(),
      precioNino: tour.precioNino.toString(),
      fechaViaje: tour.fechaViaje ? new Date(tour.fechaViaje).toISOString().split('T')[0] : "",
      fechaFin: tour.fechaFin ? new Date(tour.fechaFin).toISOString().split('T')[0] : "",
      meta: tour.meta.toString(),
      acc: tour.acc || "",
      guidaLocale: tour.guidaLocale?.toString() || "",
      coordinatore: tour.coordinatore?.toString() || "",
      transporte: tour.transporte?.toString() || "",
      notas: tour.notas || "",
      notasCoordinador: tour.notasCoordinador || "",
      coverImage: null,
      pdfFile: null,
      descripcion: tour.descripcion || "",
    });
    openModal();
  };

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tour aéreo?')) return;

    try {
      const response = await fetch(`/api/tour-aereo/${tourId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTours(prev => prev.filter(tour => tour.id !== tourId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar tour');
      }
    } catch (error) {
      setError('Error de conexión');
    }
  };


  const handleCancelEdit = () => {
    setEditingTour(null);
    setFormData({
      titulo: "",
      precioAdulto: "",
      precioNino: "",
      fechaViaje: "",
      fechaFin: "",
      meta: "",
      acc: "",
      guidaLocale: "",
      coordinatore: "",
      transporte: "",
      notas: "",
      notasCoordinador: "",
      coverImage: null,
      pdfFile: null,
      descripcion: "",
    });
    closeModal();
  };


  // Calcular porcentaje de progreso basado en ventas reales vs meta
  const getProgressPercentage = (tour: TourAereo) => {
    const ventas = tour._count?.ventas || 0;
    const meta = tour.meta || 0;
    if (meta === 0) return 0;
    return Math.round((ventas / meta) * 100);
  };

  if (roleLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Carga progresiva: Mostrar skeleton mientras cargan los datos
  if (loading && tours.length === 0) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Tours Aereo" />
        <ComponentCard title="">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                {/* Imagen skeleton */}
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                {/* Título skeleton */}
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                {/* Info skeleton */}
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                {/* Botones skeleton */}
                <div className="flex gap-2 mt-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                </div>
              </div>
            ))}
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Tours Aereo" />
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 text-sm border border-red-300 rounded hover:bg-red-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Botones principales */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={openModal}
          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
          title="Crear Tour Aéreo"
        >
          <PlaneIcon className="w-4 h-4" />
        </button>
      </div>

      <ComponentCard title="">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map((tour) => {
              const progressPercentage = getProgressPercentage(tour);
              const vendidos = tour._count?.ventas || 0;
              const disponibles = tour.meta - vendidos;
              const ingresos = 0; // Se calculará con datos reales de las ventas
              
              return (
                <div
                  key={tour.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Imagen de portada */}
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                    {tour.coverImage ? (
                      <Image
                        src={tour.coverImage}
                        alt={tour.titulo}
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
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {tour.titulo}
                    </h3>
                    
                    {/* Barra de progreso de ventas */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Ventas: {vendidos}/{tour.meta}</span>
                        <span>({progressPercentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Precios */}
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Adulto:</span> €{tour.precioAdulto}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Niño:</span> €{tour.precioNino}
                      </div>
                    </div>

                    {/* Capacidad/Meta */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span className="font-medium">Meta:</span> {tour.meta} inscripciones
                    </div>

                    {/* Fecha de viaje */}
                    {tour.fechaViaje && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span className="font-medium">Fecha:</span> {new Date(tour.fechaViaje).toLocaleDateString('it-IT')}
                      </div>
                    )}

                    {/* Resumen de ventas */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold text-green-700 dark:text-green-400">{vendidos}</div>
                        <div className="text-xs text-green-600 dark:text-green-400">Inscritos</div>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{disponibles}</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">Disponibles</div>
                      </div>
                    </div>

                    {/* Ingresos */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span className="font-medium">Ingresos:</span> €{ingresos.toFixed(2)}
                    </div>

                    {/* Acciones y creador */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Creado por: {tour.creator.firstName} {tour.creator.lastName}
                      </span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/venta-tour-aereo/${tour.id}`}
                          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Ver ventas"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTour(tour)}
                          className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTour(tour.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredTours.length === 0 && !loading && (
          <div className="text-center py-12">
            <PlaneIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay tours aéreos disponibles
            </p>
          </div>
        )}
      </ComponentCard>

      {/* Modal de formulario */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelEdit}
        className="max-w-4xl mx-4 max-h-[90vh]"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header fijo */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingTour ? "Editar Tour Aéreo" : "Crear Nuevo Tour Aéreo"}
            </h2>
          </div>
          
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4">
            <form onSubmit={editingTour ? handleUpdateTour : handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título del Tour *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Viaje
                </label>
                <input
                  type="date"
                  value={formData.fechaViaje}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaViaje: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio Adulto (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precioAdulto}
                  onChange={(e) => setFormData(prev => ({ ...prev, precioAdulto: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio Niño (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precioNino}
                  onChange={(e) => setFormData(prev => ({ ...prev, precioNino: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meta (Número)
                </label>
                <input
                  type="number"
                  value={formData.meta}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ACC
                </label>
                <input
                  type="text"
                  value={formData.acc}
                  onChange={(e) => setFormData(prev => ({ ...prev, acc: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Guida Locale
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.guidaLocale}
                  onChange={(e) => setFormData(prev => ({ ...prev, guidaLocale: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coordinatore
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.coordinatore}
                  onChange={(e) => setFormData(prev => ({ ...prev, coordinatore: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transporte
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.transporte}
                  onChange={(e) => setFormData(prev => ({ ...prev, transporte: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas del Tour
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas Coordinador
              </label>
              <textarea
                value={formData.notasCoordinador}
                onChange={(e) => setFormData(prev => ({ ...prev, notasCoordinador: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Imagen de Portada
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.files?.[0] || null }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Archivo PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFormData(prev => ({ ...prev, pdfFile: e.target.files?.[0] || null }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={handleCancelEdit}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : (editingTour ? 'Actualizar' : 'Crear Tour')}
              </button>
            </div>
            </form>
          </div>
        </div>
      </Modal>

      <CopyNotification show={showCopyNotification} onHide={() => setShowCopyNotification(false)} />
    </div>
  );
}
