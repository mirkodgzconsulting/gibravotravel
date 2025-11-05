"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import PassengerDetailsTable from "@/components/PassengerDetailsTable";
import PassengerDetailsTableSimple from "@/components/PassengerDetailsTableSimple";
import * as XLSX from 'xlsx';
import { cachedFetch } from "@/utils/cachedFetch";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ==================== INTERFACES ====================

interface Cuota {
  id: string;
  numeroCuota: number;
  data: string | null;
  prezzo: number;
  note: string | null;
  isPagato: boolean;
  attachedFile: string | null;
  attachedFileName: string | null;
}

interface PasajeroData {
  id?: string;
  nombrePasajero: string;
  servicios: string[]; // Array de servicios seleccionados
  andata: string;
  ritorno: string;
  iata: string; // IATA para Biglietteria (compatibilidad)
  iataBiglietteria: string; // IATA específico para Biglietteria
  iataExpress: string; // IATA específico para Express
  iataPolizza: string; // IATA específico para Polizza
  iataLetteraInvito: string; // IATA específico para Lettera di Invito
  iataHotel: string; // IATA específico para Hotel
  netoBiglietteria: string;
  vendutoBiglietteria: string;
  tieneExpress: boolean;
  netoExpress: string;
  vendutoExpress: string;
  tienePolizza: boolean;
  netoPolizza: string;
  vendutoPolizza: string;
  tieneLetteraInvito: boolean;
  netoLetteraInvito: string;
  vendutoLetteraInvito: string;
  tieneHotel: boolean;
  netoHotel: string;
  vendutoHotel: string;
  // Campos dinámicos para servicios adicionales (no incluidos en los anteriores)
  serviciosData?: Record<string, { iata: string; neto: string; venduto: string }>;
}

interface BiglietteriaRecord {
  id: string;
  pagamento: string;
  data: string;
  pnr: string | null;
  itinerario: string;
  metodoPagamento: string[]; // Array de métodos de pago
  metodoPagamentoParsed?: string[]; // OPTIMIZACIÓN: Pre-parseado para evitar JSON.parse en filtro
  notaDiVendita: string | null;
  netoPrincipal: number;
  vendutoTotal: number;
  acconto: number;
  daPagare: number;
  feeAgv: number;
  cliente: string;
  codiceFiscale: string;
  indirizzo: string;
  email: string;
  numeroTelefono: string;
  creadoPor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  numeroPasajeros: number;
  numeroCuotas: number | null;
  attachedFile: string | null;
  attachedFileName: string | null;
  pasajeros: PasajeroData[];
  cuotas: Cuota[];
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  address: string;
  email: string;
  phoneNumber: string;
  birthDate?: string;
  document1?: string;
  document1Name?: string;
  document2?: string;
  document2Name?: string;
  document3?: string;
  document3Name?: string;
  document4?: string;
  document4Name?: string;
}

interface BiglietteriaFormData {
  cliente: string;
  codiceFiscale: string;
  indirizzo: string;
  email: string;
  numeroTelefono: string;
  pagamento: string;
  data: string;
  pnr: string;
  itinerario: string;
  metodoPagamento: string[]; // Array de métodos de pago
  notaDiVendita: string;
  numeroPasajeros: number;
  pasajeros: PasajeroData[];
  netoPrincipal: string;
  vendutoTotal: string;
  acconto: string;
  daPagare: string;
  feeAgv: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

export default function BiglietteriaPage() {
  const { canAccessGestione, isLoading: roleLoading, userRole, isUser } = useUserRole();
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();
  
  // Estados principales
  const [records, setRecords] = useState<BiglietteriaRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados para edición y eliminación
  const [editingRecord, setEditingRecord] = useState<BiglietteriaRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  
  // Estados para visualización de archivos
  const [viewingFiles, setViewingFiles] = useState<BiglietteriaRecord | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Estados para modal de cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Estados para tabla de detalles de pasajeros
  const [isPassengerDetailsOpen, setIsPassengerDetailsOpen] = useState(false);
  const [isPassengerDetailsSimpleOpen, setIsPassengerDetailsSimpleOpen] = useState(false);
  
  // Estado para edición inline de Pagamento
  const [editingPagamentoId, setEditingPagamentoId] = useState<string | null>(null);
  
  // Estados para filtro de fechas
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  
  // Estado para filtro de usuario creador
  const [filtroCreador, setFiltroCreador] = useState<string>('');
  const [usuarios, setUsuarios] = useState<Array<{ clerkId: string; firstName: string; lastName: string; role: string }>>([]);
  const [showCreadorDropdown, setShowCreadorDropdown] = useState<boolean>(false);
  
  // Estados para filtro de pagamento
  const [filtroPagamento, setFiltroPagamento] = useState<string>('');
  const [pagamentos, setPagamentos] = useState<string[]>([]);
  
  // Estados para IATA y MetodoPagamento
  const [iataList, setIataList] = useState<string[]>([]);
  const [metodoPagamentoList, setMetodoPagamentoList] = useState<string[]>([]);
  
  // Estados para búsqueda y paginación (igual que TOUR GRUPPO)
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Estados para filtros (igual que TOUR GRUPPO) - creadorSearchTerm
  const [creadorSearchTerm, setCreadorSearchTerm] = useState('');
  
  // Estados para cliente dropdown
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  // Estados para pagamento dropdown (igual que cliente)
  const [showPagamentoDropdown, setShowPagamentoDropdown] = useState(false);
  const [pagamentoSearchTerm, setPagamentoSearchTerm] = useState('');
  
  // Estados para IATA dropdown (igual que cliente)
  const [showIataDropdown, setShowIataDropdown] = useState(false);
  const [iataSearchTerm, setIataSearchTerm] = useState('');
  
  // Estados para dropdowns individuales de IATA por pasajero y servicio
  const [showIndividualIataDropdowns, setShowIndividualIataDropdowns] = useState<{[key: string]: boolean}>({});
  const [individualIataSearchTerms, setIndividualIataSearchTerms] = useState<{[key: string]: string}>({});
  
  // Estados para MetodoPagamento dropdown (igual que cliente)
  const [showMetodoPagamentoDropdown, setShowMetodoPagamentoDropdown] = useState(false);
  const [metodoPagamentoSearchTerm, setMetodoPagamentoSearchTerm] = useState('');
  
  // Estados para servicios dropdown
  const [showServiziDropdowns, setShowServiziDropdowns] = useState<boolean[]>([]);
  const [showServiziDropdown, setShowServiziDropdown] = useState<number | null>(null);
  
  // Estados para servicios
  const [servizi, setServizi] = useState<Array<{ id: string; servizio: string; isActive: boolean }>>([]);
  
  // Función para filtrar clientes basado en la búsqueda
  const filteredClients = clients && Array.isArray(clients) ? clients.filter(client => 
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.fiscalCode.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
  ) : [];
  
  // Función para filtrar pagamentos basado en la búsqueda (igual que clientes)
  const filteredPagamentos = pagamentos && Array.isArray(pagamentos) ? pagamentos.filter(pagamento => 
    pagamento.toLowerCase().includes(pagamentoSearchTerm.toLowerCase())
  ) : [];
  
  // Función para filtrar IATA basado en la búsqueda (igual que clientes)
  const filteredIata = iataList && Array.isArray(iataList) ? iataList.filter(iata => 
    iata.toLowerCase().includes(iataSearchTerm.toLowerCase())
  ) : [];
  
  // Función para filtrar MetodoPagamento basado en la búsqueda (igual que clientes)
  const filteredMetodoPagamento = metodoPagamentoList && Array.isArray(metodoPagamentoList) ? metodoPagamentoList.filter(metodo => 
    metodo.toLowerCase().includes(metodoPagamentoSearchTerm.toLowerCase())
  ) : [];
  
  // Estados para archivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Estados para modal de detalles
  const [viewingDetails, setViewingDetails] = useState<BiglietteriaRecord | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Estados para funcionalidades de tabla
  const [loadingClientData, setLoadingClientData] = useState(false);
  
  // Estados para cuotas - REPLICANDO LÓGICA DE TOUR GRUPPO
  const [numeroCuotas, setNumeroCuotas] = useState<number>(0);
  const [cuotas, setCuotas] = useState<Array<{ 
    id?: string;
    numeroCuota: number; 
    data: string; 
    prezzo: string; 
    note: string; 
    file: File | null;
    attachedFile?: string | null;
    attachedFileName?: string | null;
  }>>([]);
  
  // Estado para control de carga de cuotas en edición - REPLICANDO TOUR GRUPPO
  const [isLoadingCuotas, setIsLoadingCuotas] = useState(false);
  const cuotasInicializadas = useRef(false);
  

  // Manejar cambio de número de cuotas - REPLICANDO LÓGICA DE TOUR GRUPPO
  useEffect(() => {
    // No sobrescribir cuotas si estamos cargando desde edición
    if (isLoadingCuotas) {
      return;
    }
    
    // Si ya fueron inicializadas, no volver a crear cuotas vacías
    if (cuotasInicializadas.current && numeroCuotas > 0) {
      return;
    }
    
    if (numeroCuotas > 0) {
      const nuevasCuotas = Array.from({ length: numeroCuotas }, (_, i) => ({
        numeroCuota: i + 1,
        data: '',
        prezzo: '',
        note: '',
        file: null
      }));
      setCuotas(nuevasCuotas);
      cuotasInicializadas.current = true;
    } else {
      setCuotas([]);
      cuotasInicializadas.current = false;
    }
  }, [numeroCuotas, isLoadingCuotas]);
  
  // Constantes - ahora se obtienen de la base de datos
  const serviciosDisponibles = servizi.map(s => s.servizio);
  
  const additionalCostServices = ['EXPRESS', 'POLIZZA', 'LETTERA D\'INVITO', 'HOTEL'];
  
  // ==================== FUNCIONES AUXILIARES ====================
  
  // Servicios conocidos que tienen campos específicos en la interfaz
  const serviciosConocidos = ['BIGLIETTERIA', 'EXPRESS', 'POLIZZA', 'LETTERA D\'INVITO', 'HOTEL'];
  
  // Función para normalizar el nombre del servicio (para comparaciones)
  const normalizarServicio = (servicio: string): string => {
    return servicio.toUpperCase().trim();
  };
  
  // Función para verificar si un servicio es conocido
  const esServicioConocido = (servicio: string): boolean => {
    const normalizado = normalizarServicio(servicio);
    return serviciosConocidos.some(conocido => 
      normalizado.includes(conocido) || conocido.includes(normalizado)
    );
  };
  
  // Función para obtener servicios que requieren campos dinámicos
  const obtenerServiciosDinamicos = (servicios: string[]): string[] => {
    return servicios.filter(s => !esServicioConocido(s));
  };
  
  // OPTIMIZACIÓN: Helper para pre-parsear metodoPagamento en registros
  const processRecord = useCallback((record: any): BiglietteriaRecord => {
    return {
      ...record,
      metodoPagamentoParsed: (() => {
        try {
          const parsed = typeof record.metodoPagamento === 'string' 
            ? JSON.parse(record.metodoPagamento) 
            : record.metodoPagamento;
          return Array.isArray(parsed) ? parsed : [record.metodoPagamento];
        } catch {
          return [record.metodoPagamento];
        }
      })()
    };
  }, []);

  // Función para crear un pasajero vacío
  const crearPasajeroVacio = (): PasajeroData => ({
    nombrePasajero: '',
    servicios: [],
    andata: '',
    ritorno: '',
    iata: '', // Mantener para compatibilidad
    iataBiglietteria: '',
    iataExpress: '',
    iataPolizza: '',
    iataLetteraInvito: '',
    iataHotel: '',
    netoBiglietteria: '',
    vendutoBiglietteria: '',
    tieneExpress: false,
    netoExpress: '',
    vendutoExpress: '',
    tienePolizza: false,
    netoPolizza: '',
    vendutoPolizza: '',
    tieneLetteraInvito: false,
    netoLetteraInvito: '',
    vendutoLetteraInvito: '',
    tieneHotel: false,
    netoHotel: '',
    vendutoHotel: '',
    serviciosData: {}
  });
  
  // Función para verificar si tiene Biglietteria
  const tieneBiglietteria = (servicios: string[]) => {
    return servicios.some(s => s.toLowerCase().includes('biglietteria'));
  };
  
  // Función para verificar si tiene servicios adicionales (cualquier servicio excepto Biglietteria)
  const tieneServiciosAdicionales = (servicios: string[]) => {
    return servicios.some(s => !tieneBiglietteria([s]));
  };
  
  // Función para verificar si tiene servicios que NO son adicionales
  const tieneServiciosNoAdicionales = (servicios: string[]) => {
    const hasBiglietteria = tieneBiglietteria(servicios);
    const hasAdicionales = tieneServiciosAdicionales(servicios);
    
    if (hasBiglietteria && hasAdicionales) {
      // Si tiene Biglietteria + servicios adicionales
      return { showDateFields: true, showBiglietteriaFields: true, showAdditionalServiceFields: true };
    } else if (hasBiglietteria && !hasAdicionales) {
      // Si solo tiene Biglietteria + otros servicios (no adicionales)
      return { showDateFields: true, showBiglietteriaFields: true, showAdditionalServiceFields: false };
    } else if (!hasBiglietteria && hasAdicionales) {
      // Si solo tiene servicios adicionales (sin Biglietteria)
      return { showDateFields: false, showBiglietteriaFields: false, showAdditionalServiceFields: true };
    } else {
      // Si no tiene servicios
      return { showDateFields: false, showBiglietteriaFields: false, showAdditionalServiceFields: false };
    }
  };
  
  // Función para determinar qué campos mostrar para un pasajero
  const shouldShowFieldsForPasajero = (pasajero: PasajeroData) => {
    return tieneServiciosNoAdicionales(pasajero.servicios);
  };
  
  // Estado del formulario
  const [formData, setFormData] = useState<BiglietteriaFormData>({
    cliente: '',
    codiceFiscale: '',
    indirizzo: '',
    email: '',
    numeroTelefono: '',
    pagamento: '',
    data: new Date().toISOString().split('T')[0],
    pnr: '',
    itinerario: '',
    metodoPagamento: [], // Array de métodos de pago
    notaDiVendita: '',
    numeroPasajeros: 1,
    pasajeros: [crearPasajeroVacio()],
    netoPrincipal: '',
    vendutoTotal: '',
    acconto: '',
    daPagare: '',
    feeAgv: ''
  });
  
  // Función para calcular totales
  const calcularTotales = useCallback(() => {
    let netoPrincipal = 0;
    let vendutoTotal = 0;
    
    formData.pasajeros.forEach(pasajero => {
      // Sumar Biglietteria
      if (pasajero.netoBiglietteria) netoPrincipal += parseFloat(pasajero.netoBiglietteria) || 0;
      if (pasajero.vendutoBiglietteria) vendutoTotal += parseFloat(pasajero.vendutoBiglietteria) || 0;
      
      // Sumar servicios adicionales
      if (pasajero.tieneExpress) {
        if (pasajero.netoExpress) netoPrincipal += parseFloat(pasajero.netoExpress) || 0;
        if (pasajero.vendutoExpress) vendutoTotal += parseFloat(pasajero.vendutoExpress) || 0;
      }
      if (pasajero.tienePolizza) {
        if (pasajero.netoPolizza) netoPrincipal += parseFloat(pasajero.netoPolizza) || 0;
        if (pasajero.vendutoPolizza) vendutoTotal += parseFloat(pasajero.vendutoPolizza) || 0;
      }
      if (pasajero.tieneLetteraInvito) {
        if (pasajero.netoLetteraInvito) netoPrincipal += parseFloat(pasajero.netoLetteraInvito) || 0;
        if (pasajero.vendutoLetteraInvito) vendutoTotal += parseFloat(pasajero.vendutoLetteraInvito) || 0;
      }
      if (pasajero.tieneHotel) {
        if (pasajero.netoHotel) netoPrincipal += parseFloat(pasajero.netoHotel) || 0;
        if (pasajero.vendutoHotel) vendutoTotal += parseFloat(pasajero.vendutoHotel) || 0;
      }
      
      // Sumar servicios dinámicos
      if (pasajero.serviciosData) {
        Object.values(pasajero.serviciosData).forEach((servicioData) => {
          if (servicioData.neto) netoPrincipal += parseFloat(servicioData.neto) || 0;
          if (servicioData.venduto) vendutoTotal += parseFloat(servicioData.venduto) || 0;
        });
      }
    });
    
    const acconto = parseFloat(formData.acconto) || 0;
    const daPagare = vendutoTotal - acconto;
    const feeAgv = vendutoTotal - netoPrincipal;
    
    return {
      netoPrincipal: netoPrincipal.toFixed(2),
      vendutoTotal: vendutoTotal.toFixed(2),
      daPagare: daPagare.toFixed(2),
      feeAgv: feeAgv.toFixed(2)
    };
  }, [formData.pasajeros, formData.acconto]);
  
  // ==================== EFECTOS ====================
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Inicializar dropdowns de pasajeros
  
  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.client-dropdown-container')) {
        setShowClientDropdown(false);
      }
      if (!target.closest('.pagamento-dropdown-container')) {
        setShowPagamentoDropdown(false);
      }
      if (!target.closest('.iata-dropdown-container')) {
        setShowIataDropdown(false);
      }
      if (!target.closest('.metodo-pagamento-dropdown-container')) {
        setShowMetodoPagamentoDropdown(false);
      }
      // Creador dropdown (para filtros)
      if (!target.closest('.creador-dropdown-container')) {
        setShowCreadorDropdown(false);
      }
      
