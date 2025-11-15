"use client";
import React, { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface Notificacion {
  id: string;
  mensaje: string;
  tipo: string;
  isLeida: boolean;
  createdAt: string;
  agenda?: {
    titulo: string;
    fecha: string;
  };
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para obtener la hora actual en Italia (Europe/Rome)
  const getItalyHour = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Rome',
      hour: '2-digit',
      hour12: false
    });
    const hourStr = formatter.format(now);
    return parseInt(hourStr);
  };

  // Función para calcular milisegundos hasta la próxima carga (8 AM o 9 AM hora Italia)
  const getMsUntilNextScheduledTime = () => {
    const now = new Date();
    const currentHourItaly = getItalyHour();
    
    // Horas programadas: 8 AM y 9 AM
    let nextHour: number;
    let isTomorrow = false;
    
    if (currentHourItaly < 8) {
      // Antes de las 8 AM: programar para las 8 AM de hoy
      nextHour = 8;
    } else if (currentHourItaly < 9) {
      // Entre 8 AM y 9 AM: programar para las 9 AM de hoy
      nextHour = 9;
    } else {
      // Después de las 9 AM: programar para las 8 AM de mañana
      nextHour = 8;
      isTomorrow = true;
    }
    
    // Calcular el tiempo objetivo iterando desde ahora
    let testTime = new Date(now);
    const maxAttempts = 48; // Máximo 48 horas
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const testHour = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Rome',
        hour: '2-digit',
        hour12: false
      }).format(testTime);
      
      const testHourNum = parseInt(testHour);
      
      if (testHourNum === nextHour) {
        // Verificar que sea el día correcto (hoy o mañana)
        const testDay = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Europe/Rome',
          day: '2-digit'
        }).format(testTime);
        
        const todayDay = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Europe/Rome',
          day: '2-digit'
        }).format(now);
        
        // Si buscamos mañana, debe ser diferente; si buscamos hoy, debe ser igual
        if ((isTomorrow && testDay !== todayDay) || (!isTomorrow && testDay === todayDay)) {
          const msUntil = testTime.getTime() - now.getTime();
          // Asegurar que sea al menos 1 minuto en el futuro
          return msUntil > 60000 ? msUntil : 60000;
        }
      }
      
      // Avanzar 1 minuto
      testTime = new Date(testTime.getTime() + 60000);
      attempts++;
    }
    
    // Fallback: retornar 1 hora si no se encuentra
    return 3600000;
  };

  const fetchNotificaciones = async () => {
    try {
      const response = await fetch('/api/notificaciones');
      if (response.ok) {
        const data = await response.json();
        setNotificaciones(data.notificaciones || []);
        setNoLeidas(data.noLeidas || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Programar la próxima carga automática
  const scheduleNextFetch = () => {
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const msUntil = getMsUntilNextScheduledTime();
    
    timeoutRef.current = setTimeout(() => {
      fetchNotificaciones();
      // Programar la siguiente carga después de esta
      scheduleNextFetch();
    }, msUntil);
  };

  // Obtener notificaciones
  useEffect(() => {
    // Cargar notificaciones al montar el componente
    fetchNotificaciones();
    
    // Programar las cargas automáticas a las 8 AM y 9 AM hora Italia
    scheduleNextFetch();
    
    // Cleanup: limpiar timeout al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotificaciones(); // Recargar al abrir
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/api/notificaciones/marcar-todas', {
        method: 'POST'
      });
      if (response.ok) {
        fetchNotificaciones();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatFecha = (fecha: string) => {
    const date = new Date(fecha);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notificaciones
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        
        {noLeidas > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="mb-3 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
          >
            Marcar todas como leídas
          </button>
        )}

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </li>
          ) : notificaciones.length === 0 ? (
            <li className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
              No hay notificaciones
            </li>
          ) : (
            notificaciones.map((notif) => (
              <li key={notif.id}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                    !notif.isLeida ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    !notif.isLeida ? 'bg-purple-500' : 'bg-gray-300'
                  }`}></div>

                  <span className="block flex-1">
                    <span className="mb-1 block text-sm text-gray-800 dark:text-white">
                      {notif.mensaje}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFecha(notif.createdAt)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
