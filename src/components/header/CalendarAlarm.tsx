"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  fechaViaje: string;
  tipo: "TOUR_BUS" | "TOUR_AEREO" | "AGENDA_PERSONAL";
  recordatorio?: {
    diasAntes: number;
    isActivo: boolean;
  };
}

export default function CalendarAlarm() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar IDs descartados desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem("calendar_dismissed_alerts");
    if (saved) {
      try {
        setDismissedIds(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing dismissed alerts", e);
      }
    }
  }, []);

  const fetchTodayEvents = useCallback(async () => {
    try {
      const response = await fetch("/api/calendario");
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.success && data.events) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filtrar eventos de HOY o aquellos que tienen un RECORDATORIO activo para hoy
        const filteredEvents = data.events.filter((event: CalendarEvent) => {
          // Si el usuario ya lo descartó en esta sesión/navegador, lo ignoramos
          if (dismissedIds.includes(event.id)) return false;

          const eventDate = new Date(event.fechaViaje);
          const eventDateOnly = new Date(eventDate);
          eventDateOnly.setHours(0, 0, 0, 0);

          // Caso 1: Es hoy
          if (eventDateOnly.getTime() === today.getTime()) return true;

          // Caso 2: Recordatorio activo
          if (event.recordatorio?.isActivo) {
            const reminderDate = new Date(eventDateOnly);
            reminderDate.setDate(reminderDate.getDate() - event.recordatorio.diasAntes);
            return today >= reminderDate && today < eventDateOnly;
          }

          return false;
        });

        // Ordenar por hora/fecha
        filteredEvents.sort((a: CalendarEvent, b: CalendarEvent) => 
          new Date(a.fechaViaje).getTime() - new Date(b.fechaViaje).getTime()
        );

        setEvents(filteredEvents);
        
        // Ajustar el índice si el evento actual ya no existe o es mayor que el nuevo total
        setCurrentIndex(prev => prev >= filteredEvents.length ? 0 : prev);
      }
    } catch (error) {
      console.error("Error fetching today alarm events:", error);
    } finally {
      setLoading(false);
    }
  }, [dismissedIds]);

  useEffect(() => {
    fetchTodayEvents();
    const interval = setInterval(fetchTodayEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTodayEvents]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem("calendar_dismissed_alerts", JSON.stringify(newDismissed));
    
    // El filtro de fetchTodayEvents se encargará de actualizar la lista en el próximo ciclo
    // Pero para feedback instantáneo, filtramos localmente también
    setEvents(prev => prev.filter(ev => ev.id !== id));
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (events.length <= 1 || isOpen) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [events, isOpen]);

  if (loading || events.length === 0) return null;

  const currentEvent = events[currentIndex];

  const getEventDateInfo = (fecha: string) => {
    const eventDate = new Date(fecha);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isToday = new Date(eventDate).setHours(0, 0, 0, 0) === today.getTime();
    
    const time = eventDate.toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' });
    const dayMonth = eventDate.toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit' });

    if (isToday) {
      return `Oggi ore ${time}`;
    } else {
      return `${dayMonth} ore ${time}`;
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case "TOUR_BUS": return "🚌";
      case "TOUR_AEREO": return "✈️";
      case "AGENDA_PERSONAL": return "📅";
      default: return "🔔";
    }
  };

  return (
    <div className="flex items-center ml-4 relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 transition-all duration-300 animate-pulse border border-fuchsia-400/30"
      >
        <span className="absolute inset-0 rounded-full border-2 border-fuchsia-500 animate-[ping_2s_infinite] opacity-40"></span>
        
        <span className="text-sm font-bold flex items-center gap-2 whitespace-nowrap">
          <span className="bg-white/20 p-0.5 rounded-md leading-none">
            {getIcon(currentEvent.tipo)}
          </span>
          <div className="flex flex-col items-start leading-tight">
            <span className="max-w-[120px] truncate text-[13px]">
              {currentEvent.title}
            </span>
            <span className="text-[10px] opacity-80 font-medium">
              {getEventDateInfo(currentEvent.fechaViaje)}
            </span>
          </div>
          {events.length > 1 && (
            <span className="bg-white/30 px-1.5 py-0.5 rounded-full text-[10px] ml-1">
              +{events.length - 1}
            </span>
          )}
        </span>
      </button>

      {/* Dropdown de Alertas */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[999999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 border-b border-fuchsia-100 dark:border-fuchsia-900/30 flex justify-between items-center">
            <h3 className="text-sm font-bold text-fuchsia-700 dark:text-fuchsia-400 flex items-center gap-2">
              <span className="animate-bounce">🔔</span> Agenda Atentos
            </h3>
            <span className="text-[10px] bg-fuchsia-200 dark:bg-fuchsia-800 px-2 py-0.5 rounded text-fuchsia-800 dark:text-fuchsia-200">
              {events.length} {events.length === 1 ? 'alert' : 'alerts'}
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {events.map((event) => (
              <div
                key={event.id}
                className="group/item relative block p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors"
              >
                <Link
                  href="/calendario"
                  onClick={() => setIsOpen(false)}
                  className="flex gap-3 pr-8"
                >
                  <span className="text-xl flex-shrink-0">{getIcon(event.tipo)}</span>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {event.title}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 font-medium">
                      <svg className="w-3 h-3 text-fuchsia-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {getEventDateInfo(event.fechaViaje)}
                    </p>
                    {event.recordatorio?.isActivo && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] rounded font-medium">
                        Heads up: {event.recordatorio.diasAntes}d pre-aviso
                      </span>
                    )}
                  </div>
                </Link>
                
                {/* Botón para quitar/ignorar alerta */}
                <button
                  onClick={(e) => handleDismiss(event.id, e)}
                  title="Gestionado / Quitar alerta"
                  className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover/item:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <Link
            href="/calendario"
            onClick={() => setIsOpen(false)}
            className="block text-center p-2.5 text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/10 transition-colors uppercase tracking-wider"
          >
            Vai al calendario 📅
          </Link>
        </div>
      )}
    </div>
  );
}