      // Cerrar todos los dropdowns individuales de IATA si no se está haciendo click en ninguno
      if (!target.closest('.iata-dropdown-container')) {
        setShowIndividualIataDropdowns({});
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [formData.numeroPasajeros]);
  
  // Calcular totales automáticamente cuando cambien los pasajeros o acconto
  useEffect(() => {
    const totales = calcularTotales();
    setFormData(prev => ({
      ...prev,
      netoPrincipal: totales.netoPrincipal,
      vendutoTotal: totales.vendutoTotal,
      daPagare: totales.daPagare,
      feeAgv: totales.feeAgv
    }));
  }, [formData.pasajeros, formData.acconto, calcularTotales]);
  
  // Cargar datos iniciales - OPTIMIZADO: Llamadas paralelas con Promise.all
  const fetchData = useCallback(async () => {
    if (roleLoading) return;
      try {
        setLoading(true);
        
        // OPTIMIZACIÓN: Cargar todas las APIs en paralelo
        const [
          recordsData,
          clientsData,
          serviziData,
          usersData,
          pagamentosData,
          iataData,
          metodoData
        ] = await Promise.all([
          cachedFetch<{ records: any[] }>(`/api/biglietteria${isUser ? '?userOnly=true' : ''}`, { ttlMs: 15000 }),
          cachedFetch<any>(`/api/clients`, { ttlMs: 15000 }).catch(() => ({ clients: [] })),
          cachedFetch<any[]>('/api/servizi', { ttlMs: 15000 }).catch(() => []),
          cachedFetch<any[]>('/api/users', { ttlMs: 15000 }).catch(() => []),
          cachedFetch<any[]>('/api/pagamento', { ttlMs: 15000 }).catch(() => []),
          cachedFetch<any[]>('/api/iata', { ttlMs: 15000 }).catch(() => []),
          cachedFetch<{ metodosPagamento: any[] }>('/api/metodo-pagamento', { ttlMs: 15000 }).catch(() => ({ metodosPagamento: [] }))
        ]);
        
        // Procesar registros y pre-parsear metodoPagamento para evitar JSON.parse en filtro
        const processedRecords = (recordsData.records || []).map(processRecord);
        setRecords(processedRecords);
        
        // Procesar clientes
        const clientsArray = clientsData.clients || clientsData;
        setClients(Array.isArray(clientsArray) ? clientsArray : []);
        
        // Procesar servicios
        setServizi(Array.isArray(serviziData) ? serviziData : []);
        
        // Procesar usuarios
        setUsuarios(Array.isArray(usersData) ? usersData : []);
        
        // Procesar pagamentos
        const pagamentosArray = Array.isArray(pagamentosData) ? pagamentosData : [];
        const pagamentosNombres = pagamentosArray.map((p: any) => p.pagamento);
        setPagamentos(pagamentosNombres);
        
        // Procesar IATA
        const iataArray = Array.isArray(iataData) ? iataData : [];
        const iataNombres = iataArray.map((i: any) => i.iata);
        setIataList(iataNombres);
        
        // Procesar MetodoPagamento
        const metodoPagamentoArray = metodoData.metodosPagamento || [];
        const metodoPagamentoNombres = metodoPagamentoArray.map((m: any) => m.metodoPagamento);
        setMetodoPagamentoList(metodoPagamentoNombres);
        
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    }, [roleLoading, isUser, processRecord]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // ==================== HANDLERS ====================
  
  // Handler para cambiar número de pasajeros
  const handleNumeroPasajerosChange = (numero: number) => {
    const nuevoNumero = Math.max(1, Math.min(20, numero));
    const pasajerosActuales = formData.pasajeros;
    
    let nuevosPasajeros: PasajeroData[];
    if (nuevoNumero > pasajerosActuales.length) {
      // Agregar pasajeros
      nuevosPasajeros = [
        ...pasajerosActuales,
        ...Array(nuevoNumero - pasajerosActuales.length).fill(null).map(() => crearPasajeroVacio())
      ];
    } else {
      // Quitar pasajeros
      nuevosPasajeros = pasajerosActuales.slice(0, nuevoNumero);
    }
    
    // Actualizar el array de dropdowns
    setShowServiziDropdowns(Array(nuevoNumero).fill(false));
    
    setFormData(prev => ({
      ...prev,
      numeroPasajeros: nuevoNumero,
      pasajeros: nuevosPasajeros
    }));
  };
  
  // Handler para actualizar datos de un pasajero
  const handlePasajeroChange = (index: number, field: keyof PasajeroData, value: any) => {
    setFormData(prev => ({
      ...prev,
      pasajeros: prev.pasajeros.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };
  
  // Handler para toggle servicio de un pasajero
  const handleServicioToggle = (index: number, servicio: string) => {
    setFormData(prev => ({
      ...prev,
      pasajeros: prev.pasajeros.map((p, i) => {
        if (i !== index) return p;
        
        // Toggle el servicio
        const servicios = p.servicios.includes(servicio)
          ? p.servicios.filter(s => s !== servicio)
          : [...p.servicios, servicio];
        
        // Determinar qué servicios están activos
        const hasBiglietteria = tieneBiglietteria(servicios);
        const tieneExpress = servicios.some(s => s.toLowerCase().includes('express'));
        const tienePolizza = servicios.some(s => s.toLowerCase().includes('polizza'));
        const tieneLetteraInvito = servicios.some(s => s.toLowerCase().includes('lettera'));
        const tieneHotel = servicios.some(s => s.toLowerCase().includes('hotel'));
        
        // Manejar serviciosData dinámicos
        let serviciosData = { ...(p.serviciosData || {}) };
        
        // Obtener servicios dinámicos actuales
        const serviciosDinamicosActuales = obtenerServiciosDinamicos(servicios);
        const serviciosDinamicosKeys = serviciosDinamicosActuales.map(s => normalizarServicio(s));
        
        // Limpiar serviciosData que ya no están seleccionados
        Object.keys(serviciosData).forEach(key => {
          if (!serviciosDinamicosKeys.includes(key)) {
            delete serviciosData[key];
          }
        });
        
        // Inicializar serviciosData para nuevos servicios dinámicos
        serviciosDinamicosActuales.forEach(servicio => {
          const servicioKey = normalizarServicio(servicio);
          if (!serviciosData[servicioKey]) {
            serviciosData[servicioKey] = { iata: '', neto: '', venduto: '' };
          }
        });
        
        return {
          ...p,
          servicios,
          tieneExpress,
          tienePolizza,
          tieneLetteraInvito,
          tieneHotel,
          serviciosData,
          // Limpiar campos si no aplican
          andata: hasBiglietteria ? p.andata : '',
          ritorno: hasBiglietteria ? p.ritorno : '',
          netoBiglietteria: hasBiglietteria ? p.netoBiglietteria : '',
          vendutoBiglietteria: hasBiglietteria ? p.vendutoBiglietteria : '',
          netoExpress: tieneExpress ? p.netoExpress : '',
          vendutoExpress: tieneExpress ? p.vendutoExpress : '',
          netoPolizza: tienePolizza ? p.netoPolizza : '',
          vendutoPolizza: tienePolizza ? p.vendutoPolizza : '',
          netoLetteraInvito: tieneLetteraInvito ? p.netoLetteraInvito : '',
          vendutoLetteraInvito: tieneLetteraInvito ? p.vendutoLetteraInvito : '',
          netoHotel: tieneHotel ? p.netoHotel : '',
          vendutoHotel: tieneHotel ? p.vendutoHotel : ''
        };
      })
    }));
  };
  
  // Handler para seleccionar cliente
  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setSelectedClientId(clientId);
      setFormData(prev => ({
        ...prev,
        cliente: `${selectedClient.firstName} ${selectedClient.lastName}`,
        codiceFiscale: selectedClient.fiscalCode,
        indirizzo: selectedClient.address,
        email: selectedClient.email,
        numeroTelefono: selectedClient.phoneNumber
      }));
      setShowClientDropdown(false);
      setClientSearchTerm('');
    }
  };
  
  // Handler para seleccionar pagamento (igual que cliente)
  const handlePagamentoSelect = (pagamento: string) => {
    setFormData(prev => ({
      ...prev,
      pagamento: pagamento
    }));
    setShowPagamentoDropdown(false);
    setPagamentoSearchTerm('');
  };
  
  // Handler para seleccionar IATA (igual que cliente)
  const handleIataSelect = (iata: string) => {
    setFormData(prev => ({
      ...prev,
      iata: iata
    }));
    setShowIataDropdown(false);
    setIataSearchTerm('');
  };

  // Funciones para manejar dropdowns individuales de IATA
  const getIndividualIataKey = (pasajeroIndex: number, servicio: string) => {
    return `${pasajeroIndex}-${servicio}`;
  };

  const isIndividualIataDropdownOpen = (pasajeroIndex: number, servicio: string) => {
    const key = getIndividualIataKey(pasajeroIndex, servicio);
    return showIndividualIataDropdowns[key] || false;
  };

  const getIndividualIataSearchTerm = (pasajeroIndex: number, servicio: string) => {
    const key = getIndividualIataKey(pasajeroIndex, servicio);
    return individualIataSearchTerms[key] || '';
  };

  const setIndividualIataDropdown = (pasajeroIndex: number, servicio: string, isOpen: boolean) => {
    const key = getIndividualIataKey(pasajeroIndex, servicio);
    setShowIndividualIataDropdowns(prev => ({
      ...prev,
      [key]: isOpen
    }));
  };

  const setIndividualIataSearchTerm = (pasajeroIndex: number, servicio: string, term: string) => {
    const key = getIndividualIataKey(pasajeroIndex, servicio);
    setIndividualIataSearchTerms(prev => ({
      ...prev,
      [key]: term
    }));
  };

  const handleIndividualIataSelect = (pasajeroIndex: number, servicio: string, iata: string) => {
    // Mapear servicio a campo IATA específico
    const campoIata = servicio === 'EXPRESS' ? 'iataExpress' :
                      servicio === 'POLIZZA' ? 'iataPolizza' :
                      servicio === 'HOTEL' ? 'iataHotel' :
                      servicio === 'LETTERA' || servicio === 'LETTERA D\'INVITO' ? 'iataLetteraInvito' :
                      servicio === 'Biglietteria' || servicio === 'BIGLIETTERIA' ? 'iataBiglietteria' :
                      'iata'; // Fallback para compatibilidad
    
    handlePasajeroChange(pasajeroIndex, campoIata as keyof PasajeroData, iata);
    setIndividualIataDropdown(pasajeroIndex, servicio, false);
    setIndividualIataSearchTerm(pasajeroIndex, servicio, '');
  };

  // Función para filtrar IATA individual
  const getFilteredIndividualIata = (pasajeroIndex: number, servicio: string) => {
    const searchTerm = getIndividualIataSearchTerm(pasajeroIndex, servicio);
    return iataList && Array.isArray(iataList) ? iataList.filter(iata => 
      iata.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];
  };
  
  // Handler para toggle de MetodoPagamento (igual que servicios)
  const handleMetodoPagamentoToggle = (metodo: string) => {
    setFormData(prev => {
      const currentMetodos = prev.metodoPagamento || [];
      const isSelected = currentMetodos.includes(metodo);
      
      if (isSelected) {
        // Remover si ya está seleccionado
        return {
          ...prev,
          metodoPagamento: currentMetodos.filter(m => m !== metodo)
        };
      } else {
        // Agregar si no está seleccionado
        return {
          ...prev,
          metodoPagamento: [...currentMetodos, metodo]
        };
      }
    });
    setMetodoPagamentoSearchTerm('');
  };
  
  // Handler para ver cliente (igual que TOUR GRUPPO)
  const handleClientClick = (clienteName: string) => {
    // Buscar el cliente por nombre completo o código fiscal
    const client = clients.find(c => 
      `${c.firstName} ${c.lastName}` === clienteName || 
      c.fiscalCode === clienteName
    );
    
    if (client) {
      setSelectedClient(client);
      setIsClientModalOpen(true);
    } else {
    }
  };

  
  // Handler para ver archivos (igual que TOUR GRUPPO)
  const handleViewFiles = (record: BiglietteriaRecord) => {
    setViewingFiles(record);
    setIsFileViewerOpen(true);
  };

  // Función para cerrar visor de archivos
  const handleCloseFileViewer = () => {
    setViewingFiles(null);
    setIsFileViewerOpen(false);
  };

  // Función para descargar archivos (igual que TOUR GRUPPO)
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Crear URL temporal para el blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
    } catch (error) {
      console.error('❌ Error al descargar archivo:', error);
      // Fallback: abrir en nueva ventana
      window.open(url, '_blank');
    }
  };
  
  // Función para contar archivos (igual que TOUR GRUPPO)
  const countFiles = (record: BiglietteriaRecord): number => {
    let count = 0;
    if (record.attachedFile) count++;
    if (record.cuotas) {
      count += record.cuotas.filter(c => c.attachedFile).length;
    }
    return count;
  };
  
  // Handler para generar recibo
  const handleGenerateRicevuta = async (recordId: string) => {
    try {
      setMessage({
        type: 'success',
        text: 'Generando ricevuta...'
      });

      const response = await fetch('/api/biglietteria/generate-ricevuta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recordId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al generar ricevuta (${response.status})`);
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extraer el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `Ricevuta_${recordId}_${new Date().getTime()}.pdf`;
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({
        type: 'success',
        text: 'Ricevuta generata con successo!'
      });
    } catch (error) {
      console.error('Error generating ricevuta:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Errore durante la generazione della ricevuta'
      });
    }
  };
  
  // Función para exportar a Excel (igual que TOUR GRUPPO)
  const handleExportToExcel = () => {
    const dataToExport = filteredRecords.map(record => ({
      'Cliente': record.cliente,
      'Codice Fiscale': record.codiceFiscale,
      'Indirizzo': record.indirizzo,
      'Email': record.email,
      'Telefono': record.numeroTelefono,
      'Pagamento': record.pagamento,
      'Data': new Date(record.data).toLocaleDateString('it-IT'),
      'PNR': record.pnr,
      'Passeggeri': record.numeroPasajeros,
      'Itinerario': record.itinerario,
      'Neto': record.netoPrincipal,
      'Venduto': record.vendutoTotal,
      'Acconto': record.acconto,
      'Da Pagare': record.daPagare,
      'Metodo Pagamento': (() => {
        try {
          const parsed = typeof record.metodoPagamento === 'string' 
            ? JSON.parse(record.metodoPagamento) 
            : record.metodoPagamento;
          return Array.isArray(parsed) ? parsed.join(', ') : record.metodoPagamento;
        } catch {
          return record.metodoPagamento;
        }
      })(),
      'Fee AGV': record.feeAgv,
      'Agente': record.creator?.firstName 
        ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ''}`.trim()
        : record.creator?.email || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Biglietteria');
    
    const fileName = `biglietteria_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };
  
  // OPTIMIZACIÓN: Memoizar el cálculo del nombre del creator para evitar re-calcularlo
  const getCreatorName = useCallback((creator: any): string => {
    if (creator?.firstName) {
      return `${creator.firstName}${creator.lastName ? ` ${creator.lastName}` : ''}`.trim();
    }
    return creator?.email || 'N/A';
  }, []);

  // OPTIMIZACIÓN: Memoizar fechas parseadas para evitar crear nuevos Date en cada render
  const fechaDesdeDate = useMemo(() => fechaDesde ? new Date(fechaDesde) : null, [fechaDesde]);
  const fechaHastaDate = useMemo(() => fechaHasta ? new Date(fechaHasta) : null, [fechaHasta]);

  // Filtrado y paginación - OPTIMIZADO: useMemo y uso de datos pre-parseados
  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];
    
    const searchLower = searchTerm ? searchTerm.toLowerCase() : '';
    
    return records.filter(record => {
      // Filtro por búsqueda de texto - OPTIMIZADO: usar metodoPagamentoParsed pre-parseado
      if (searchTerm) {
        // Usar metodoPagamentoParsed en lugar de hacer JSON.parse aquí
        const metodoPagamentoText = record.metodoPagamentoParsed 
          ? record.metodoPagamentoParsed.join(', ')
          : record.metodoPagamento || '';
        
        const creatorName = getCreatorName(record.creator);
        
        const searchFields = [
          record.cliente,
          record.codiceFiscale,
          record.indirizzo,
          record.email,
          record.numeroTelefono,
          record.pagamento,
          record.pnr,
          record.itinerario,
          metodoPagamentoText,
          creatorName
        ];
        
        const matchesSearch = searchFields.some(field => 
          field && field.toString().toLowerCase().includes(searchLower)
        );
        
        if (!matchesSearch) return false;
      }
      
      // Filtro por fechas - OPTIMIZADO: usar fechas memoizadas
      if (fechaDesdeDate) {
        const recordDate = new Date(record.data);
        if (recordDate < fechaDesdeDate) return false;
      }
      
      if (fechaHastaDate) {
        const recordDate = new Date(record.data);
        if (recordDate > fechaHastaDate) return false;
      }
      
      // Filtro por creador - OPTIMIZADO: usar función memoizada
      if (filtroCreador) {
        const nombreCompleto = getCreatorName(record.creator);
        if (nombreCompleto !== filtroCreador) return false;
      }
      
      return true;
    });
  }, [records, searchTerm, fechaDesdeDate, fechaHastaDate, filtroCreador, getCreatorName]);

  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredRecords.slice(startIndex, endIndex);

