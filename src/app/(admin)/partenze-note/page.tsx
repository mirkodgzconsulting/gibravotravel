"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useSearch } from "@/context/SearchContext";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { CopyNotification } from "@/components/ui/notification/CopyNotification";
import { Modal } from "@/components/ui/modal";
import Image from "next/image";

interface TourBus {
  id: string;
  titulo: string;
  precioAdulto: number;
  precioNino: number;
  cantidadAsientos: number;
  fechaCreacion: string;
  fechaViaje: string | null;
  acc: string | null;
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
}

interface TourAereo {
  id: string;
  titulo: string;
  precioAdulto: number;
  precioNino: number;
  meta: number;
  fechaCreacion: string;
  fechaViaje: string | null;
  acc: string | null;
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
}

// Tipo unificado para ambos tipos de tours
type TourUnified = (TourBus & { tipo: 'bus' }) | (TourAereo & { tipo: 'aereo' });

export default function PartenzeNotePage() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { searchTerm, searchResults } = useSearch();
  const [tours, setTours] = useState<TourUnified[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTour, setExpandedTour] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [copiedTours, setCopiedTours] = useState<Set<string>>(new Set());
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState<TourUnified | null>(null);

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Todos los usuarios ven todos los tours para poder reutilizar las descripciones
      // Cargar tours de bus
      const busResponse = await fetch('/api/tour-bus');
      const busData = busResponse.ok ? await busResponse.json() : { tours: [] };
      
      // Cargar tours aéreos
      const aereoResponse = await fetch('/api/tour-aereo');
      const aereoData = aereoResponse.ok ? await aereoResponse.json() : { tours: [] };
      
      // Combinar y marcar el tipo
      const busTours = (busData.tours || []).map((tour: TourBus) => ({ ...tour, tipo: 'bus' as const }));
      const aereoTours = (aereoData.tours || []).map((tour: TourAereo) => ({ ...tour, tipo: 'aereo' as const }));
      
      // Combinar y ordenar por fecha de viaje (ascendente - más próximo primero)
      const allTours = [...busTours, ...aereoTours].sort((a, b) => {
        // Si ambos tienen fechaViaje, ordenar ascendente (más próximo primero)
        if (a.fechaViaje && b.fechaViaje) {
          const dateA = new Date(a.fechaViaje).getTime();
          const dateB = new Date(b.fechaViaje).getTime();
          return dateA - dateB; // Ascendente
        }
        // Si solo uno tiene fechaViaje, el que tiene fecha va primero
        if (a.fechaViaje && !b.fechaViaje) return -1;
        if (!a.fechaViaje && b.fechaViaje) return 1;
        // Si ninguno tiene fechaViaje, ordenar por fecha de creación (más recientes primero)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setTours(allTours);
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

  const handleCopyContent = async (tourId: string, text: string | null) => {
    try {
      const contentToCopy = text || '';
      await navigator.clipboard.writeText(contentToCopy);
      setShowCopyNotification(true);
      
      // Marcar como copiado
      setCopiedTours(prev => new Set(prev).add(tourId));
      
      // Resetear después de 3 segundos
      setTimeout(() => {
        setCopiedTours(prev => {
          const newSet = new Set(prev);
          newSet.delete(tourId);
          return newSet;
        });
        setShowCopyNotification(false);
      }, 3000);
    } catch {
      setError('Error al copiar al portapapeles');
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: abrir en nueva pestaña
      window.open(url, '_blank');
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedTour(expandedTour === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Usar directamente los resultados de búsqueda o todos los tours
  const filteredTours: TourUnified[] = searchTerm && searchResults.length > 0 ? (searchResults as unknown as TourUnified[]) : tours;

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
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
      <PageBreadcrumb pageTitle="Partenze / Note" />
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-4 py-2 text-sm bg-red-200 hover:bg-red-300 dark:bg-red-800 dark:hover:bg-red-700 rounded"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Información de resultados de búsqueda */}
      {searchTerm && searchResults.length > 0 && (
        <ComponentCard title="Risultati Ricerca">
          <div className="text-center py-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="text-brand-600 dark:text-brand-400 font-medium">
                &quot;{searchTerm}&quot;
              </span>
              <span className="ml-2">
                {searchResults.length} {searchResults.length === 1 ? 'risultato' : 'risultati'} trovati
              </span>
            </div>
          </div>
        </ComponentCard>
      )}

      {/* Grid de plantillas */}
      <ComponentCard title="Modelli di Note di Viaggio">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Nessun tour disponibile</p>
            <p className="text-sm mt-2">I tours creati in &quot;Tours Bus&quot; e &quot;Tour Aereo&quot; appariranno qui</p>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Nessun tour trovato con i filtri attuali</p>
            <p className="text-sm mt-2">Prova a modificare i criteri di ricerca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTours.map((tour) => (
              <div
                key={tour.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700"
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
                <div className="p-4">
                  {/* Título con icono */}
                  <div className="flex items-center gap-2 mb-2">
                    {tour.tipo === 'bus' ? (
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-1.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-3.5l8 1.5z"/>
                      </svg>
                    )}
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {tour.titulo}
                    </h3>
                  </div>

                  {/* Fecha y precios */}
                  <div className="mb-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        📅 {tour.fechaViaje ? formatDate(tour.fechaViaje) : 'Fecha no definida'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Adulto:</span>
                        <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                          {formatCurrency(tour.precioAdulto)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Niño:</span>
                        <span className="text-sm font-medium text-brand-600 dark:text-brand-400">
                          {formatCurrency(tour.precioNino)}
                        </span>
                      </div>
                      {/* Información específica según el tipo */}
                      {tour.tipo === 'bus' ? (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Asientos:</span>
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {tour.cantidadAsientos}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Meta:</span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {tour.meta}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Campo ACC */}
                  {tour.acc && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        ACC: {tour.acc}
                      </span>
                    </div>
                  )}

                  {/* Archivos */}
                  <div className="flex items-center gap-3 mb-3">
                    {tour.pdfFile && (
                      <button
                        onClick={() => {
                          setSelectedTour(tour);
                          setIsFileModalOpen(true);
                        }}
                        className="p-2.5 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 text-red-600 dark:text-red-400 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/40 dark:hover:to-red-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Ver archivos PDF"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                      </button>
                    )}
                    
                    {tour.coverImage && (
                      <button
                        onClick={() => {
                          setSelectedTour(tour);
                          setIsFileModalOpen(true);
                        }}
                        className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/40 dark:hover:to-blue-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
                        title="Ver archivos de imagen"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5Z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Botón Copiar (único botón de acción) */}
                  <div className="flex justify-center mb-3">
                    <button
                      onClick={() => handleCopyContent(tour.id, tour.descripcion)}
                      className={`p-3 rounded-lg transition-all duration-200 transform hover:scale-105 ${
                        copiedTours.has(tour.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300'
                      }`}
                      title={copiedTours.has(tour.id) ? "¡Copiado!" : "Copiar contenido"}
                    >
                      {copiedTours.has(tour.id) ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Texto de la descripción */}
                  {tour.descripcion && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {expandedTour === tour.id ? (
                          <div>
                            <p className="whitespace-pre-wrap">{tour.descripcion}</p>
                            <button
                              onClick={() => toggleExpanded(tour.id)}
                              className="text-brand-600 dark:text-brand-400 hover:underline mt-2"
                            >
                              Leggi meno
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="line-clamp-3">
                              {tour.descripcion.length > 150 
                                ? `${tour.descripcion.substring(0, 150)}...`
                                : tour.descripcion
                              }
                            </p>
                            {tour.descripcion.length > 150 && (
                              <button
                                onClick={() => toggleExpanded(tour.id)}
                                className="text-brand-600 dark:text-brand-400 hover:underline mt-2"
                              >
                                Leggi più
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Información del creador */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Creato por: {tour.creator.firstName} {tour.creator.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(tour.createdAt)}
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

      {/* Modal de archivos */}
      <Modal
        isOpen={isFileModalOpen}
        onClose={() => {
          setIsFileModalOpen(false);
          setSelectedTour(null);
        }}
        className="max-w-md mx-4"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Archivos - {selectedTour?.titulo}
          </h2>
          
          <div className="space-y-3">
            {selectedTour?.pdfFile && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 rounded-xl border border-red-200/50 dark:border-red-800/50 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/40">
                    <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {selectedTour.pdfFileName || 'documento.pdf'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Documento PDF</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedTour.pdfFile!, selectedTour.pdfFileName || 'documento.pdf')}
                  className="ml-3 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                >
                  Descargar
                </button>
              </div>
            )}
            
            {selectedTour?.coverImage && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                    <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M8.5,13.5L11,16.5L14.5,12L19,18H5L8.5,13.5Z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {selectedTour.coverImageName || 'imagen.jpg'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Archivo de imagen</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(selectedTour.coverImage!, selectedTour.coverImageName || 'imagen.jpg')}
                  className="ml-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                >
                  Descargar
                </button>
              </div>
            )}
          </div>
          
          {!selectedTour?.pdfFile && !selectedTour?.coverImage && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No hay archivos disponibles
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
