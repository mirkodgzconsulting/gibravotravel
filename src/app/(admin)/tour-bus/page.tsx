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
import { BusIcon, CalendarIcon, UsersIcon, DollarSignIcon, TrashIcon, EditIcon, EyeIcon } from "lucide-react";
import Image from "next/image";
import { cachedFetch, invalidateCacheByPrefix } from "@/utils/cachedFetch";

interface TourBus {
  id: string;
  titulo: string;
  precioAdulto: number;
  precioNino: number;
  cantidadAsientos: number;
  fechaCreacion: string;
  fechaViaje: string | null;
  fechaFin: string | null;
  acc: string | null;
  // Campos de costos
  bus: number | null;
  pasti: number | null;
  parking: number | null;
  coordinatore1: number | null;
  coordinatore2: number | null;
  ztl: number | null;
  hotel: number | null;
  polizza: number | null;
  tkt: number | null;
  autoservicio: string | null;
  // Archivos
  coverImage: string | null;
  coverImageName: string | null;
  pdfFile: string | null;
  pdfFileName: string | null;
  descripcion: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  asientos: AsientoBus[];
  _count: {
    ventas: number;
  };
}

interface AsientoBus {
  id: string;
  numeroAsiento: number;
  fila: number;
  columna: string;
  tipo: 'NORMAL' | 'PREMIUM' | 'DISCAPACITADO' | 'CONDUCTOR';
  isVendido: boolean;
  stato: string;
  precioVenta: number | null;
  fechaVenta: string | null;
  clienteNombre: string | null;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  observaciones: string | null;
}

interface TourFormData {
  titulo: string;
  precioAdulto: string;
  precioNino: string;
  fechaViaje: string;
  fechaFin: string;
  acc: string;
  // Campos de costos
  bus: string;
  pasti: string;
  parking: string;
  coordinatore1: string;
  coordinatore2: string;
  ztl: string;
  hotel: string;
  polizza: string;
  tkt: string;
  autoservicio: string;
  // Archivos
  coverImage: File | null;
  pdfFile: File | null;
  descripcion: string;
}