  // Calcular totales de las columnas NETO, VENDUTO y FEE/AGV
  const totales = useMemo(() => {
    const totalNeto = filteredRecords.reduce((sum, record) => sum + (record.netoPrincipal || 0), 0);
    const totalVenduto = filteredRecords.reduce((sum, record) => sum + (record.vendutoTotal || 0), 0);
    const totalFeeAgv = filteredRecords.reduce((sum, record) => sum + (record.feeAgv || 0), 0);
    
    return {
      totalNeto,
      totalVenduto,
      totalFeeAgv
    };
  }, [filteredRecords]);
  
  // Handler para enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    
    try {
      // Validaciones
      if (!formData.cliente || !formData.data || !formData.itinerario) {
        throw new Error('Por favor complete todos los campos obligatorios');
      }
      
      if (formData.pasajeros.length === 0) {
        throw new Error('Debe agregar al menos un pasajero');
      }
      
      // Validar metodoPagamento
      if (!formData.metodoPagamento || formData.metodoPagamento.length === 0) {
        throw new Error('Debe seleccionar al menos un método de pago');
      }
      
      // Validar que cada pasajero tenga nombre y al menos un servicio
      for (let i = 0; i < formData.pasajeros.length; i++) {
        const p = formData.pasajeros[i];
        if (!p.nombrePasajero) {
          throw new Error(`El pasajero ${i + 1} debe tener nombre`);
        }
        if (p.servicios.length === 0) {
          throw new Error(`El pasajero ${i + 1} debe tener al menos un servicio seleccionado`);
        }
      }
      
      // Preparar datos para enviar
      const dataToSend = new FormData();
      
      // Datos básicos
      Object.keys(formData).forEach(key => {
        if (key !== 'pasajeros' && key !== 'netoPrincipal' && key !== 'vendutoTotal' && key !== 'daPagare' && key !== 'feeAgv') {
          const value = (formData as any)[key];
          // Convertir metodoPagamento array a JSON
          if (key === 'metodoPagamento' && Array.isArray(value)) {
            dataToSend.append(key, JSON.stringify(value));
          } else {
            dataToSend.append(key, value);
          }
        }
      });
      
      // Agregar pasajeros como JSON
      dataToSend.append('pasajeros', JSON.stringify(formData.pasajeros));
      
      // Agregar archivo si existe
      if (selectedFile) {
        dataToSend.append('file', selectedFile);
      }
      
      // Agregar información de cuotas - REPLICANDO TOUR GRUPPO
      dataToSend.append('numeroCuotas', (numeroCuotas > 0 ? numeroCuotas : 0).toString());
      
      // Agregar cuotas si existen
      if (numeroCuotas > 0 && cuotas.length > 0) {
        dataToSend.append('cuotas', JSON.stringify(cuotas.map(c => ({
          id: c.id, // Incluir ID si existe (para actualizar cuotas existentes)
          numeroCuota: c.numeroCuota,
          data: c.data,
          prezzo: c.prezzo,
          note: c.note,
          // Mantener archivo existente si no se subió uno nuevo
          attachedFile: c.file ? null : (c.attachedFile || null),
          attachedFileName: c.file ? null : (c.attachedFileName || null)
        }))));
        
        // Agregar archivos nuevos de cuotas
        cuotas.forEach((cuota, index) => {
          if (cuota.file) {
            dataToSend.append(`cuotaFile${index}`, cuota.file);
          }
        });
      }
      
      // Enviar al servidor
      const url = isEditMode ? `/api/biglietteria/${editingRecord?.id}` : '/api/biglietteria';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: dataToSend
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar');
      }
      
