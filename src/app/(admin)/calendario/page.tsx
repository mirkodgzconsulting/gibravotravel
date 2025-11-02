"use client";

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

// Interfaces
interface TourEvent {
  id: string;
  title: string;
  fechaViaje: string;
  fechaFin: string | null;
  tipo: 'TOUR_BUS' | 'TOUR_AEREO' | 'AGENDA_PERSONAL';
  color: string;
  agendaTipo?: string;
  visibilidad?: 'PRIVADO' | 'PUBLICO';
  isOwn?: boolean;
  creator?: string;
  recordatorio?: {
    diasAntes: number;
    isActivo: boolean;
  };
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: TourEvent[];
}

// Componente memoizado para días del calendario
const CalendarDayComponent = memo(({ day, onEventClick }: { 
  day: CalendarDay; 
  onEventClick: (event: TourEvent) => void;
}) => {
  const getEventIcon = (event: TourEvent, eventStartDate: Date, eventEndDate: Date | null) => {
    if (event.tipo === 'TOUR_BUS') {
      return '🚌 ';
    } else if (event.tipo === 'TOUR_AEREO') {
      return '✈️ ';
    } else if (event.tipo === 'AGENDA_PERSONAL') {
      const visibilityIcon = event.visibilidad === 'PUBLICO' ? '🌐 ' : '🔒 ';
      
      switch (event.agendaTipo) {
        case 'REUNION': return `${visibilityIcon}🤝 `;
        case 'CITA': return `${visibilityIcon}📅 `;
        case 'RECORDATORIO': return `${visibilityIcon}⏰ `;
        case 'TAREA': return `${visibilityIcon}✅ `;
        default: return `${visibilityIcon}📝 `;
      }
    }
    return '';
  };

  const getEventLabel = (event: TourEvent, eventStartDate: Date, eventEndDate: Date | null) => {
    const isStartDate = eventStartDate.toDateString() === day.date.toDateString();
    const isEndDate = eventEndDate && eventEndDate.toDateString() === day.date.toDateString();
    const icon = getEventIcon(event, eventStartDate, eventEndDate);
    
    if (event.tipo === 'AGENDA_PERSONAL') {
      return `${icon}${event.title}`;
    } else if (isStartDate && isEndDate) {
      return `${icon}${event.title} (Inicio/Fin)`;
    } else if (isStartDate) {
      return `${icon}${event.title} (Inicio)`;
    } else if (isEndDate) {
      return `${icon}${event.title} (Fin)`;
    }
    return `${icon}${event.title}`;
  };

  return (
    <div
      className={`min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-700 ${
        day.isCurrentMonth 
          ? 'bg-white dark:bg-gray-800' 
          : 'bg-gray-50 dark:bg-gray-700'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Número del día */}
        <div
          className={`text-sm font-medium mb-2 ${
            day.isToday
              ? 'bg-brand-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
              : day.isCurrentMonth
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          {day.date.getDate()}
        </div>

        {/* Eventos */}
        <div className="flex-1 space-y-1">
          {day.events.slice(0, 3).map((event) => {
            const eventStartDate = new Date(event.fechaViaje);
            const eventEndDate = event.fechaFin ? new Date(event.fechaFin) : null;
            const eventLabel = getEventLabel(event, eventStartDate, eventEndDate);
            
            return (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${event.color}`}
                title={eventLabel}
                onClick={() => onEventClick(event)}
              >
                {eventLabel}
              </div>
            );
          })}
          
          {/* Mostrar indicador si hay más eventos */}
          {day.events.length > 3 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{day.events.length - 3} más
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CalendarDayComponent.displayName = 'CalendarDayComponent';

// Componente principal del calendario
export default function CalendarioPage() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<TourEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TourEvent | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);

  // Obtener eventos de la API - optimizado con useCallback
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Usar la nueva API específica para calendario
      const response = await fetch('/api/calendario');
      if (!response.ok) {
        throw new Error('Error al obtener eventos del calendario');
      }
      
      const data = await response.json();
      
      if (data.success && data.events) {
        setEvents(data.events);
      } else {
        console.error('API response error:', data);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]); // En caso de error, mostrar array vacío
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Generar días del calendario - optimizado con useMemo
  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Crear un mapa de eventos por fecha para optimizar búsquedas
    const eventsByDate = new Map<string, TourEvent[]>();
    
    events.forEach(event => {
      const eventStartDate = new Date(event.fechaViaje);
      const eventEndDate = event.fechaFin ? new Date(event.fechaFin) : null;
      
      const startDateStr = eventStartDate.toDateString();
      const endDateStr = eventEndDate?.toDateString();
      
      // Agregar evento a fecha de inicio
      if (!eventsByDate.has(startDateStr)) {
        eventsByDate.set(startDateStr, []);
      }
      eventsByDate.get(startDateStr)!.push(event);
      
      // Agregar evento a fecha de fin si existe y es diferente
      if (endDateStr && endDateStr !== startDateStr) {
        if (!eventsByDate.has(endDateStr)) {
          eventsByDate.set(endDateStr, []);
        }
        eventsByDate.get(endDateStr)!.push(event);
      }
    });
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toDateString();
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: dateStr === today.toDateString(),
        events: eventsByDate.get(dateStr) || []
      });
    }
    
    return days;
  }, [currentDate, events]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Función optimizada para manejar clics en eventos
  const handleEventClick = useCallback((event: TourEvent) => {
    if (event.tipo === 'AGENDA_PERSONAL') {
      // Solo permitir editar agendas propias
      if (event.isOwn) {
        setSelectedEvent(event);
        setShowEventDetailModal(true);
      } else {
        // Mostrar información de solo lectura para agendas de otros usuarios
        alert(`Agenda pública de ${event.creator}\n\nTítulo: ${event.title}\nTipo: ${event.agendaTipo}\nFecha: ${new Date(event.fechaViaje).toLocaleDateString('es-ES')}`);
      }
    }
  }, []);

  const monthYearTitle = useMemo(() => {
    return currentDate.toLocaleDateString('es-ES', { 
      month: 'long', 
      year: 'numeric' 
    }).toUpperCase();
  }, [currentDate]);
  const weekDays = useMemo(() => ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'], []);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }
  
  // Carga progresiva: Mostrar skeleton del calendario mientras cargan los eventos
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Calendario skeleton */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto animate-pulse"></div>
                </div>
              ))}
            </div>
            {/* Días del mes */}
            <div className="grid grid-cols-7">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-700">
                  <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 animate-pulse"></div>
                  <div className="space-y-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verificar que el usuario tenga uno de los roles permitidos
  if (!userRole || !['USER', 'ADMIN', 'TI'].includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Acceso Negado
          </h1>
          <p className="text-gray-600">
            Solo usuarios autorizados pueden acceder al calendario.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header compacto */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
          {/* Navegación del calendario */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {monthYearTitle}
              </h2>
              <button
                onClick={goToToday}
                className="px-3 py-1 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm"
              >
                Hoy
              </button>
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setShowAgendaModal(true);
                }}
                className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                + Nueva Agenda
              </button>
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Leyenda compacta */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {/* Tours */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">TOURS BUS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-200 rounded"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">TOUR AEREO</span>
              </div>
              
              {/* Tipos de Agendas */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-200 rounded"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">PERSONAL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-200 rounded"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">REUNIÓN</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-200 rounded"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">CITA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">RECORDATORIO</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-200 rounded"></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">TAREA</span>
              </div>
              
              {/* Visibilidad */}
              <div className="flex items-center gap-2">
                <span className="text-xs">🔒</span>
                <span className="text-xs text-gray-700 dark:text-gray-300">PRIVADA</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">🌐</span>
                <span className="text-xs text-gray-700 dark:text-gray-300">PÚBLICA</span>
              </div>
            </div>
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <CalendarDayComponent
                key={`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}-${index}`}
                day={day}
                onEventClick={handleEventClick}
              />
            ))}
          </div>
        </div>


        {/* Estadísticas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-200 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">TOURS BUS</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.filter(e => e.tipo === 'TOUR_BUS').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-emerald-200 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">TOUR AEREO</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.filter(e => e.tipo === 'TOUR_AEREO').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-purple-200 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">AGENDAS PRIVADAS</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.filter(e => e.tipo === 'AGENDA_PERSONAL' && e.visibilidad === 'PRIVADO').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-pink-200 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">AGENDAS PÚBLICAS</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {events.filter(e => e.tipo === 'AGENDA_PERSONAL' && e.visibilidad === 'PUBLICO').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear agenda */}
      {showAgendaModal && (
        <AgendaModal
          selectedDate={selectedDate}
          onClose={() => setShowAgendaModal(false)}
          onSave={() => {
            setShowAgendaModal(false);
            fetchEvents(); // Recargar eventos
          }}
        />
      )}

      {/* Modal para ver/editar/eliminar agenda */}
      {showEventDetailModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => {
            setShowEventDetailModal(false);
            setSelectedEvent(null);
          }}
          onUpdate={() => {
            setShowEventDetailModal(false);
            setSelectedEvent(null);
            fetchEvents(); // Recargar eventos
          }}
          onDelete={() => {
            setShowEventDetailModal(false);
            setSelectedEvent(null);
            fetchEvents(); // Recargar eventos
          }}
        />
      )}
    </div>
  );
}

// Componente modal para agendas
interface AgendaModalProps {
  selectedDate: Date | null;
  onClose: () => void;
  onSave: () => void;
}

function AgendaModal({ selectedDate, onClose, onSave }: AgendaModalProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    tipo: 'PERSONAL',
    visibilidad: 'PRIVADO',
    recordatorio: {
      diasAntes: 0,
      isActivo: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejar tecla Escape para cerrar modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/agendas-personales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSave();
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Error al crear agenda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999999999]">
      <div
        className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] z-[9999999998]"
        onClick={onClose}
      ></div>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative z-[9999999999]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Nueva Agenda Personal
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha *
            </label>
            <input
              type="datetime-local"
              value={formData.fecha}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="PERSONAL">Personal</option>
              <option value="REUNION">Reunión</option>
              <option value="CITA">Cita</option>
              <option value="RECORDATORIO">Recordatorio</option>
              <option value="TAREA">Tarea</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visibilidad
            </label>
            <select
              value={formData.visibilidad}
              onChange={(e) => setFormData(prev => ({ ...prev, visibilidad: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="PRIVADO">🔒 Privado (Solo yo)</option>
              <option value="PUBLICO">🌐 Público (Todos los usuarios)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.visibilidad === 'PRIVADO' 
                ? 'Solo tú podrás ver esta agenda' 
                : 'Todos los usuarios podrán ver esta agenda'
              }
            </p>
          </div>


          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="recordatorio"
                checked={formData.recordatorio.isActivo}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  recordatorio: { ...prev.recordatorio, isActivo: e.target.checked }
                }))}
                className="rounded"
              />
              <label htmlFor="recordatorio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Activar recordatorio
              </label>
            </div>
            
            {formData.recordatorio.isActivo && (
              <select
                value={formData.recordatorio.diasAntes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  recordatorio: { ...prev.recordatorio, diasAntes: parseInt(e.target.value) }
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value={0}>Mismo día</option>
                <option value={1}>1 día antes</option>
                <option value={2}>2 días antes</option>
                <option value={3}>3 días antes</option>
                <option value={4}>4 días antes</option>
                <option value={5}>5 días antes</option>
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente modal para ver/editar/eliminar agenda
interface EventDetailModalProps {
  event: TourEvent;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

function EventDetailModal({ event, onClose, onUpdate, onDelete }: EventDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    tipo: 'PERSONAL',
    visibilidad: 'PRIVADO'
  });

  // Cargar datos completos de la agenda
  useEffect(() => {
    const fetchAgendaDetails = async () => {
      try {
        // Remover el prefijo 'personal-' del ID si existe
        const realId = event.id.replace('personal-', '');
        console.log('🔍 ID del evento:', event.id);
        console.log('🔍 ID real (sin prefijo):', realId);
        
        const response = await fetch(`/api/agendas-personales/${realId}`);
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Data recibida:', data);
          
          const agenda = data.agenda;
          console.log('📋 Agenda extraída:', agenda);
          
          if (!agenda) {
            console.error('❌ No se encontró la agenda en la respuesta');
            setLoading(false);
            return;
          }
          
          // Formatear fecha para datetime-local input
          let fechaFormateada = agenda.fecha;
          console.log('📅 Fecha original:', fechaFormateada);
          
          if (fechaFormateada) {
            const date = new Date(fechaFormateada);
            // Convertir a formato YYYY-MM-DDTHH:MM
            fechaFormateada = date.toISOString().slice(0, 16);
            console.log('📅 Fecha formateada:', fechaFormateada);
          }
          
          const newFormData = {
            titulo: agenda.titulo || '',
            descripcion: agenda.descripcion || '',
            fecha: fechaFormateada || '',
            tipo: agenda.tipo || 'PERSONAL',
            visibilidad: agenda.visibilidad || 'PRIVADO'
          };
          
          console.log('✅ Datos del formulario:', newFormData);
          setFormData(newFormData);
        } else {
          const errorData = await response.json();
          console.error('❌ Error en la respuesta:', errorData);
        }
      } catch (error) {
        console.error('❌ Error fetching agenda details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgendaDetails();
  }, [event.id]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Remover el prefijo 'personal-' del ID si existe
      const realId = event.id.replace('personal-', '');
      
      const response = await fetch(`/api/agendas-personales/${realId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onUpdate();
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Error al actualizar agenda');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta agenda?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Remover el prefijo 'personal-' del ID si existe
      const realId = event.id.replace('personal-', '');
      
      const response = await fetch(`/api/agendas-personales/${realId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete();
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      alert('Error al eliminar agenda');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[9999999999]">
        <div
          className="fixed inset-0 h-full w-full bg-gray-400/50 backdrop-blur-[32px] z-[9999999998]"
          onClick={onClose}
        ></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 relative z-[9999999999]">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999999999]">
      <div
        className="fixed inset-0 h-full w-full bg-black/50 z-[9999999998]"
        onClick={onClose}
      ></div>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4 relative z-[9999999999]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header minimalista */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Editar Agenda
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Título
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Título de la agenda"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors resize-none"
              rows={2}
              placeholder="Descripción opcional"
            />
          </div>

          {/* Fecha y Tipo en una fila */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Fecha
              </label>
              <input
                type="datetime-local"
                value={formData.fecha}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tipo
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="PERSONAL">📝 Personal</option>
                <option value="REUNION">🤝 Reunión</option>
                <option value="CITA">📅 Cita</option>
                <option value="RECORDATORIO">⏰ Recordatorio</option>
                <option value="TAREA">✅ Tarea</option>
              </select>
            </div>
          </div>

          {/* Visibilidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Visibilidad
            </label>
            <select
              value={formData.visibilidad}
              onChange={(e) => setFormData(prev => ({ ...prev, visibilidad: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="PRIVADO">🔒 Privado (Solo yo)</option>
              <option value="PUBLICO">🌐 Público (Todos los usuarios)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.visibilidad === 'PRIVADO' 
                ? 'Solo tú podrás ver esta agenda' 
                : 'Todos los usuarios podrán ver esta agenda'
              }
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              Eliminar
            </button>
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