export default function TourBusPage() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();
  const { searchTerm, searchResults } = useSearch();
  const [tours, setTours] = useState<TourBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [formData, setFormData] = useState<TourFormData>({
    titulo: "",
    precioAdulto: "",
    precioNino: "",
    fechaViaje: "",
    fechaFin: "",
    acc: "",
    // Campos de costos
    bus: "",
    pasti: "",
    parking: "",
    coordinatore1: "",
    coordinatore2: "",
    ztl: "",
    hotel: "",
    polizza: "",
    tkt: "",
    autoservicio: "",
    // Archivos
    coverImage: null,
    pdfFile: null,
    descripcion: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTour, setEditingTour] = useState<TourBus | null>(null);

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Todos los usuarios ven todos los tours para poder realizar ventas (con cache en memoria)
      const data = await cachedFetch<{ tours: any[] }>(`/api/tour-bus`, { ttlMs: 15000 });
      setTours(data.tours || []);
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    if (!roleLoading) {
      fetchTours();
    }
  }, [roleLoading, fetchTours]);

  const filteredTours: TourBus[] = searchTerm && searchResults.length > 0 ? searchResults as TourBus[] : tours;

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
      formDataToSend.append('acc', formData.acc);
      
      // Campos de costos
      formDataToSend.append('bus', formData.bus);
      formDataToSend.append('pasti', formData.pasti);
      formDataToSend.append('parking', formData.parking);
      formDataToSend.append('coordinatore1', formData.coordinatore1);
      formDataToSend.append('coordinatore2', formData.coordinatore2);
      formDataToSend.append('ztl', formData.ztl);
      formDataToSend.append('hotel', formData.hotel);
      formDataToSend.append('polizza', formData.polizza);
      formDataToSend.append('tkt', formData.tkt);
      formDataToSend.append('autoservicio', formData.autoservicio);
      
      formDataToSend.append('descripcion', formData.descripcion);
      
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }
      if (formData.pdfFile) {
        formDataToSend.append('pdfFile', formData.pdfFile);
      }

      const response = await fetch('/api/tour-bus', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        // Invalidar cache para ver el cambio al instante
        invalidateCacheByPrefix('/api/tour-bus');
        setTours(prev => [data.tour, ...prev]);
        setFormData({
          titulo: "",
          precioAdulto: "",
          precioNino: "",
          fechaViaje: "",
          fechaFin: "",
          acc: "",
          bus: "",
          pasti: "",
          parking: "",
          coordinatore1: "",
          coordinatore2: "",
          ztl: "",
          hotel: "",
          polizza: "",
          tkt: "",
          autoservicio: "",
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
      formDataToSend.append('acc', formData.acc);
      
      // Campos de costos
      formDataToSend.append('bus', formData.bus);
      formDataToSend.append('pasti', formData.pasti);
      formDataToSend.append('parking', formData.parking);
      formDataToSend.append('coordinatore1', formData.coordinatore1);
      formDataToSend.append('coordinatore2', formData.coordinatore2);
      formDataToSend.append('ztl', formData.ztl);
      formDataToSend.append('hotel', formData.hotel);
      formDataToSend.append('polizza', formData.polizza);
      formDataToSend.append('tkt', formData.tkt);
      formDataToSend.append('autoservicio', formData.autoservicio);
      
      formDataToSend.append('descripcion', formData.descripcion);
      
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }
      if (formData.pdfFile) {
        formDataToSend.append('pdfFile', formData.pdfFile);
      }

      const response = await fetch(`/api/tour-bus/${editingTour.id}`, {
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
          acc: "",
          bus: "",
          pasti: "",
          parking: "",
          coordinatore1: "",
          coordinatore2: "",
          ztl: "",
          hotel: "",
          polizza: "",
          tkt: "",
          autoservicio: "",
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

  const handleDeleteTour = async (tourId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este tour?')) return;

    try {
      const response = await fetch(`/api/tour-bus/${tourId}`, {
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

  const handleEditTour = (tour: TourBus) => {
    setEditingTour(tour);
    setFormData({
      titulo: tour.titulo,
      precioAdulto: tour.precioAdulto.toString(),
      precioNino: tour.precioNino.toString(),
      fechaViaje: tour.fechaViaje ? new Date(tour.fechaViaje).toISOString().split('T')[0] : "",
      fechaFin: tour.fechaFin ? new Date(tour.fechaFin).toISOString().split('T')[0] : "",
      acc: tour.acc || "",
      // Campos de costos
      bus: tour.bus?.toString() || "",
      pasti: tour.pasti?.toString() || "",
      parking: tour.parking?.toString() || "",
      coordinatore1: tour.coordinatore1?.toString() || "",
      coordinatore2: tour.coordinatore2?.toString() || "",
      ztl: tour.ztl?.toString() || "",
      hotel: tour.hotel?.toString() || "",
      polizza: tour.polizza?.toString() || "",
      tkt: tour.tkt?.toString() || "",
      autoservicio: tour.autoservicio || "",
      // Archivos
      coverImage: null,
      pdfFile: null,
      descripcion: tour.descripcion || "",
    });
    openModal();
  };

  const handleCancelEdit = () => {
    setEditingTour(null);
    setFormData({
      titulo: "",
      precioAdulto: "",
      precioNino: "",
      fechaViaje: "",
      fechaFin: "",
      acc: "",
      bus: "",
      pasti: "",
      parking: "",
      coordinatore1: "",
      coordinatore2: "",
      ztl: "",
      hotel: "",
      polizza: "",
      tkt: "",
      autoservicio: "",
      coverImage: null,
      pdfFile: null,
      descripcion: "",
    });
    closeModal();
  };

  const openSeatVisualizer = (tour: TourBus) => {
    window.open(`/tour-bus/${tour.id}/asientos`, '_blank');
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }
  
  // Carga progresiva: Mostrar skeleton mientras cargan los datos
  if (loading && tours.length === 0) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Tours Bus" />
        <ComponentCard title="Tours de Bus Disponibles">
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

  if (!userRole || !['ADMIN', 'TI', 'USER'].includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Accesso Negato
          </h1>
          <p className="text-gray-600">
            Solo gli utenti autorizzati possono accedere a questa sezione.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Tours Bus" />
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          <p>{error}</p>
          <Button 
            onClick={() => setError(null)}
            size="sm"
            variant="outline"
            className="mt-2"
          >
            Cerrar
          </Button>
        </div>
      )}

      {/* Botones principales */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={openModal}
          className="p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
          title="Crear Tour"
        >
          <BusIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Modal para agregar tour */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCancelEdit}
        className="max-w-4xl mx-4 max-h-[90vh]"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header fijo */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingTour ? "Editar Tour" : "Crear Nuevo Tour"}
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio Adulto (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioAdulto}
                    onChange={(e) => setFormData(prev => ({ ...prev, precioAdulto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio Niño (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precioNino}
                    onChange={(e) => setFormData(prev => ({ ...prev, precioNino: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
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
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Todos los buses tienen 53 asientos por defecto
                  </p>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ACC
                  </label>
                  <input
                    type="text"
                    value={formData.acc}
                    onChange={(e) => setFormData(prev => ({ ...prev, acc: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Ingrese el valor ACC"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AUTOSERVICIO
                  </label>
                  <input
                    type="text"
                    value={formData.autoservicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoservicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Descripción del autoservicio"
                  />
                </div>

                {/* Sección de Campos de Costos */}
                <div className="lg:col-span-3">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Campos de Costos
                    </h3>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    BUS
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bus}
                    onChange={(e) => setFormData(prev => ({ ...prev, bus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PASTI
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pasti}
                    onChange={(e) => setFormData(prev => ({ ...prev, pasti: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PARKING
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.parking}
                    onChange={(e) => setFormData(prev => ({ ...prev, parking: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    COORDINATORE 1
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.coordinatore1}
                    onChange={(e) => setFormData(prev => ({ ...prev, coordinatore1: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    COORDINATORE 2
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.coordinatore2}
                    onChange={(e) => setFormData(prev => ({ ...prev, coordinatore2: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ZTL
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.ztl}
                    onChange={(e) => setFormData(prev => ({ ...prev, ztl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    HOTEL
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hotel}
                    onChange={(e) => setFormData(prev => ({ ...prev, hotel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    POLIZZA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.polizza}
                    onChange={(e) => setFormData(prev => ({ ...prev, polizza: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    TKT
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tkt}
                    onChange={(e) => setFormData(prev => ({ ...prev, tkt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                {/* Separador antes de archivos */}
                <div className="md:col-span-2">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Archivos
                    </h3>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Immagine di Copertina
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.files?.[0] || null }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                  />
                  {editingTour?.coverImage && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Archivo actual: {editingTour.coverImageName || 'Imagen cargada'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File PDF/Documento
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFormData(prev => ({ ...prev, pdfFile: e.target.files?.[0] || null }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                  />
                  {editingTour?.pdfFile && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Archivo actual: {editingTour.pdfFileName || 'Documento cargado'}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
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

      <ComponentCard title="Tours de Bus Disponibles">
        {filteredTours.length === 0 && !loading ? (
          <div className="text-center py-12">
            <BusIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun tour creato ancora
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Crea tu primer tour de bus para comenzar
            </p>
            <Button
              onClick={openModal}
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg"
            >
              Crear Tour
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map((tour) => {
              // Calcular estadísticas del tour basadas en asientos reales
              const asientosVendidos = tour.asientos.filter(a => a.isVendido).length;
              const asientosDisponibles = tour.cantidadAsientos - asientosVendidos;
              const porcentajeVendido = tour.cantidadAsientos > 0 ? (asientosVendidos / tour.cantidadAsientos) * 100 : 0;
              const porcentaje = Math.round(porcentajeVendido);
              const ingresos = tour.asientos
                .filter(a => a.isVendido && a.precioVenta)
                .reduce((sum, a) => sum + (a.precioVenta || 0), 0);
              
              return (
                <div
                  key={tour.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 relative group hover:shadow-lg transition-shadow duration-300"
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
                    {/* Barra de progreso funcional - Parte superior */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Ventas: {asientosVendidos}/{tour.cantidadAsientos}</span>
                        <span className="font-semibold">{porcentaje}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                          {tour.titulo}
                        </h3>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <DollarSignIcon className="w-4 h-4" />
                            <span>Adulto: €{tour.precioAdulto}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <DollarSignIcon className="w-4 h-4" />
                            <span>Niño: €{tour.precioNino}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <UsersIcon className="w-4 h-4" />
                            <span>{tour.cantidadAsientos} asientos</span>
                          </div>
                          
                          {tour.fechaViaje && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{new Date(tour.fechaViaje).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Estadísticas del tour */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                            <div className="text-green-600 dark:text-green-400 font-semibold">
                              {asientosVendidos}
                            </div>
                            <div className="text-green-500 dark:text-green-300">
                              Vendidos
                            </div>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                            <div className="text-blue-600 dark:text-blue-400 font-semibold">
                              {asientosDisponibles}
                            </div>
                            <div className="text-blue-500 dark:text-blue-300">
                              Disponibles
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Ingresos: <span className="font-semibold text-green-600">€{ingresos.toFixed(2)}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openSeatVisualizer(tour)}
                          className="p-2 bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300 rounded-lg transition-all duration-200"
                          title="Ver asientos"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleEditTour(tour)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg transition-all duration-200"
                          title="Editar tour"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTour(tour.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded-lg transition-all duration-200"
                          title="Eliminar tour"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Creado por: {tour.creator.firstName} {tour.creator.lastName}
                    </div>
                  </div>
                </div>
              );
            })}
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