      const result = await response.json();
      
      // Actualizar lista de registros
      if (isEditMode) {
        // El API devuelve { record, message }
        const updatedRecord = result.record || result;
        // OPTIMIZACIÓN: Procesar registro antes de actualizar estado
        setRecords(prev => prev.map(r => r.id === updatedRecord.id ? processRecord(updatedRecord) : r));
        setMessage({ type: 'success', text: 'Registro actualizado correctamente' });
      } else {
        // OPTIMIZACIÓN: Procesar registro antes de agregar al estado
        setRecords(prev => [processRecord(result), ...prev]);
        setMessage({ type: 'success', text: 'Registro creado correctamente' });
      }
      
      // Limpiar formulario
      handleCancelEdit();
      
    } catch (error: any) {
      console.error('Error al guardar:', error);
      setMessage({ type: 'error', text: error.message || 'Error al guardar el registro' });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handler para cancelar edición
  const handleCancelEdit = () => {
    setEditingRecord(null);
    setIsEditMode(false);
    setFormData({
      cliente: '',
      codiceFiscale: '',
      indirizzo: '',
      email: '',
      numeroTelefono: '',
      pagamento: '',
      data: new Date().toISOString().split('T')[0],
      pnr: '',
      itinerario: '',
      metodoPagamento: [],
      notaDiVendita: '',
      numeroPasajeros: 1,
      pasajeros: [crearPasajeroVacio()],
      netoPrincipal: '',
      vendutoTotal: '',
      acconto: '',
      daPagare: '',
      feeAgv: ''
    });
    setSelectedFile(null);
    setCuotas([]);
    setSelectedClientId('');
    
    // Resetear arrays de dropdowns
    setShowServiziDropdowns([false]);
    
    closeModal();
  };
  
  // Handler para editar registro
  const handleEditRecord = (record: BiglietteriaRecord) => {
    setEditingRecord(record);
    setIsEditMode(true);
    
    // Buscar el cliente por nombre
    const matchingClient = clients.find(c => 
      `${c.firstName} ${c.lastName}` === record.cliente
    );
    if (matchingClient) {
      setSelectedClientId(matchingClient.id);
    }
    
    // Mapear pasajeros desde el formato de la base de datos al formato del formulario
    const pasajerosMapeados = record.pasajeros?.map(p => {
      // Parsear servicios desde string a array
      let servicios: string[] = [];
      
      // Los servicios vienen como 'servizio' (string) desde la base de datos
      // pero también pueden venir como 'servicios' (array) desde el frontend
      let servizioString = '';
      if ((p as any).servizio) {
        // Desde la base de datos
        servizioString = (p as any).servizio;
      } else if (p.servicios) {
        // Desde el frontend (ya como array)
        if (typeof p.servicios === 'string') {
          servizioString = p.servicios;
        } else if (Array.isArray(p.servicios)) {
          servicios = p.servicios;
        }
      }
      
      // Si tenemos un string de servicios, convertirlo a array
      if (servizioString && servicios.length === 0) {
        servicios = servizioString.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
      
      
      return {
        id: p.id,
        nombrePasajero: p.nombrePasajero || '',
        servicios: servicios,
        andata: p.andata ? new Date(p.andata).toISOString().split('T')[0] : '',
        ritorno: p.ritorno ? new Date(p.ritorno).toISOString().split('T')[0] : '',
        // Parsear IATA desde JSON o string
        ...(() => {
          const iataValue = (p as any).iata;
          if (!iataValue) {
            return {
              iata: '',
              iataBiglietteria: '',
              iataExpress: '',
              iataPolizza: '',
              iataLetteraInvito: '',
              iataHotel: ''
            };
          }
          
          // Intentar parsear como JSON
          try {
            const iataParsed = JSON.parse(iataValue);
            if (typeof iataParsed === 'object' && iataParsed !== null) {
              // Es un objeto JSON con IATA específicos
              return {
                iata: iataParsed.biglietteria || '',
                iataBiglietteria: iataParsed.biglietteria || '',
                iataExpress: iataParsed.express || '',
                iataPolizza: iataParsed.polizza || '',
                iataLetteraInvito: iataParsed.letteraInvito || '',
                iataHotel: iataParsed.hotel || ''
              };
            }
          } catch {
            // No es JSON, es string simple (compatibilidad con registros antiguos)
            return {
              iata: iataValue,
              iataBiglietteria: iataValue,
              iataExpress: '',
              iataPolizza: '',
              iataLetteraInvito: '',
              iataHotel: ''
            };
          }
          
          // Fallback
          return {
            iata: iataValue,
            iataBiglietteria: iataValue,
            iataExpress: '',
            iataPolizza: '',
            iataLetteraInvito: '',
            iataHotel: ''
          };
        })(),
        // Cargar servicios dinámicos desde notas y iata
        serviciosData: (() => {
          const serviciosData: Record<string, { iata: string; neto: string; venduto: string }> = {};
          const pAny = p as any; // Cast temporal para acceder a campos de la BD
          
          // Parsear notas para obtener servicios dinámicos
          if (pAny.notas) {
            try {
              const notasParsed = JSON.parse(pAny.notas);
              if (notasParsed && typeof notasParsed === 'object' && notasParsed.serviciosDinamicos) {
                // Hay servicios dinámicos en notas
                Object.entries(notasParsed.serviciosDinamicos).forEach(([key, data]: [string, any]) => {
                  serviciosData[key.toUpperCase()] = {
                    iata: '',
                    neto: data.neto ? data.neto.toString() : '',
                    venduto: data.venduto ? data.venduto.toString() : ''
                  };
                });
              }
            } catch {
              // No es JSON, es string simple (solo notas de usuario)
            }
          }
          
          // Parsear IATA para obtener IATA de servicios dinámicos
          if (pAny.iata) {
            try {
              const iataParsed = JSON.parse(pAny.iata);
              if (typeof iataParsed === 'object' && iataParsed !== null) {
                // Obtener servicios dinámicos de los servicios seleccionados
                const servizioString = pAny.servizio || '';
                const servicios = servizioString ? servizioString.split(',').map((s: string) => s.trim()) : [];
                const serviciosDinamicos = obtenerServiciosDinamicos(servicios);
                
                serviciosDinamicos.forEach(servicio => {
                  const servicioKey = normalizarServicio(servicio);
                  const servicioKeyLower = servicioKey.toLowerCase();
                  
                  // Si hay IATA para este servicio en el JSON, agregarlo
                  if (iataParsed[servicioKeyLower] && !serviciosData[servicioKey]) {
                    serviciosData[servicioKey] = {
                      iata: iataParsed[servicioKeyLower],
                      neto: '',
                      venduto: ''
                    };
                  } else if (iataParsed[servicioKeyLower] && serviciosData[servicioKey]) {
                    // Actualizar IATA si ya existe el servicio
                    serviciosData[servicioKey].iata = iataParsed[servicioKeyLower];
                  }
                });
              }
            } catch {
              // No es JSON, es string simple
            }
          }
          
          return Object.keys(serviciosData).length > 0 ? serviciosData : {};
        })(),
        netoBiglietteria: p.netoBiglietteria?.toString() || '',
        vendutoBiglietteria: p.vendutoBiglietteria?.toString() || '',
        tieneExpress: p.tieneExpress || false,
        netoExpress: p.netoExpress?.toString() || '',
        vendutoExpress: p.vendutoExpress?.toString() || '',
        tienePolizza: p.tienePolizza || false,
        netoPolizza: p.netoPolizza?.toString() || '',
        vendutoPolizza: p.vendutoPolizza?.toString() || '',
        tieneLetteraInvito: p.tieneLetteraInvito || false,
        netoLetteraInvito: p.netoLetteraInvito?.toString() || '',
        vendutoLetteraInvito: p.vendutoLetteraInvito?.toString() || '',
        tieneHotel: p.tieneHotel || false,
        netoHotel: p.netoHotel?.toString() || '',
        vendutoHotel: p.vendutoHotel?.toString() || ''
      };
    }) || [crearPasajeroVacio()];
    
    
    // Parsear metodoPagamento desde JSON o string
    let metodoPagamentoArray: string[] = [];
    if (Array.isArray(record.metodoPagamento)) {
      metodoPagamentoArray = record.metodoPagamento;
    } else if (typeof record.metodoPagamento === 'string') {
      try {
        // Intentar parsear como JSON
        const parsed = JSON.parse(record.metodoPagamento);
        metodoPagamentoArray = Array.isArray(parsed) ? parsed : [record.metodoPagamento];
      } catch {
        // Si no es JSON, usar como string simple (compatibilidad con registros antiguos)
        metodoPagamentoArray = record.metodoPagamento ? [record.metodoPagamento] : [];
      }
    }
    
    // Cargar datos del formulario
    setFormData({
      cliente: record.cliente,
      codiceFiscale: record.codiceFiscale,
      indirizzo: record.indirizzo,
      email: record.email,
      numeroTelefono: record.numeroTelefono,
      pagamento: record.pagamento,
      data: new Date(record.data).toISOString().split('T')[0],
      pnr: record.pnr || '',
      itinerario: record.itinerario,
      metodoPagamento: metodoPagamentoArray,
      notaDiVendita: record.notaDiVendita || '',
      numeroPasajeros: record.numeroPasajeros,
      pasajeros: pasajerosMapeados,
      netoPrincipal: record.netoPrincipal.toString(),
      vendutoTotal: record.vendutoTotal.toString(),
      acconto: record.acconto.toString(),
      daPagare: record.daPagare.toString(),
      feeAgv: record.feeAgv.toString()
    });
    
    // Actualizar arrays de dropdowns
    setShowServiziDropdowns(Array(pasajerosMapeados.length).fill(false));
    
    // Cargar datos de cuotas si existen - REPLICANDO LÓGICA DE TOUR GRUPPO
    if (record.numeroCuotas && record.numeroCuotas > 0) {
      // IMPORTANTE: Activar flag ANTES de cambiar numeroCuotas
      setIsLoadingCuotas(true);
      cuotasInicializadas.current = false; // Reset para permitir carga desde edición
      
      // Usar setTimeout para asegurar que el flag se establezca antes
      setTimeout(() => {
        setNumeroCuotas(record.numeroCuotas || 0);
        
        // Convertir las cuotas del registro al formato del formulario
        if (record.cuotas && record.cuotas.length > 0) {
          const cuotasFormato = record.cuotas.map(cuota => ({
            id: cuota.id, // Mantener el ID de la cuota
            numeroCuota: cuota.numeroCuota,
            data: cuota.data ? new Date(cuota.data).toISOString().split('T')[0] : '',
            prezzo: cuota.prezzo.toString(),
            note: cuota.note || '',
            file: null, // Para archivos nuevos
            attachedFile: cuota.attachedFile || null, // Mantener archivo existente
            attachedFileName: cuota.attachedFileName || null // Mantener nombre del archivo
          }));
          setCuotas(cuotasFormato);
          cuotasInicializadas.current = true; // Marcar como inicializadas después de cargar
        }
        
        // Desactivar flag después de cargar
        setTimeout(() => setIsLoadingCuotas(false), 50);
      }, 0);
    } else {
      setNumeroCuotas(0);
      setCuotas([]);
      cuotasInicializadas.current = false;
    }
    
    // Cargar archivo adjunto si existe
    if (record.attachedFile) {
      // Crear un objeto File simulado para mantener la compatibilidad
      // En modo edición, el archivo existente se mantendrá si no se selecciona uno nuevo
      setSelectedFile(null);
    } else {
      setSelectedFile(null);
    }
    
    openModal();
  };
  
  // Handler para ver detalles completos
  const handleViewDetails = (record: BiglietteriaRecord) => {
    setViewingDetails(record);
    setIsDetailsModalOpen(true);
  };

  // Handler para cerrar modal de detalles
  const handleCloseDetailsModal = () => {
    setViewingDetails(null);
    setIsDetailsModalOpen(false);
  };

  // Handler para abrir tabla de detalles de pasajeros
  const handleOpenPassengerDetails = () => {
    setIsPassengerDetailsOpen(true);
  };

  // Handler para cerrar tabla de detalles de pasajeros
  const handleClosePassengerDetails = () => {
    setIsPassengerDetailsOpen(false);
  };


  // Handler para cerrar tabla simplificada de pasajeros
  const handleClosePassengerDetailsSimple = () => {
    setIsPassengerDetailsSimpleOpen(false);
  };

  // Handler para eliminar registro
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setDeletingRecordId(recordId);
    
    try {
      const response = await fetch(`/api/biglietteria/${recordId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar');
      }
      
      setRecords(prev => prev.filter(r => r.id !== recordId));
      setMessage({ type: 'success', text: 'Registro eliminado correctamente' });
      
    } catch (error) {
      console.error('Error al eliminar:', error);
      setMessage({ type: 'error', text: 'Error al eliminar el registro' });
    } finally {
      setDeletingRecordId(null);
    }
  };
  
  
  // ==================== RENDER ====================
  
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }
  
  // Carga progresiva: Mostrar skeleton de tabla mientras cargan los datos
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        
        {/* Container skeleton */}
        <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl max-w-none">
          {/* Header con filtros skeleton */}
          <div className="flex flex-col gap-4 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
            {/* Buscador skeleton */}
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-md animate-pulse"></div>
          </div>
          
          {/* Tabla skeleton */}
          <div className="border border-gray-100 dark:border-white/[0.05] rounded-b-xl overflow-hidden">
            {/* Header de tabla */}
            <div className="bg-gray-50 dark:bg-gray-800/50 grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 dark:border-white/[0.05]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ gridColumn: i === 0 ? 'span 2' : i === 11 ? 'span 2' : 'span 1' }}></div>
              ))}
            </div>
            {/* Filas skeleton */}
            {Array.from({ length: 8 }).map((_, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-100 dark:border-white/[0.05] last:border-b-0">
                {Array.from({ length: 12 }).map((_, colIdx) => (
                  <div key={colIdx} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ gridColumn: colIdx === 0 ? 'span 2' : colIdx === 11 ? 'span 2' : 'span 1', animationDelay: `${rowIdx * 50}ms` }}></div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Paginación skeleton */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 dark:border-white/[0.05]">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!canAccessGestione) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 dark:text-gray-400">No tienes permisos para acceder a esta sección</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Biglietteria</h1>
      </div>
      
      {/* Container principal con data tables (igual que TOUR GRUPPO) */}
      <div className="overflow-hidden bg-white dark:bg-white/[0.03] rounded-xl max-w-none">
        {/* Header con selector y buscador (igual que TOUR GRUPPO) */}
        <div className="flex flex-col gap-4 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl lg:flex-row lg:items-center lg:justify-start lg:gap-6">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              Record: {records.length.toLocaleString()}
            </span>
            {/* Botón Pagos/Express - Solo visible para TI y ADMIN */}
            {(userRole === 'TI' || userRole === 'ADMIN') && (
              <button
                onClick={handleOpenPassengerDetails}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 hover:text-purple-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:hover:text-purple-300 rounded transition-colors duration-200"
                title="Ver detalles por pasajero y servicio"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pagos/Express
              </button>
            )}
            {/* Botón Express - Solo visible para USER */}
            {userRole === 'USER' && (
              <button
                onClick={() => setIsPassengerDetailsSimpleOpen(true)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 hover:text-indigo-800 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:hover:text-indigo-300 rounded transition-colors duration-200"
                title="Ver detalles simplificados de pasajeros"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Express
              </button>
            )}
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300 rounded transition-colors duration-200"
              title="Esporta tutti i biglietteria in Excel"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
            {/* Paginación selector */}
            <span className="text-xs text-gray-500 dark:text-gray-400">Mostra</span>
            <div className="relative z-20 bg-transparent">
              <select
                className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                {[10, 15, 50, 100].map((value) => (
                  <option
                    key={value}
                    value={value}
                    className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                  >
                    {value}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Filtro de fechas */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Dal</span>
              <div 
                className="relative cursor-pointer"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input) {
                    input.showPicker?.();
                    input.focus();
                  }
                }}
              >
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => {
                    setFechaDesde(e.target.value);
                    setCurrentPage(1);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.showPicker?.();
                  }}
                  className="py-2 pl-9 pr-3 text-xs text-gray-800 bg-transparent border border-gray-300 rounded-lg dark:bg-dark-900 h-9 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 cursor-pointer w-[130px]"
                  style={{ colorScheme: 'light dark' }}
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Al</span>
              <div 
                className="relative cursor-pointer"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector('input');
                  if (input) {
                    input.showPicker?.();
                    input.focus();
                  }
                }}
              >
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => {
                    setFechaHasta(e.target.value);
                    setCurrentPage(1);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.showPicker?.();
                  }}
                  className="py-2 pl-9 pr-3 text-xs text-gray-800 bg-transparent border border-gray-300 rounded-lg dark:bg-dark-900 h-9 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 cursor-pointer w-[130px]"
                  style={{ colorScheme: 'light dark' }}
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => {
                    setFechaDesde('');
                    setFechaHasta('');
                    setCurrentPage(1);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  title="Cancella filtro"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Filtro por Creador */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Agente</span>
              <div className="relative creador-dropdown-container">
                <input
                  type="text"
                  value={creadorSearchTerm}
                  onChange={(e) => {
                    setCreadorSearchTerm(e.target.value);
                    setShowCreadorDropdown(true);
                    if (!e.target.value) {
                      setFiltroCreador('');
                      setCurrentPage(1);
                    }
                  }}
                  onFocus={() => setShowCreadorDropdown(true)}
                  placeholder="Tutti"
                  className="py-2 pl-3 pr-8 text-xs text-gray-800 bg-transparent border border-gray-300 rounded-lg dark:bg-dark-900 h-9 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 w-[140px]"
                />
                {/* Ícono de dropdown */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Dropdown de usuarios */}
                {showCreadorDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Opción "Tutti" */}
                    <div
                      onClick={() => {
                        setFiltroCreador('');
                        setCreadorSearchTerm('');
                        setShowCreadorDropdown(false);
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-xs text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700"
                    >
                      Tutti
                    </div>
                    
                    {/* Lista de usuarios filtrados */}
                    {usuarios
                      .filter(usuario => {
                        const nombreCompleto = `${usuario.firstName} ${usuario.lastName}`.trim().toLowerCase();
                        return nombreCompleto.includes(creadorSearchTerm.toLowerCase());
                      })
                      .map((usuario) => {
                        const nombreCompleto = `${usuario.firstName} ${usuario.lastName}`.trim();
                        return (
                          <div
                            key={usuario.clerkId}
                            onClick={() => {
                              setFiltroCreador(nombreCompleto);
                              setCreadorSearchTerm(nombreCompleto);
                              setShowCreadorDropdown(false);
                              setCurrentPage(1);
                            }}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-xs text-gray-900 dark:text-white"
                          >
                            {nombreCompleto} ({usuario.role})
                          </div>
                        );
                      })}
                    
                    {/* Mensaje cuando no hay resultados */}
                    {creadorSearchTerm && usuarios.filter(usuario => {
                      const nombreCompleto = `${usuario.firstName} ${usuario.lastName}`.trim().toLowerCase();
                      return nombreCompleto.includes(creadorSearchTerm.toLowerCase());
                    }).length === 0 && (
                      <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        Nessun utente trovato
                      </div>
                    )}
                  </div>
                )}
              </div>
              {filtroCreador && (
                <button
                  onClick={() => {
                    setFiltroCreador('');
                    setCreadorSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  title="Cancella filtro"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Buscador y botón Nuovo */}
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
            {/* Buscador mejorado */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per Cliente, PNR, Passeggero, Itinerario..."
                className="dark:bg-dark-900 h-10 w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-10 pr-4 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px] lg:w-[280px] md:w-[250px]"
              />
            </div>
            
            {/* Botón Nuovo */}
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors duration-200 whitespace-nowrap flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuovo
            </button>
          </div>
        </div>
      
      {/* Mensaje */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      
      {/* Tabla - Aplicando diseño de TOUR AEREO */}
      <div className="overflow-x-auto">
        <table className="min-w-[1400px] divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-[#0366D6]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Pagamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                PNR
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Passeggeri
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Itinerario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Neto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Venduto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Acconto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                DaPagare
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                MetodoPag.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                FEE/AGV
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Files
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Agente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={16} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'Nessun record trovato con i criteri di ricerca' : 'Nessun record registrato'}
                </td>
              </tr>
            ) : (
              currentData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <button
                      onClick={() => handleClientClick(record.cliente)}
                      disabled={loadingClientData}
                      className="block font-medium text-gray-800 dark:text-white/90 text-xs truncate transition-colors cursor-pointer hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-left w-full"
                      title={`Ver datos completos de ${record.cliente}`}
                    >
                      {record.cliente}
                    </button>
                  </td>
                  {/* <TableCell className="w-[140px] sm:w-[160px] xl:w-[180px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300">
                    {record.codiceFiscale}
                  </td> */}
                  <td className="w-[120px] px-3 py-2">
                    {editingPagamentoId === record.id ? (
                      <select
                        value={record.pagamento}
                        autoFocus
                        onBlur={() => setEditingPagamentoId(null)}
                        onChange={async (e) => {
                          const newValue = e.target.value;
                          setEditingPagamentoId(null);
                          
                          try {
                            const response = await fetch(`/api/biglietteria/${record.id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ pagamento: newValue }),
                            });

                            if (response.ok) {
                              // OPTIMIZACIÓN: Procesar registro actualizado
                              setRecords(prev => prev.map(r => 
                                r.id === record.id ? processRecord({ ...r, pagamento: newValue }) : r
                              ));
                              setMessage({
                                type: 'success',
                                text: 'Pagamento aggiornato'
                              });
                              setTimeout(() => setMessage(null), 3000);
                            } else {
                              throw new Error('Error al actualizar');
                            }
                          } catch (error) {
                            setMessage({
                              type: 'error',
                              text: 'Error al actualizar pagamento'
                            });
                            setTimeout(() => setMessage(null), 3000);
                          }
                        }}
                        className="w-full px-2 py-1 text-xs border border-brand-500 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-gray-800 dark:border-brand-400 dark:text-white"
                      >
                        {pagamentos.map((pag) => (
                          <option key={pag} value={pag}>
                            {pag}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div
                        onClick={() => setEditingPagamentoId(record.id)}
                        className={`text-xs truncate cursor-pointer px-2 py-1 rounded text-center font-medium ${
                          record.pagamento === 'Acconto' ? 'bg-gray-500 text-white' :
                          record.pagamento === 'Acconto V' ? 'bg-purple-400 text-white' :
                          record.pagamento === 'Ricevuto' ? 'bg-green-500 text-white' :
                          record.pagamento === 'Verificato' ? 'bg-purple-600 text-white' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                        title="Clic para editar"
                      >
                        {record.pagamento}
                      </div>
                    )}
                  </td>
                  <td className="w-[100px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 truncate">
                    {new Date(record.data).toLocaleDateString('it-IT')}
                  </td>
                  <td className="w-[100px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 font-mono truncate">
                    {record.pnr || '-'}
                  </td>
                  <td className="w-[80px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 truncate">
                    {record.numeroPasajeros}
                  </td>
                  <td className="w-[120px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 truncate">
                    {record.itinerario}
                  </td>
                  <td className="w-[80px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 font-mono truncate">
                    €{record.netoPrincipal.toFixed(2)}
                  </td>
                  <td className="w-[80px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 font-mono truncate">
                    €{record.vendutoTotal.toFixed(2)}
                  </td>
                  <td className="w-[80px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 font-mono truncate">
                    €{record.acconto.toFixed(2)}
                  </td>
                  <td className="w-[80px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 font-mono truncate">
                    €{record.daPagare.toFixed(2)}
                  </td>
                  <td className="w-[100px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 truncate">
                    {(() => {
                      try {
                        const parsed = typeof record.metodoPagamento === 'string' 
                          ? JSON.parse(record.metodoPagamento) 
                          : record.metodoPagamento;
                        return Array.isArray(parsed) ? parsed.join(', ') : record.metodoPagamento;
                      } catch {
                        return record.metodoPagamento;
                      }
                    })()}
                  </td>
                  <td className="w-[80px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 font-mono truncate">
                    €{record.feeAgv.toFixed(2)}
                  </td>
                  
                  {/* Columna Files */}
                  <td className="w-[80px] px-3 py-2 text-center">
                    <button
                      onClick={() => handleViewFiles(record)}
                      disabled={countFiles(record) === 0}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-all duration-200 ${
                        countFiles(record) > 0
                          ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                      }`}
                      title={countFiles(record) > 0 ? `Ver ${countFiles(record)} archivo(s)` : 'Sin archivos'}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {countFiles(record) > 0 && (
                        <span className="text-xs font-semibold">{countFiles(record)}</span>
                      )}
                    </button>
                  </td>
                  
                  {/* Columna Creato da */}
                  <td className="w-[100px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 truncate">
                    {record.creator?.firstName 
                      ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ''}`.trim()
                      : record.creator?.email || 'N/A'}
                  </td>
                  
                  <td className="w-[140px] px-3 py-2 text-start sticky right-0 bg-white dark:bg-gray-900 z-10 border-l border-gray-200 dark:border-gray-700 shadow-lg">
                    <div className="flex items-center gap-1">
                      {/* Botón Ver Detalles */}
                      <button
                        onClick={() => handleViewDetails(record)}
                        className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 hover:text-purple-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:hover:text-purple-300 rounded transition-all duration-200 transform hover:scale-105"
                        title="Ver detalles completos"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      {/* Botón Editar */}
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded transition-all duration-200 transform hover:scale-105"
                        title="Modifica"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Botón Recibo */}
                      <button
                        onClick={() => handleGenerateRicevuta(record.id)}
                        className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300 rounded transition-all duration-200 transform hover:scale-105"
                        title="Ricevuta"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        disabled={deletingRecordId === record.id}
                        className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Elimina"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            
            {/* Fila de Total */}
            {currentData.length > 0 && (
              <tr className="bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-700">
                <td colSpan={6} className="px-6 py-4 text-right font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  TOTAL:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 dark:text-blue-200">
                  €{totales.totalNeto.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 dark:text-blue-200">
                  €{totales.totalVenduto.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  -
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 dark:text-blue-200">
                  €{totales.totalFeeAgv.toFixed(2)}
                </td>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                  -
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer de paginación (igual que TOUR GRUPPO) */}
      <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
          {/* Información de registros mostrados */}
          <div className="pb-3 xl:pb-0">
            <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
              Mostrando {startIndex + 1} a {endIndex} di {totalItems} registri
            </p>
          </div>

          {/* Controles de paginación */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
            >
              Precedente
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === pageNum
                        ? 'bg-brand-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
            >
              Successivo
            </button>
          </div>
        </div>
      </div>
      </div>
      
      {/* Modal del formulario */}
      {isMounted && isModalOpen && createPortal(
        <Modal isOpen={isModalOpen} onClose={handleCancelEdit} className="p-6 md:p-8">
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? "Editar Registro" : "Nuevo Registro"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Sección: Información del Cliente */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información del Cliente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Cliente Dropdown */}
                <div className="relative client-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cliente *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={clientSearchTerm || formData.cliente}
                      onChange={(e) => {
                        setClientSearchTerm(e.target.value);
                        setShowClientDropdown(true);
                        setFormData(prev => ({ ...prev, cliente: e.target.value }));
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Seleziona un cliente o cerca per nome..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      required
                    />
                    {/* Ícono de búsqueda */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                          <div
                            key={client.id}
                            onClick={() => handleClientSelect(client.id)}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {client.firstName} {client.lastName}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {clients && clients.length > 0 ? 'No se encontraron clientes' : 'Cargando clientes...'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mensaje cuando no hay resultados */}
                  {showClientDropdown && clientSearchTerm && filteredClients.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Nessun cliente trovato
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Codice Fiscale *
                  </label>
                  <input
                    type="text"
                    value={formData.codiceFiscale}
                    onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                    readOnly={!!selectedClientId}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Indirizzo *
                  </label>
                  <input
                    type="text"
                    value={formData.indirizzo}
                    onChange={(e) => setFormData(prev => ({ ...prev, indirizzo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                    readOnly={!!selectedClientId}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                    readOnly={!!selectedClientId}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numero di Telefono *
                  </label>
                  <input
                    type="tel"
                    value={formData.numeroTelefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroTelefono: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                    readOnly={!!selectedClientId}
                  />
                </div>
              </div>
            </div>
            
            {/* Sección: Información del Viaje */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información del Viaje</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Pagamento Dropdown (igual que Cliente) */}
                <div className="relative pagamento-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pagamento *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pagamentoSearchTerm || formData.pagamento}
                      onChange={(e) => {
                        setPagamentoSearchTerm(e.target.value);
                        setShowPagamentoDropdown(true);
                        setFormData(prev => ({ ...prev, pagamento: e.target.value }));
                      }}
                      onFocus={() => setShowPagamentoDropdown(true)}
                      placeholder="Seleziona un pagamento o cerca per nome..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      required
                    />
                    {/* Ícono de búsqueda */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {showPagamentoDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredPagamentos.length > 0 ? (
                        filteredPagamentos.map(pagamento => (
                          <div
                            key={pagamento}
                            onClick={() => handlePagamentoSelect(pagamento)}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {pagamento}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {pagamentos && pagamentos.length > 0 ? 'No se encontraron pagamentos' : 'Cargando pagamentos...'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mensaje cuando no hay resultados */}
                  {showPagamentoDropdown && pagamentoSearchTerm && filteredPagamentos.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                      <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                        Nessun pagamento trovato
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PNR
                  </label>
                  <input
                    type="text"
                    value={formData.pnr}
                    onChange={(e) => setFormData(prev => ({ ...prev, pnr: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Itinerario *
                  </label>
                  <input
                    type="text"
                    value={formData.itinerario}
                    onChange={(e) => setFormData(prev => ({ ...prev, itinerario: e.target.value }))}
                    placeholder="Ej: Roma - Madrid - Roma"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Sección: Pasajeros */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pasajeros</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Número de pasajeros:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.numeroPasajeros}
                    onChange={(e) => handleNumeroPasajerosChange(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <span className="text-xs text-gray-500">(max: 20)</span>
                </div>
              </div>
              
              {/* Lista de Pasajeros */}
              <div className="space-y-6">
                {formData.pasajeros.map((pasajero, index) => {
                  const fieldsToShow = shouldShowFieldsForPasajero(pasajero);
                  
                  return (
                    <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Pasajero {index + 1}
                      </h4>
                      
                      {/* Nombre del Pasajero y Servicios en la misma fila */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Nombre del Pasajero */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre del Pasajero *
                          </label>
                          <input
                            type="text"
                            value={pasajero.nombrePasajero}
                            onChange={(e) => handlePasajeroChange(index, 'nombrePasajero', e.target.value)}
                            placeholder="Ingrese el nombre del pasajero"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        {/* Servicios */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Servizi * (seleccionar uno o más)
                        </label>
                        
                        {/* Input con chips dentro */}
                        <div className="relative servizi-dropdown-container">
                          <div className="min-h-[40px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex flex-wrap gap-1 items-center cursor-text"
                               onClick={() => setShowServiziDropdown(index)}>
                            {/* Chips de servicios seleccionados */}
                            {pasajero.servicios.map(servicio => (
                              <div
                                key={servicio}
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                <span className="mr-1">{servicio}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleServicioToggle(index, servicio);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 focus:outline-none ml-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            
                            {/* Placeholder cuando no hay servicios */}
                            {pasajero.servicios.length === 0 && (
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Seleziona servizi...
                              </span>
                            )}
                          </div>
                          
                          {/* Dropdown de servicios (dentro del contenedor relativo) */}
                          {showServiziDropdown === index && (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {serviciosDisponibles
                              .filter(servicio => !pasajero.servicios.includes(servicio))
                              .map(servizio => (
                                <div
                                  key={servizio}
                                  onClick={() => {
                                    handleServicioToggle(index, servizio);
                                    setShowServiziDropdown(null);
                                  }}
                                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {servizio}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                          {/* Mensaje de error */}
                          {pasajero.servicios.length === 0 && (
                            <p className="text-xs text-red-500 mt-1">Debe seleccionar al menos un servicio</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Fechas (solo si tiene Biglietteria) */}
                      {fieldsToShow.showDateFields && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Andata
                            </label>
                            <input
                              type="date"
                              value={pasajero.andata}
                              onChange={(e) => handlePasajeroChange(index, 'andata', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Ritorno
                            </label>
                            <input
                              type="date"
                              value={pasajero.ritorno}
                              onChange={(e) => handlePasajeroChange(index, 'ritorno', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Campos de Biglietteria */}
                      {fieldsToShow.showBiglietteriaFields && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                          <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                            Costos Biglietteria
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                IATA *
                              </label>
                              <div className="relative iata-dropdown-container">
                                <input
                                  type="text"
                                  value={pasajero.iataBiglietteria}
                                  onChange={(e) => {
                                    handlePasajeroChange(index, 'iataBiglietteria', e.target.value);
                                    setIndividualIataSearchTerm(index, 'Biglietteria', e.target.value);
                                    setIndividualIataDropdown(index, 'Biglietteria', true);
                                  }}
                                  onFocus={() => setIndividualIataDropdown(index, 'Biglietteria', true)}
                                  placeholder="Buscar IATA"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  required
                                />
                                
                                {/* Dropdown de IATA */}
                                {isIndividualIataDropdownOpen(index, 'Biglietteria') && getFilteredIndividualIata(index, 'Biglietteria').length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {getFilteredIndividualIata(index, 'Biglietteria').map((iata, idx) => (
                                      <div
                                        key={`pasajero-${index}-iata-biglietteria-${idx}`}
                                        onClick={() => handleIndividualIataSelect(index, 'Biglietteria', iata)}
                                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                      >
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {iata}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Mensaje cuando no hay resultados */}
                                {isIndividualIataDropdownOpen(index, 'Biglietteria') && getFilteredIndividualIata(index, 'Biglietteria').length === 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                      Nessun IATA trovato
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Neto
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={pasajero.netoBiglietteria}
                                onChange={(e) => handlePasajeroChange(index, 'netoBiglietteria', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Venduto
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={pasajero.vendutoBiglietteria}
                                onChange={(e) => handlePasajeroChange(index, 'vendutoBiglietteria', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Servicios Adicionales */}
                      {fieldsToShow.showAdditionalServiceFields && (
                        <div className="space-y-3">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Servicios Adicionales
                          </h5>
                          
                          {/* Express */}
                          {pasajero.tieneExpress && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                              <h6 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                                Express
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    IATA *
                                  </label>
                                  <div className="relative iata-dropdown-container">
                                    <input
                                      type="text"
                                      value={pasajero.iataExpress}
                                      onChange={(e) => {
                                        handlePasajeroChange(index, 'iataExpress', e.target.value);
                                        setIndividualIataSearchTerm(index, 'EXPRESS', e.target.value);
                                        setIndividualIataDropdown(index, 'EXPRESS', true);
                                      }}
                                      onFocus={() => setIndividualIataDropdown(index, 'EXPRESS', true)}
                                      placeholder="Buscar IATA"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      required
                                    />
                                    
                                    {/* Dropdown de IATA */}
                                    {isIndividualIataDropdownOpen(index, 'EXPRESS') && getFilteredIndividualIata(index, 'EXPRESS').length > 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {getFilteredIndividualIata(index, 'EXPRESS').map((iata, idx) => (
                                          <div
                                            key={idx}
                                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                            onClick={() => handleIndividualIataSelect(index, 'EXPRESS', iata)}
                                          >
                                            {iata}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {isIndividualIataDropdownOpen(index, 'EXPRESS') && getFilteredIndividualIata(index, 'EXPRESS').length === 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                          Nessun IATA trovato
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Neto
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pasajero.netoExpress}
                                    onChange={(e) => handlePasajeroChange(index, 'netoExpress', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Venduto
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pasajero.vendutoExpress}
                                    onChange={(e) => handlePasajeroChange(index, 'vendutoExpress', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Polizza */}
                          {pasajero.tienePolizza && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                              <h6 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                                Polizza
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    IATA *
                                  </label>
                                  <div className="relative iata-dropdown-container">
                                    <input
                                      type="text"
                                      value={pasajero.iataPolizza}
                                      onChange={(e) => {
                                        handlePasajeroChange(index, 'iataPolizza', e.target.value);
                                        setIndividualIataSearchTerm(index, 'POLIZZA', e.target.value);
                                        setIndividualIataDropdown(index, 'POLIZZA', true);
                                      }}
                                      onFocus={() => setIndividualIataDropdown(index, 'POLIZZA', true)}
                                      placeholder="Buscar IATA"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      required
                                    />
                                    
                                    {/* Dropdown de IATA */}
                                    {isIndividualIataDropdownOpen(index, 'POLIZZA') && getFilteredIndividualIata(index, 'POLIZZA').length > 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {getFilteredIndividualIata(index, 'POLIZZA').map((iata, idx) => (
                                          <div
                                            key={idx}
                                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                            onClick={() => handleIndividualIataSelect(index, 'POLIZZA', iata)}
                                          >
                                            {iata}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {isIndividualIataDropdownOpen(index, 'POLIZZA') && getFilteredIndividualIata(index, 'POLIZZA').length === 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                          Nessun IATA trovato
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Neto
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pasajero.netoPolizza}
                                    onChange={(e) => handlePasajeroChange(index, 'netoPolizza', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Venduto
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pasajero.vendutoPolizza}
                                    onChange={(e) => handlePasajeroChange(index, 'vendutoPolizza', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Lettera di Invito */}
                          {pasajero.tieneLetteraInvito && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                              <h6 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                                Lettera di Invito
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    IATA *
                                  </label>
                                  <div className="relative iata-dropdown-container">
                                    <input
                                      type="text"
                                      value={pasajero.iataLetteraInvito}
                                      onChange={(e) => {
                                        handlePasajeroChange(index, 'iataLetteraInvito', e.target.value);
                                        setIndividualIataSearchTerm(index, 'LETTERA', e.target.value);
                                        setIndividualIataDropdown(index, 'LETTERA', true);
                                      }}
                                      onFocus={() => setIndividualIataDropdown(index, 'LETTERA', true)}
                                      placeholder="Buscar IATA"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      required
                                    />
                                    
                                    {/* Dropdown de IATA */}
                                    {isIndividualIataDropdownOpen(index, 'LETTERA') && getFilteredIndividualIata(index, 'LETTERA').length > 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {getFilteredIndividualIata(index, 'LETTERA').map((iata, idx) => (
                                          <div
                                            key={idx}
                                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                            onClick={() => handleIndividualIataSelect(index, 'LETTERA', iata)}
                                          >
                                            {iata}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {isIndividualIataDropdownOpen(index, 'LETTERA') && getFilteredIndividualIata(index, 'LETTERA').length === 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                          Nessun IATA trovato
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Neto
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pasajero.netoLetteraInvito}
                                    onChange={(e) => handlePasajeroChange(index, 'netoLetteraInvito', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Venduto
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pasajero.vendutoLetteraInvito}
                                    onChange={(e) => handlePasajeroChange(index, 'vendutoLetteraInvito', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Hotel */}
                          {pasajero.tieneHotel && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                              <h6 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                                Hotel
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    IATA *
                                  </label>
                                  <div className="relative iata-dropdown-container">
                                    <input
                                      type="text"
                                      value={pasajero.iataHotel}
                                      onChange={(e) => {
                                        handlePasajeroChange(index, 'iataHotel', e.target.value);
                                        setIndividualIataSearchTerm(index, 'HOTEL', e.target.value);
                                        setIndividualIataDropdown(index, 'HOTEL', true);
                                      }}
                                      onFocus={() => setIndividualIataDropdown(index, 'HOTEL', true)}
                                      placeholder="Buscar IATA"
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                      required
                                    />
                                    
                                    {/* Dropdown de IATA */}
                                    {isIndividualIataDropdownOpen(index, 'HOTEL') && getFilteredIndividualIata(index, 'HOTEL').length > 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {getFilteredIndividualIata(index, 'HOTEL').map((iata, idx) => (
                                          <div
                                            key={idx}
                                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                            onClick={() => handleIndividualIataSelect(index, 'HOTEL', iata)}
                                          >
                                            {iata}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {isIndividualIataDropdownOpen(index, 'HOTEL') && getFilteredIndividualIata(index, 'HOTEL').length === 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                          Nessun IATA trovato
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Neto
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pasajero.netoHotel}
                                    onChange={(e) => handlePasajeroChange(index, 'netoHotel', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Venduto
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={pasajero.vendutoHotel}
                                    onChange={(e) => handlePasajeroChange(index, 'vendutoHotel', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Servicios Dinámicos - Para todos los servicios que no están en la lista de conocidos */}
                          {obtenerServiciosDinamicos(pasajero.servicios).map((servicio) => {
                            // Normalizar el nombre del servicio para usar como clave
                            const servicioKey = normalizarServicio(servicio);
                            const servicioData = pasajero.serviciosData?.[servicioKey] || { iata: '', neto: '', venduto: '' };
                            
                            // Colores diferentes para cada servicio (usando hash simple)
                            const colores = [
                              { bg: 'bg-cyan-50', dark: 'dark:bg-cyan-900/20', text: 'text-cyan-900', darkText: 'dark:text-cyan-300' },
                              { bg: 'bg-pink-50', dark: 'dark:bg-pink-900/20', text: 'text-pink-900', darkText: 'dark:text-pink-300' },
                              { bg: 'bg-orange-50', dark: 'dark:bg-orange-900/20', text: 'text-orange-900', darkText: 'dark:text-orange-300' },
                              { bg: 'bg-teal-50', dark: 'dark:bg-teal-900/20', text: 'text-teal-900', darkText: 'dark:text-teal-300' },
                              { bg: 'bg-amber-50', dark: 'dark:bg-amber-900/20', text: 'text-amber-900', darkText: 'dark:text-amber-300' }
                            ];
                            const colorIndex = servicioKey.length % colores.length;
                            const color = colores[colorIndex];
                            
                            return (
                              <div key={servicioKey} className={`${color.bg} ${color.dark} p-3 rounded-lg`}>
                                <h6 className={`text-sm font-semibold ${color.text} ${color.darkText} mb-2`}>
                                  {servicio}
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      IATA *
                                    </label>
                                    <div className="relative iata-dropdown-container">
                                      <input
                                        type="text"
                                        value={servicioData.iata}
                                        onChange={(e) => {
                                          const newData = { ...servicioData, iata: e.target.value };
                                          const updatedData = { ...(pasajero.serviciosData || {}), [servicioKey]: newData };
                                          handlePasajeroChange(index, 'serviciosData', updatedData);
                                          setIndividualIataSearchTerm(index, servicioKey, e.target.value);
                                          setIndividualIataDropdown(index, servicioKey, true);
                                        }}
                                        onFocus={() => setIndividualIataDropdown(index, servicioKey, true)}
                                        placeholder="Buscar IATA"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        required
                                      />
                                      
                                      {/* Dropdown de IATA */}
                                      {isIndividualIataDropdownOpen(index, servicioKey) && getFilteredIndividualIata(index, servicioKey).length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                          {getFilteredIndividualIata(index, servicioKey).map((iata, idx) => (
                                            <div
                                              key={idx}
                                              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                              onClick={() => {
                                                const newData = { ...servicioData, iata: iata };
                                                const updatedData = { ...(pasajero.serviciosData || {}), [servicioKey]: newData };
                                                handlePasajeroChange(index, 'serviciosData', updatedData);
                                                handleIndividualIataSelect(index, servicioKey, iata);
                                              }}
                                            >
                                              {iata}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {isIndividualIataDropdownOpen(index, servicioKey) && getFilteredIndividualIata(index, servicioKey).length === 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                            Nessun IATA trovato
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Neto
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={servicioData.neto}
                                      onChange={(e) => {
                                        const newData = { ...servicioData, neto: e.target.value };
                                        const updatedData = { ...(pasajero.serviciosData || {}), [servicioKey]: newData };
                                        handlePasajeroChange(index, 'serviciosData', updatedData);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Venduto
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={servicioData.venduto}
                                      onChange={(e) => {
                                        const newData = { ...servicioData, venduto: e.target.value };
                                        const updatedData = { ...(pasajero.serviciosData || {}), [servicioKey]: newData };
                                        handlePasajeroChange(index, 'serviciosData', updatedData);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Sección: Totales Calculados */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Totales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Neto Principal (calculado)
                  </label>
                  <input
                    type="text"
                    value={`€${formData.netoPrincipal}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venduto (calculado)
                  </label>
                  <input
                    type="text"
                    value={`€${formData.vendutoTotal}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Acconto (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.acconto}
                    onChange={(e) => setFormData(prev => ({ ...prev, acconto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Da Pagare (calcolato)
                  </label>
                  <input
                    type="text"
                    value={`€${formData.daPagare}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                  />
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fee AGV (calcolato)
                  </label>
                  <input
                    type="text"
                    value={`€${formData.feeAgv}`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold"
                  />
                </div>
                
                {/* MetodoPagamento Dropdown (selección múltiple como Servizi) */}
                <div className="relative metodo-pagamento-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metodo Pagamento * (seleccionar uno o más)
                  </label>
                  <div className="relative">
                    <div className="min-h-[40px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex flex-wrap gap-1 items-center cursor-text"
                         onClick={() => setShowMetodoPagamentoDropdown(true)}>
                      {/* Chips de métodos seleccionados */}
                      {formData.metodoPagamento.map(metodo => (
                        <div
                          key={metodo}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          <span className="mr-1">{metodo}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMetodoPagamentoToggle(metodo);
                            }}
                            className="text-blue-600 hover:text-blue-800 focus:outline-none ml-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      
                      {/* Input de búsqueda cuando hay métodos seleccionados */}
                      {formData.metodoPagamento.length > 0 && (
                        <input
                          type="text"
                          value={metodoPagamentoSearchTerm}
                          onChange={(e) => {
                            setMetodoPagamentoSearchTerm(e.target.value);
                            setShowMetodoPagamentoDropdown(true);
                          }}
                          onFocus={() => setShowMetodoPagamentoDropdown(true)}
                          placeholder="Cerca altro metodo..."
                          className="flex-1 min-w-[120px] px-1 py-0.5 border-0 bg-transparent text-gray-900 dark:text-white focus:outline-none text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      
                      {/* Placeholder cuando no hay métodos */}
                      {formData.metodoPagamento.length === 0 && (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          Seleziona metodi di pagamento...
                        </span>
                      )}
                    </div>
                    
                    {/* Ícono de búsqueda */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {showMetodoPagamentoDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredMetodoPagamento
                        .filter(metodo => !formData.metodoPagamento.includes(metodo))
                        .map(metodo => (
                          <div
                            key={metodo}
                            onClick={() => {
                              handleMetodoPagamentoToggle(metodo);
                              setShowMetodoPagamentoDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {metodo}
                            </div>
                          </div>
                        ))}
                      {filteredMetodoPagamento.filter(metodo => !formData.metodoPagamento.includes(metodo)).length === 0 && (
                        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          Nessun metodo disponibile
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mensaje de error */}
                  {formData.metodoPagamento.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Debe seleccionar al menos un método de pago</p>
                  )}
                </div>
                
                {/* Campo Nota di vendita */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    nota interna di vendita
                  </label>
                  <textarea
                    value={formData.notaDiVendita}
                    onChange={(e) => setFormData(prev => ({ ...prev, notaDiVendita: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Nota interna della vendita..."
                  />
                </div>
              </div>
            </div>
            
            {/* Sección: Archivo Adjunto */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Archivo Adjunto (opcional)</h3>
              
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Archivo seleccionado: {selectedFile.name}
                </div>
              )}
            </div>
            
            {/* Sección: Sistema de Cuotas - REPLICANDO LÓGICA DE TOUR GRUPPO */}
            {(() => {
              const daPagareValue = parseFloat(formData.daPagare) || 0;
              const shouldShow = daPagareValue > 0 || numeroCuotas > 0;
              return shouldShow;
            })() && (
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Sistema de Cuotas (opcional - máximo 2 cuotas)
                </h3>
                
                {/* Selector de número de cuotas - REPLICANDO TOUR GRUPPO */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de cuotas
                  </label>
                  <select
                    value={numeroCuotas}
                    onChange={(e) => setNumeroCuotas(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value={0}>Sin cuotas</option>
                    <option value={1}>1 cuota</option>
                    <option value={2}>2 cuotas</option>
                  </select>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    if (cuotas.length === 0) {
                      return <div className="text-gray-500 text-center py-4">No hay cuotas registradas</div>;
                    }
                    return cuotas.map((cuota, index) => (
                    <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Cuota {cuota.numeroCuota}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setCuotas(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-700"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data
                          </label>
                          <input
                            type="date"
                            value={cuota.data}
                            onChange={(e) => {
                              const newCuotas = [...cuotas];
                              newCuotas[index].data = e.target.value;
                              setCuotas(newCuotas);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Prezzo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={cuota.prezzo}
                            onChange={(e) => {
                              const newCuotas = [...cuotas];
                              newCuotas[index].prezzo = e.target.value;
                              setCuotas(newCuotas);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Note (interna)
                          </label>
                          <input
                            type="text"
                            value={cuota.note}
                            onChange={(e) => {
                              const newCuotas = [...cuotas];
                              newCuotas[index].note = e.target.value;
                              setCuotas(newCuotas);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Archivo de la cuota (opcional)
                        </label>
                        <input
                          type="file"
                          onChange={(e) => {
                            const newCuotas = [...cuotas];
                            newCuotas[index].file = e.target.files?.[0] || null;
                            setCuotas(newCuotas);
                          }}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  ));
                  })()}
                </div>
              </div>
            )}
            
            {/* Botones de acción */}
            <div className="flex justify-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (isEditMode ? 'Actualizando...' : 'Guardando...') : (isEditMode ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </form>
        </Modal>,
        document.body
      )}

      {/* Modal de Visualización de Archivos */}
      {isMounted && isFileViewerOpen && viewingFiles && createPortal(
        <>
          <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] z-[9999999998]" onClick={handleCloseFileViewer}></div>
          <div className="fixed inset-0 flex items-center justify-center z-[9999999999] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Comprobantes de Pago</h2>
              <button
                onClick={handleCloseFileViewer}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">

              {/* Archivo Principal */}
              {viewingFiles.attachedFile && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Archivo Principal</p>
                  {(() => {
                    // Usar el nombre del archivo para detectar el tipo
                    const fileName = viewingFiles.attachedFileName || viewingFiles.attachedFile;
                    
                    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                      return (
                        <img 
                          src={viewingFiles.attachedFile} 
                          alt="Archivo principal" 
                          className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleDownload(viewingFiles.attachedFile!, viewingFiles.attachedFileName || 'archivo_principal.jpg')}
                        />
                      );
                    } else {
                      return (
                        <button
                          onClick={() => handleDownload(viewingFiles.attachedFile!, viewingFiles.attachedFileName || 'documento')}
                          className="block w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <p className="text-sm text-gray-900 dark:text-white">{viewingFiles.attachedFileName}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Clic para descargar</p>
                        </button>
                      );
                    }
                  })()}
                </div>
              )}

              {/* Archivos de Cuotas */}
              {viewingFiles.cuotas && viewingFiles.cuotas.filter(c => c.attachedFile).map((cuota) => (
                <div key={cuota.id}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cuota {cuota.numeroCuota}
                  </p>
                  {(() => {
                    // Usar el nombre del archivo para detectar el tipo
                    const fileName = cuota.attachedFileName || cuota.attachedFile!;
                    
                    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                      return (
                        <img 
                          src={cuota.attachedFile!} 
                          alt={`Cuota ${cuota.numeroCuota}`} 
                          className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleDownload(cuota.attachedFile!, cuota.attachedFileName || `cuota_${cuota.numeroCuota}.jpg`)}
                        />
                      );
                    } else {
                      return (
                        <button
                          onClick={() => handleDownload(cuota.attachedFile!, cuota.attachedFileName || `cuota_${cuota.numeroCuota}`)}
                          className="block w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <p className="text-sm text-gray-900 dark:text-white">{cuota.attachedFileName}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Clic para descargar</p>
                        </button>
                      );
                    }
                  })()}
                </div>
              ))}

              {/* Sin archivos */}
              {!viewingFiles.attachedFile && (!viewingFiles.cuotas || viewingFiles.cuotas.filter(c => c.attachedFile).length === 0) && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No hay archivos adjuntos</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
              <button
                onClick={handleCloseFileViewer}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
          </div>
        </>,
        document.body
      )}

      {/* Modal de detalles completos */}
      {isDetailsModalOpen && viewingDetails && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999] p-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Detalles del Registro
                </h2>
                <button
                  onClick={handleCloseDetailsModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>


              {/* Pasajeros y Servicios */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <h3 className="text-base font-semibold text-purple-900 dark:text-purple-300 mb-3">
                  Pasajeros y Servicios
                </h3>
                {viewingDetails.pasajeros && viewingDetails.pasajeros.length > 0 ? (
                  <div className="space-y-3">
                    {viewingDetails.pasajeros.map((pasajero, index) => (
                      <div key={index} className="border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                        <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2 text-sm">
                          {index + 1}. {pasajero.nombrePasajero}
                        </h4>
                        
                        {/* Fechas de viaje e IATA (si aplica) */}
                        {(pasajero.andata || pasajero.ritorno || pasajero.iata) && (
                          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                            <div className="flex gap-4 flex-wrap">
                              {pasajero.iata && (
                                <div>
                                  <span className="font-medium text-blue-700 dark:text-blue-300">IATA:</span>
                                  <span className="text-gray-700 dark:text-gray-300 ml-1">{pasajero.iata}</span>
                                </div>
                              )}
                              {pasajero.andata && (
                                <div>
                                  <span className="font-medium text-blue-700 dark:text-blue-300">Fecha Ida:</span>
                                  <span className="text-gray-700 dark:text-gray-300 ml-1">{new Date(pasajero.andata).toLocaleDateString('it-IT')}</span>
                                </div>
                              )}
                              {pasajero.ritorno && (
                                <div>
                                  <span className="font-medium text-blue-700 dark:text-blue-300">Fecha Vuelta:</span>
                                  <span className="text-gray-700 dark:text-gray-300 ml-1">{new Date(pasajero.ritorno).toLocaleDateString('it-IT')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Servicios con costos organizados */}
                        <div className="space-y-2">
                          {(() => {
                            const servicios = [
                              {
                                nombre: 'BIGLIETTERIA',
                                neto: pasajero.netoBiglietteria,
                                venduto: pasajero.vendutoBiglietteria,
                                mostrar: !!pasajero.netoBiglietteria
                              },
                              {
                                nombre: 'EXPRESS',
                                neto: pasajero.netoExpress,
                                venduto: pasajero.vendutoExpress,
                                mostrar: pasajero.tieneExpress
                              },
                              {
                                nombre: 'POLIZZA',
                                neto: pasajero.netoPolizza,
                                venduto: pasajero.vendutoPolizza,
                                mostrar: pasajero.tienePolizza
                              },
                              {
                                nombre: 'LETTERA D\'INVITO',
                                neto: pasajero.netoLetteraInvito,
                                venduto: pasajero.vendutoLetteraInvito,
                                mostrar: pasajero.tieneLetteraInvito
                              },
                              {
                                nombre: 'HOTEL',
                                neto: pasajero.netoHotel,
                                venduto: pasajero.vendutoHotel,
                                mostrar: pasajero.tieneHotel
                              }
                            ].filter(s => s.mostrar);

                            return servicios.map((servicio, idx) => (
                              <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{servicio.nombre}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Neto:</span>
                                    <span className="font-medium">€{servicio.neto || 0}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Venduto:</span>
                                    <span className="font-medium">€{servicio.venduto || 0}</span>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-xs text-center py-4">No hay pasajeros registrados</p>
                )}
              </div>

              {/* Cuotas - Solo si existen */}
              {viewingDetails.cuotas && viewingDetails.cuotas.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 mt-4">
                  <h3 className="text-base font-semibold text-orange-900 dark:text-orange-300 mb-3">
                    Sistema de Cuotas ({viewingDetails.cuotas.length} cuota{viewingDetails.cuotas.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="space-y-2">
                    {viewingDetails.cuotas.map((cuota, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded border border-orange-200 dark:border-orange-700 p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-orange-700 dark:text-orange-300 text-sm">
                            Cuota {cuota.numeroCuota}
                          </span>
                          <span className="font-bold text-green-600 dark:text-green-400">€{cuota.prezzo}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            {cuota.data ? new Date(cuota.data).toLocaleDateString('it-IT') : 'No definida'}
                          </span>
                          {cuota.note && cuota.note.trim() && (
                            <span className="text-gray-600 dark:text-gray-400">
                              {cuota.note}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* Botón de cierre */}
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleCloseDetailsModal}
                  className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

        {/* Modal de información del cliente */}
        {isMounted && isClientModalOpen && selectedClient && createPortal(
          <>
            <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] z-[9999999998]" onClick={() => setIsClientModalOpen(false)} />
            <div className="fixed inset-0 modal z-[9999999999] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Información del Cliente - {selectedClient.firstName} {selectedClient.lastName}
                  </h2>
                  <button
                    onClick={() => setIsClientModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Información Personal */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombre Completo
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedClient.firstName} {selectedClient.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedClient.email}
                        </p>
                      </div>
                      {selectedClient.birthDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fecha de Nacimiento
                          </label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {selectedClient.birthDate}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Dirección
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedClient.address}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Código Fiscal
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedClient.fiscalCode}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Teléfono
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedClient.phoneNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Documentos Adjuntos */}
                  {(selectedClient.document1 || selectedClient.document2 || selectedClient.document3 || selectedClient.document4) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Documentos Adjuntos
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {selectedClient.document1 && (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Documento 1
                            </h4>
                            <div className="flex items-center justify-center h-24 bg-gray-50 dark:bg-gray-800 rounded">
                              {selectedClient.document1.includes('/image/') ? (
                                <img
                                  src={selectedClient.document1}
                                  alt="Documento 1"
                                  className="max-h-full max-w-full object-contain rounded"
                                />
                              ) : (
                                <button
                                  onClick={() => handleDownload(selectedClient.document1!, selectedClient.document1Name || 'documento1')}
                                  className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs">Descargar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedClient.document2 && (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Documento 2
                            </h4>
                            <div className="flex items-center justify-center h-24 bg-gray-50 dark:bg-gray-800 rounded">
                              {selectedClient.document2.includes('/image/') ? (
                                <img
                                  src={selectedClient.document2}
                                  alt="Documento 2"
                                  className="max-h-full max-w-full object-contain rounded"
                                />
                              ) : (
                                <button
                                  onClick={() => handleDownload(selectedClient.document2!, selectedClient.document2Name || 'documento2')}
                                  className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs">Descargar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedClient.document3 && (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Documento 3
                            </h4>
                            <div className="flex items-center justify-center h-24 bg-gray-50 dark:bg-gray-800 rounded">
                              {selectedClient.document3.includes('/image/') ? (
                                <img
                                  src={selectedClient.document3}
                                  alt="Documento 3"
                                  className="max-h-full max-w-full object-contain rounded"
                                />
                              ) : (
                                <button
                                  onClick={() => handleDownload(selectedClient.document3!, selectedClient.document3Name || 'documento3')}
                                  className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs">Descargar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedClient.document4 && (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Documento 4
                            </h4>
                            <div className="flex items-center justify-center h-24 bg-gray-50 dark:bg-gray-800 rounded">
                              {selectedClient.document4.includes('/image/') ? (
                                <img
                                  src={selectedClient.document4}
                                  alt="Documento 4"
                                  className="max-h-full max-w-full object-contain rounded"
                                />
                              ) : (
                                <button
                                  onClick={() => handleDownload(selectedClient.document4!, selectedClient.document4Name || 'documento4')}
                                  className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs">Descargar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end flex-shrink-0">
                  <button
                    onClick={() => setIsClientModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

        {/* Tabla de detalles de pasajeros */}
        <PassengerDetailsTable
          records={records}
          isOpen={isPassengerDetailsOpen}
          onClose={handleClosePassengerDetails}
          onUpdateRecords={setRecords}
        />

        {/* Tabla simplificada de detalles de pasajeros */}
        <PassengerDetailsTableSimple
          records={records}
          isOpen={isPassengerDetailsSimpleOpen}
          onClose={handleClosePassengerDetailsSimple}
          onUpdateRecords={setRecords}
        />
    </div>
  );
}


