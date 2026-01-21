"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from "@/components/ui/modal";
import { User, Users, X, Plus, GripVertical, Save } from 'lucide-react';
import * as XLSX from 'xlsx';

// Tipos de habitación disponibles
type TipoHabitacion = 'Singola' | 'Doppia' | 'Matrimoniale' | 'Tripla' | 'Suite' | 'Family Room';

// Interfaz para un pasajero
interface Pasajero {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  paisOrigen: string;
  iata: string;
  pnr: string | null;
  estado: string;
}

// Interfaz para una habitación
interface Habitacion {
  id: string;
  tipo: TipoHabitacion;
  numero?: string; // Número de habitación (opcional)
  pasajeros: Pasajero[];
  note?: string; // <--- Añadir campo nota
}

interface GestionesStanzaProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  ventas?: Array<{
    id: string;
    pasajero: string;
    email: string;
    numeroTelefono: string;
    paisOrigen: string;
    iata: string;
    pnr: string | null;
    stato: string;
  }>;
}

// Configuración de límites por tipo de habitación
const LIMITES_HABITACION: Record<TipoHabitacion, { min: number; max: number; icon: string }> = {
  'Singola': { min: 1, max: 1, icon: '👤' },
  'Doppia': { min: 1, max: 2, icon: '👥' },
  'Matrimoniale': { min: 1, max: 2, icon: '💑' },
  'Tripla': { min: 1, max: 3, icon: '👨‍👩‍👦' },
  'Suite': { min: 1, max: 4, icon: '🏰' },
  'Family Room': { min: 2, max: 6, icon: '👨‍👩‍👧‍👦' },
};

// Colores para cada tipo de habitación
const COLORES_HABITACION: Record<TipoHabitacion, { bg: string; border: string; text: string }> = {
  'Singola': { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300' },
  'Doppia': { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300' },
  'Matrimoniale': { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-700 dark:text-pink-300' },
  'Tripla': { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300' },
  'Suite': { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
  'Family Room': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300' },
};

export default function GestionesStanza({ isOpen, onClose, tourId, ventas = [] }: GestionesStanzaProps) {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [pasajerosSinAsignar, setPasajerosSinAsignar] = useState<Pasajero[]>([]);
  const [draggedPasajero, setDraggedPasajero] = useState<Pasajero | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<{ type: 'unassigned' | 'room'; roomId?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Estado inicial para comparar cambios
  const [estadoInicial, setEstadoInicial] = useState<string | null>(null);
  // Ref para prevenir guardados simultáneos
  const isSavingRef = useRef(false);
  // Mapa para mantener el orden original de los pasajeros
  const ordenPasajerosRef = useRef<Map<string, number>>(new Map());

  // Convertir ventas a pasajeros manteniendo el orden original
  const todosLosPasajeros = useMemo(() => {
    const pasajeros = ventas.map((venta, index) => {
      // Guardar el orden original en el mapa
      ordenPasajerosRef.current.set(venta.id, index);
      return {
        id: venta.id,
        nombre: venta.pasajero,
        email: venta.email,
        telefono: venta.numeroTelefono,
        paisOrigen: venta.paisOrigen,
        iata: venta.iata,
        pnr: venta.pnr,
        estado: venta.stato,
      };
    });
    return pasajeros;
  }, [ventas]);

  // Cargar habitaciones desde la BD cuando se abre el modal
  useEffect(() => {
    const loadStanze = async () => {
      if (!isOpen || !tourId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/tour-aereo/${tourId}/stanze`);

        if (response.ok) {
          const data = await response.json();
          const stanze = data.stanze || [];

          // Convertir las habitaciones de la BD al formato del componente
          const habitacionesCargadas: Habitacion[] = stanze.map((stanza: any) => ({
            id: stanza.id,
            tipo: stanza.tipo === 'FamilyRoom' ? 'Family Room' : stanza.tipo,
            note: stanza.note || '', // <--- Cargar nota de la BD
            pasajeros: stanza.asignaciones.map((asignacion: any) => ({
              id: asignacion.ventaTourAereo.id,
              nombre: asignacion.ventaTourAereo.pasajero,
              email: asignacion.ventaTourAereo.email,
              telefono: asignacion.ventaTourAereo.numeroTelefono,
              paisOrigen: asignacion.ventaTourAereo.paisOrigen,
              iata: asignacion.ventaTourAereo.iata,
              pnr: asignacion.ventaTourAereo.pnr,
              estado: asignacion.ventaTourAereo.stato,
            })),
          }));

          setHabitaciones(habitacionesCargadas);

          // Calcular pasajeros sin asignar manteniendo el orden original
          const pasajerosAsignadosIds = new Set(
            habitacionesCargadas.flatMap(h => h.pasajeros.map(p => p.id))
          );
          const sinAsignar = todosLosPasajeros
            .filter(p => !pasajerosAsignadosIds.has(p.id))
            .sort((a, b) => {
              // Mantener el orden original basado en el índice guardado
              const ordenA = ordenPasajerosRef.current.get(a.id) ?? Infinity;
              const ordenB = ordenPasajerosRef.current.get(b.id) ?? Infinity;
              return ordenA - ordenB;
            });
          setPasajerosSinAsignar(sinAsignar);

          // Guardar estado inicial para comparar cambios
          const estadoInicialData = JSON.stringify({
            habitaciones: habitacionesCargadas.map(h => ({
              tipo: h.tipo,
              pasajeros: h.pasajeros.map(p => p.id).sort(),
              note: h.note || '', // <--- Sincronizar nota en estado inicial
            })).sort((a, b) => a.tipo.localeCompare(b.tipo)),
          });
          setEstadoInicial(estadoInicialData);
        } else {
          // Si no hay habitaciones guardadas, inicializar con todos los pasajeros sin asignar
          // Mantener el orden original
          const pasajerosOrdenados = [...todosLosPasajeros].sort((a, b) => {
            const ordenA = ordenPasajerosRef.current.get(a.id) ?? Infinity;
            const ordenB = ordenPasajerosRef.current.get(b.id) ?? Infinity;
            return ordenA - ordenB;
          });
          setHabitaciones([]);
          setPasajerosSinAsignar(pasajerosOrdenados);
          // Guardar estado inicial vacío
          setEstadoInicial(JSON.stringify({ habitaciones: [] }));
        }
      } catch (error) {
        console.error('Error loading stanze:', error);
        // En caso de error, inicializar con todos los pasajeros sin asignar
        // Mantener el orden original
        const pasajerosOrdenados = [...todosLosPasajeros].sort((a, b) => {
          const ordenA = ordenPasajerosRef.current.get(a.id) ?? Infinity;
          const ordenB = ordenPasajerosRef.current.get(b.id) ?? Infinity;
          return ordenA - ordenB;
        });
        setHabitaciones([]);
        setPasajerosSinAsignar(pasajerosOrdenados);
        // Guardar estado inicial vacío
        setEstadoInicial(JSON.stringify({ habitaciones: [] }));
      } finally {
        setLoading(false);
      }
    };

    loadStanze();
  }, [isOpen, tourId, todosLosPasajeros]);

  // Calcular pasajeros realmente sin asignar (excluyendo los que están en habitaciones)
  // Mantener el orden original
  const pasajerosDisponibles = useMemo(() => {
    const pasajerosAsignadosIds = new Set(
      habitaciones.flatMap(h => h.pasajeros.map(p => p.id))
    );
    return pasajerosSinAsignar
      .filter(p => !pasajerosAsignadosIds.has(p.id))
      .sort((a, b) => {
        // Mantener el orden original basado en el índice guardado
        const ordenA = ordenPasajerosRef.current.get(a.id) ?? Infinity;
        const ordenB = ordenPasajerosRef.current.get(b.id) ?? Infinity;
        return ordenA - ordenB;
      });
  }, [pasajerosSinAsignar, habitaciones]);

  // Función para crear una nueva habitación
  const crearHabitacion = (tipo: TipoHabitacion) => {
    const nuevaHabitacion: Habitacion = {
      id: `temp-${Date.now()}`, // ID temporal, se reemplazará cuando se guarde
      tipo,
      pasajeros: [],
    };
    setHabitaciones(prev => [...prev, nuevaHabitacion]);
  };

  // Función para eliminar una habitación
  const eliminarHabitacion = (habitacionId: string) => {
    const habitacion = habitaciones.find(h => h.id === habitacionId);
    if (habitacion) {
      // Mover pasajeros de vuelta a sin asignar manteniendo el orden
      setPasajerosSinAsignar(prev => {
        const nuevosPasajeros = [...prev, ...habitacion.pasajeros];
        // Ordenar manteniendo el orden original
        return nuevosPasajeros.sort((a, b) => {
          const ordenA = ordenPasajerosRef.current.get(a.id) ?? Infinity;
          const ordenB = ordenPasajerosRef.current.get(b.id) ?? Infinity;
          return ordenA - ordenB;
        });
      });
      setHabitaciones(prev => prev.filter(h => h.id !== habitacionId));
    }
  };

  // Función para mover pasajero a una habitación
  const moverPasajeroA = (pasajero: Pasajero, habitacionId: string) => {
    const habitacion = habitaciones.find(h => h.id === habitacionId);
    if (!habitacion) return;

    const limite = LIMITES_HABITACION[habitacion.tipo];
    if (habitacion.pasajeros.length >= limite.max) {
      alert(`La habitación ${habitacion.tipo} ya tiene el máximo de ${limite.max} pasajero(s)`);
      return;
    }

    // Remover de origen
    if (draggedFrom?.type === 'unassigned') {
      setPasajerosSinAsignar(prev => prev.filter(p => p.id !== pasajero.id));
    } else if (draggedFrom?.roomId) {
      setHabitaciones(prev => prev.map(h =>
        h.id === draggedFrom.roomId
          ? { ...h, pasajeros: h.pasajeros.filter(p => p.id !== pasajero.id) }
          : h
      ));
    }

    // Agregar a destino
    setHabitaciones(prev => prev.map(h =>
      h.id === habitacionId
        ? { ...h, pasajeros: [...h.pasajeros, pasajero] }
        : h
    ));

    setDraggedPasajero(null);
    setDraggedFrom(null);
  };

  // Función para mover pasajero a sin asignar
  const moverPasajeroASinAsignar = (pasajero: Pasajero) => {
    if (draggedFrom?.roomId) {
      setHabitaciones(prev => prev.map(h =>
        h.id === draggedFrom.roomId
          ? { ...h, pasajeros: h.pasajeros.filter(p => p.id !== pasajero.id) }
          : h
      ));
      setPasajerosSinAsignar(prev => {
        const nuevosPasajeros = [...prev, pasajero];
        // Ordenar manteniendo el orden original
        return nuevosPasajeros.sort((a, b) => {
          const ordenA = ordenPasajerosRef.current.get(a.id) ?? Infinity;
          const ordenB = ordenPasajerosRef.current.get(b.id) ?? Infinity;
          return ordenA - ordenB;
        });
      });
    }
    setDraggedPasajero(null);
    setDraggedFrom(null);
  };

  // Función para comparar el estado actual con el inicial
  const hayCambios = useCallback(() => {
    if (!estadoInicial) return false; // Si no hay estado inicial, no guardar (aún está cargando)

    // Preparar el estado actual para comparar
    const estadoActual = JSON.stringify({
      habitaciones: habitaciones.map(h => ({
        tipo: h.tipo,
        pasajeros: h.pasajeros.map(p => p.id).sort(),
        note: h.note || '', // <--- Comparar con nota
      })).sort((a, b) => a.tipo.localeCompare(b.tipo)),
    });

    return estadoActual !== estadoInicial;
  }, [habitaciones, estadoInicial]);

  // Función para guardar las habitaciones en la BD
  const guardarStanze = useCallback(async () => {
    if (!isOpen || loading || saving) return;

    // Solo guardar si hay cambios reales
    if (!hayCambios()) {
      return;
    }

    // Prevenir guardados simultáneos
    if (isSavingRef.current) {
      console.log('Ya hay un guardado en progreso, ignorando...');
      return;
    }

    try {
      isSavingRef.current = true;
      setSaving(true);

      // Preparar los datos para enviar
      const habitacionesParaGuardar = habitaciones.map(habitacion => ({
        tipo: habitacion.tipo === 'Family Room' ? 'FamilyRoom' : habitacion.tipo,
        note: habitacion.note || '', // <--- Enviar nota a la API
        pasajeros: habitacion.pasajeros.map(p => p.id),
      }));

      const response = await fetch(`/api/tour-aereo/${tourId}/stanze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitaciones: habitacionesParaGuardar,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar las habitaciones');
      }

      const data = await response.json();

      // Actualizar los IDs de las habitaciones con los IDs reales de la BD
      if (data.stanze && data.stanze.length > 0) {
        const habitacionesActualizadas: Habitacion[] = data.stanze.map((stanza: any) => ({
          id: stanza.id,
          tipo: stanza.tipo === 'FamilyRoom' ? 'Family Room' : stanza.tipo,
          note: stanza.note || '', // <--- Recuperar nota de la respuesta
          pasajeros: stanza.asignaciones
            .map((asignacion: any) => ({
              id: asignacion.ventaTourAereo.id,
              nombre: asignacion.ventaTourAereo.pasajero,
              email: asignacion.ventaTourAereo.email,
              telefono: asignacion.ventaTourAereo.numeroTelefono,
              paisOrigen: asignacion.ventaTourAereo.paisOrigen,
              iata: asignacion.ventaTourAereo.iata,
              pnr: asignacion.ventaTourAereo.pnr,
              estado: asignacion.ventaTourAereo.stato,
            }))
            .sort((a: Pasajero, b: Pasajero) => {
              // Mantener el orden original basado en el índice guardado
              const ordenA = ordenPasajerosRef.current.get(a.id) ?? Infinity;
              const ordenB = ordenPasajerosRef.current.get(b.id) ?? Infinity;
              return ordenA - ordenB;
            }),
        }));
        setHabitaciones(habitacionesActualizadas);

        // Actualizar pasajeros sin asignar manteniendo el orden
        const pasajerosAsignadosIds = new Set(
          habitacionesActualizadas.flatMap(h => h.pasajeros.map(p => p.id))
        );
        const sinAsignar = todosLosPasajeros
          .filter(p => !pasajerosAsignadosIds.has(p.id))
          .sort((a, b) => {
            const ordenA = ordenPasajerosRef.current.get(a.id) ?? Infinity;
            const ordenB = ordenPasajerosRef.current.get(b.id) ?? Infinity;
            return ordenA - ordenB;
          });
        setPasajerosSinAsignar(sinAsignar);

        // Actualizar el estado inicial con el nuevo estado guardado
        const nuevoEstadoInicial = JSON.stringify({
          habitaciones: habitacionesActualizadas.map(h => ({
            tipo: h.tipo,
            pasajeros: h.pasajeros.map(p => p.id).sort(),
            note: h.note || '', // <--- Sincronizar nota en estado inicial
          })).sort((a, b) => a.tipo.localeCompare(b.tipo)),
        });
        setEstadoInicial(nuevoEstadoInicial);
      }
    } catch (error) {
      console.error('Error saving stanze:', error);
      // No mostrar alert para no interrumpir la experiencia del usuario
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  }, [habitaciones, isOpen, loading, saving, tourId, hayCambios]);

  // Ya no guardamos automáticamente - el usuario debe hacer clic en "Guardar"

  // Handlers para drag and drop
  const handleDragStart = (pasajero: Pasajero, from: { type: 'unassigned' | 'room'; roomId?: string }) => {
    setDraggedPasajero(pasajero);
    setDraggedFrom(from);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, habitacionId?: string) => {
    e.preventDefault();
    if (!draggedPasajero) return;

    if (habitacionId) {
      moverPasajeroA(draggedPasajero, habitacionId);
    } else {
      moverPasajeroASinAsignar(draggedPasajero);
    }
  };

  // Agrupar habitaciones por tipo
  const habitacionesPorTipo = useMemo(() => {
    const grupos: Record<TipoHabitacion, Habitacion[]> = {
      'Singola': [],
      'Doppia': [],
      'Matrimoniale': [],
      'Tripla': [],
      'Suite': [],
      'Family Room': [],
    };

    habitaciones.forEach(habitacion => {
      grupos[habitacion.tipo].push(habitacion);
    });

    return grupos;
  }, [habitaciones]);

  // Función para exportar a Excel
  const handleExportToExcel = () => {
    const dataToExport: any[] = [];

    // Agregar cada habitación con sus pasajeros
    habitaciones.forEach((habitacion, index) => {
      if (habitacion.pasajeros.length === 0) {
        // Si la habitación está vacía, agregar una fila indicando que está vacía
        dataToExport.push({
          'Tipo Stanza': habitacion.tipo,
          'Nota': habitacion.note || '', // <--- Incluir Nota
          'Passeggero': '(Vuota)',
          'Telefono': '',
        });
      } else {
        // Agregar cada pasajero de la habitación
        habitacion.pasajeros.forEach((pasajero, pasajeroIndex) => {
          dataToExport.push({
            'Tipo Stanza': pasajeroIndex === 0 ? habitacion.tipo : '',
            'Nota': pasajeroIndex === 0 ? (habitacion.note || '') : '', // <--- Incluir Nota
            'Passeggero': pasajero.nombre,
            'Telefono': pasajero.telefono,
          });
        });
      }
    });

    // Si hay pasajeros sin asignar, agregarlos al final
    if (pasajerosDisponibles.length > 0) {
      dataToExport.push({
        'Tipo Stanza': '---',
        'Passeggero': '---',
        'Telefono': '---',
      });
      dataToExport.push({
        'Tipo Stanza': 'SENZA STANZA',
        'Passeggero': '',
        'Telefono': '',
      });
      pasajerosDisponibles.forEach((pasajero) => {
        dataToExport.push({
          'Tipo Stanza': '',
          'Passeggero': pasajero.nombre,
          'Telefono': pasajero.telefono,
        });
      });
    }

    // Crear el workbook y worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Organizzazione Stanze');

    // Generar nombre del archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `Organizzazione_Stanze_${fecha}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(wb, fileName);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop con blur */}
      <div
        className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] z-[9999999998]"
        onClick={onClose}
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isFullscreen={true}
        className="bg-white dark:bg-gray-900 flex flex-col overflow-hidden p-0"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Encabezado fijo - Título, barra de herramientas y pasajeros sin asignar */}
          <div className="flex-shrink-0 p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            {/* Título */}
            <div className="mb-4 px-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Gestione Stanze - Organizzazione Passeggeri
              </h2>
            </div>

            {!loading && (
              <>
                {/* Barra de herramientas */}
                <div className="mb-3 flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Crea nuova stanza:
                  </span>
                  {Object.keys(LIMITES_HABITACION).map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => crearHabitacion(tipo as TipoHabitacion)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${COLORES_HABITACION[tipo as TipoHabitacion].bg
                        } ${COLORES_HABITACION[tipo as TipoHabitacion].border} border ${COLORES_HABITACION[tipo as TipoHabitacion].text
                        } hover:opacity-80`}
                    >
                      <span className="mr-1">{LIMITES_HABITACION[tipo as TipoHabitacion].icon}</span>
                      {tipo}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      {hayCambios() && !saving && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          Cambios sin guardar
                        </span>
                      )}
                      {saving && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Salvando...
                        </span>
                      )}
                      <button
                        onClick={guardarStanze}
                        disabled={!hayCambios() || saving || loading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md text-xs font-medium ${hayCambios() && !saving && !loading
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          }`}
                        title={hayCambios() ? 'Guardar cambios' : 'No hay cambios para guardar'}
                      >
                        <Save className="w-4 h-4" />
                        Guardar
                      </button>
                    </div>
                    <button
                      onClick={handleExportToExcel}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md text-xs font-medium"
                      title="Esporta organizzazione stanze in Excel"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Excel
                    </button>
                  </div>
                </div>

                {/* Pasajeros sin asignar - Con scroll propio */}
                <div className="mb-3">
                  <div
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                        Passeggeri senza stanza ({pasajerosDisponibles.length})
                      </h3>
                    </div>
                    <div className="max-h-[120px] overflow-y-auto overflow-x-hidden">
                      <div className="flex flex-wrap gap-1.5">
                        {pasajerosDisponibles.map((pasajero) => (
                          <div
                            key={pasajero.id}
                            draggable
                            onDragStart={() => handleDragStart(pasajero, { type: 'unassigned' })}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm cursor-move hover:shadow-md transition-shadow"
                          >
                            <GripVertical className="w-3 h-3 text-gray-400" />
                            <p className="text-xs font-medium text-gray-900 dark:text-white">
                              {pasajero.nombre}
                            </p>
                          </div>
                        ))}
                        {pasajerosDisponibles.length === 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Nessun passeggero senza stanza
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Contenido con scroll - Solo las habitaciones */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3" style={{ minHeight: 0 }}>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Caricamento organizzazione stanze...</p>
              </div>
            ) : (
              <>

                {/* Habitaciones organizadas por tipo */}
                <div className="space-y-3">
                  {Object.entries(habitacionesPorTipo).map(([tipo, habitacionesTipo]) => {
                    if (habitacionesTipo.length === 0) return null;

                    const limite = LIMITES_HABITACION[tipo as TipoHabitacion];
                    const color = COLORES_HABITACION[tipo as TipoHabitacion];

                    return (
                      <div key={tipo} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-sm font-semibold ${color.text} flex items-center gap-1.5`}>
                            <span className="text-base">{limite.icon}</span>
                            {tipo} ({habitacionesTipo.length} stanza{habitacionesTipo.length !== 1 ? 'e' : 'a'})
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Capacità: {limite.min}-{limite.max} passeggero{limite.max !== 1 ? 'i' : ''}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                          {habitacionesTipo.map((habitacion) => (
                            <div
                              key={habitacion.id}
                              className={`${color.bg} ${color.border} border-2 rounded-lg p-2`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, habitacion.id)}
                            >
                              {/* Header de la habitación */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">{limite.icon}</span>
                                  <div>
                                    <p className={`text-xs font-semibold ${color.text}`}>
                                      {tipo}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {habitacion.pasajeros.length}/{limite.max}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => eliminarHabitacion(habitacion.id)}
                                  className="p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Elimina stanza"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Nota de la habitación */}
                              <div className="mb-2">
                                <input
                                  type="text"
                                  value={habitacion.note || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setHabitaciones(prev => prev.map(h =>
                                      h.id === habitacion.id ? { ...h, note: val } : h
                                    ));
                                  }}
                                  placeholder="Nota (ej: Amici, Coppia...)"
                                  className="w-full px-2 py-1 text-[10px] bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded focus:border-blue-400 outline-none transition-colors"
                                />
                              </div>

                              {/* Lista de pasajeros en la habitación */}
                              <div className="space-y-1">
                                {habitacion.pasajeros.map((pasajero) => (
                                  <div
                                    key={pasajero.id}
                                    draggable
                                    onDragStart={() => handleDragStart(pasajero, { type: 'room', roomId: habitacion.id })}
                                    className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 cursor-move hover:shadow-sm transition-shadow"
                                  >
                                    <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                                      {pasajero.nombre}
                                    </p>
                                  </div>
                                ))}
                                {habitacion.pasajeros.length === 0 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-2">
                                    Trascina i passeggeri qui
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mensaje si no hay habitaciones */}
                {habitaciones.length === 0 && (
                  <div className="text-center py-6">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nessuna stanza creata. Crea una nuova stanza per iniziare.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </>,
    document.body
  );
}

