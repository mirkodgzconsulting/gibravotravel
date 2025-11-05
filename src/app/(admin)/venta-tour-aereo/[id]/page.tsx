"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { CopyNotification } from "@/components/ui/notification/CopyNotification";
import { cachedFetch } from "@/utils/cachedFetch";
import * as XLSX from 'xlsx';
import { 
  PlaneIcon, 
  PlusIcon, 
  EditIcon, 
  TrashIcon,
  DollarSignIcon,
  UsersIcon,
  CalendarIcon,
  TrendingUpIcon,
  FileTextIcon
} from "lucide-react";

interface TourAereo {
  id: string;
  titulo: string;
  precioAdulto: number;
  precioNino: number;
  fechaViaje: string | null;
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

interface CuotaVenta {
  id?: string;
  numeroCuota: number;
  fechaPago: string;
  monto: number;
  nota?: string;
  estado: string;
  attachedFile?: File | string | null;
  attachedFileName?: string | null;
}

interface VentaTourAereo {
  id: string;
  clienteId?: string | null;
  pasajero: string;
  codiceFiscale: string;
  indirizzo: string;
  email: string;
  numeroTelefono: string;
  paisOrigen: string;
  iata: string;
  pnr: string | null;
  hotel: number | null;
  transfer: number | null;
  venduto: number;
  acconto: number;
  daPagare: number;
  metodoPagamento: string;
  metodoCompra?: string | null;
  stato: string;
  attachedFile?: string | null;
  attachedFileName?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  cuotas?: CuotaVenta[];
  creator: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

interface Cliente {
  id: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  address: string;
  email: string;
  phoneNumber: string;
  birthPlace: string;
  birthDate: string;
  document1?: string | null;
  document1Name?: string | null;
  document2?: string | null;
  document2Name?: string | null;
  document3?: string | null;
  document3Name?: string | null;
  document4?: string | null;
  document4Name?: string | null;
}

interface IATA {
  id: string;
  iata: string;
}

interface MetodoPagamento {
  id: string;
  metodoPagamento: string;
}

interface Pagamento {
  id: string;
  pagamento: string;
}

interface Acquisto {
  id: string;
  acquisto: string;
}

interface VentaFormData {
  clienteId: string;
  pasajero: string;
  codiceFiscale: string;
  indirizzo: string;
  email: string;
  numeroTelefono: string;
  paisOrigen: string;
  iata: string[];
  pnr: string;
  hotel: string;
  transfer: string;
  venduto: string;
  acconto: string;
  metodoPagamento: string[];
  metodoCompra: string;
  stato: string;
  cuotas: CuotaVenta[];
}

export default function VentaTourAereoPage() {
  const params = useParams();
  const tourId = params.id as string;
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();

  const handleCloseModal = () => {
    closeModal();
    setEditingVenta(null);
    setIsEditMode(false);
    setAttachedFile(null);
    setClientSearchTerm('');
    setShowClientDropdown(false);
  };
  
  const [tour, setTour] = useState<TourAereo | null>(null);
  const [ventas, setVentas] = useState<VentaTourAereo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [iatas, setIatas] = useState<IATA[]>([]);
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamento[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [acquisti, setAcquisti] = useState<Acquisto[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [expandedNotas, setExpandedNotas] = useState<{tour: boolean, coordinador: boolean}>({
    tour: false,
    coordinador: false
  });
  const [editingNotas, setEditingNotas] = useState<{tour: boolean, coordinador: boolean}>({
    tour: false,
    coordinador: false
  });
  const [tempNotas, setTempNotas] = useState<{tour: string, coordinador: string}>({
    tour: '',
    coordinador: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStatoId, setEditingStatoId] = useState<string | null>(null);
  const [editingMetodoCompraId, setEditingMetodoCompraId] = useState<string | null>(null);
  const [tempMetodoCompra, setTempMetodoCompra] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingVenta, setEditingVenta] = useState<VentaTourAereo | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [viewingFiles, setViewingFiles] = useState<VentaTourAereo | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  // Estados para lazy loading de clientes (solo cargar cuando se abra el modal)
  const [clientesLoaded, setClientesLoaded] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Estados para búsqueda de cliente (Pasajero)
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');
  const [showClientDropdown, setShowClientDropdown] = useState<boolean>(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Estados para manejo de cuotas
  const [numeroCuotas, setNumeroCuotas] = useState<number>(0);
  const [cuotas, setCuotas] = useState<CuotaVenta[]>([]);
  const [isLoadingCuotas, setIsLoadingCuotas] = useState(false);
  const cuotasInicializadas = useRef(false);

  const [formData, setFormData] = useState<VentaFormData>({
    clienteId: "",
    pasajero: "",
    codiceFiscale: "",
    indirizzo: "",
    email: "",
    numeroTelefono: "",
    paisOrigen: "",
    iata: [],
    pnr: "",
    hotel: "",
    transfer: "",
    venduto: "",
    acconto: "",
    metodoPagamento: [],
    metodoCompra: "",
    stato: "",
    cuotas: []
  });

  // Estado para el tipo de pasajero (adulto/nino)
  const [tipoPasajero, setTipoPasajero] = useState<'adulto' | 'nino' | null>(null);

  // Estados para dropdowns de multiselección
  const [iataSearchTerm, setIataSearchTerm] = useState("");
  const [showIataDropdown, setShowIataDropdown] = useState(false);
  const [metodoPagamentoSearchTerm, setMetodoPagamentoSearchTerm] = useState("");
  const [showMetodoPagamentoDropdown, setShowMetodoPagamentoDropdown] = useState(false);



  // Función para manejar el cambio de tipo de pasajero
  const handleTipoPasajeroChange = useCallback((tipo: 'adulto' | 'nino') => {
    setTipoPasajero(tipo);
    
    // Actualizar el campo venduto automáticamente
    if (tipo === 'adulto' && tour?.precioAdulto) {
      setFormData(prev => ({ ...prev, venduto: tour.precioAdulto.toString() }));
    } else if (tipo === 'nino' && tour?.precioNino) {
      setFormData(prev => ({ ...prev, venduto: tour.precioNino.toString() }));
    }
  }, [tour]);

  // Handler para toggle de IATA (selección múltiple)
  const handleIataToggle = useCallback((iata: string) => {
    setFormData(prev => {
      const currentIatas = prev.iata || [];
      const isSelected = currentIatas.includes(iata);
      
      if (isSelected) {
        return {
          ...prev,
          iata: currentIatas.filter(i => i !== iata)
        };
      } else {
        return {
          ...prev,
          iata: [...currentIatas, iata]
        };
      }
    });
    setIataSearchTerm('');
  }, []);

  // Handler para toggle de MetodoPagamento (selección múltiple)
  const handleMetodoPagamentoToggle = useCallback((metodo: string) => {
    setFormData(prev => {
      const currentMetodos = prev.metodoPagamento || [];
      const isSelected = currentMetodos.includes(metodo);
      
      if (isSelected) {
        return {
          ...prev,
          metodoPagamento: currentMetodos.filter(m => m !== metodo)
        };
      } else {
        return {
          ...prev,
          metodoPagamento: [...currentMetodos, metodo]
        };
      }
    });
    setMetodoPagamentoSearchTerm('');
  }, []);

  // Función para filtrar IATA (memoizada)
  const filteredIatas = useMemo(() => {
    if (!iatas || !Array.isArray(iatas)) return [];
    const searchLower = iataSearchTerm.toLowerCase();
    return iatas.filter(iata => 
      iata.iata.toLowerCase().includes(searchLower)
    );
  }, [iatas, iataSearchTerm]);

  // Función para filtrar MetodoPagamento (memoizada)
  const filteredMetodoPagamento = useMemo(() => {
    if (!metodosPagamento || !Array.isArray(metodosPagamento)) return [];
    const searchLower = metodoPagamentoSearchTerm.toLowerCase();
    return metodosPagamento.filter(metodo => 
      metodo.metodoPagamento.toLowerCase().includes(searchLower)
    );
  }, [metodosPagamento, metodoPagamentoSearchTerm]);

  // Filtrar IATAs no seleccionados (memoizado)
  const availableIatas = useMemo(() => {
    return filteredIatas.filter(iata => !formData.iata.includes(iata.iata));
  }, [filteredIatas, formData.iata]);

  // Función optimizada para cargar todos los datos iniciales en paralelo
  const fetchInitialData = useCallback(async () => {
    if (!tourId || roleLoading) return;
    
    try {
      setLoading(true);
      setError(null);

      // Cargar tour y ventas en paralelo (no se cachean porque son datos dinámicos)
      // Cargar datos de referencia con cachedFetch (IATA, métodos de pago, pagamentos)
      const [tourResponse, ventasResponse, iatasData, metodosData, pagamentosData, acquistiData] = await Promise.all([
        fetch(`/api/tour-aereo/${tourId}`),
        fetch(`/api/tour-aereo/${tourId}/ventas`),
        cachedFetch<{ iatas?: IATA[] }>('/api/iata', { ttlMs: 30000 }),
        cachedFetch<{ metodosPagamento?: MetodoPagamento[] }>('/api/metodo-pagamento', { ttlMs: 30000 }),
        cachedFetch<{ pagamentos?: Pagamento[] }>('/api/pagamento', { ttlMs: 30000 }),
        cachedFetch<{ acquisti?: Acquisto[] }>('/api/acquisto', { ttlMs: 30000 })
      ]);

      // Procesar respuestas
      if (tourResponse.ok) {
        const tourData = await tourResponse.json();
        setTour(tourData.tour);
      }

      if (ventasResponse.ok) {
        const ventasData = await ventasResponse.json();
        setVentas(ventasData.ventas || []);
      }

      // Procesar datos de referencia
      setIatas(Array.isArray(iatasData.iatas) ? iatasData.iatas : (Array.isArray(iatasData) ? iatasData : []));
      setMetodosPagamento(Array.isArray(metodosData.metodosPagamento) ? metodosData.metodosPagamento : (Array.isArray(metodosData) ? metodosData : []));
      if ('pagamentos' in pagamentosData && Array.isArray(pagamentosData.pagamentos)) {
        setPagamentos(pagamentosData.pagamentos);
      } else if (Array.isArray(pagamentosData)) {
        setPagamentos(pagamentosData);
      }

      if ('acquisti' in acquistiData && Array.isArray(acquistiData.acquisti)) {
        setAcquisti(acquistiData.acquisti);
      } else if (Array.isArray(acquistiData)) {
        setAcquisti(acquistiData);
      }

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [tourId, roleLoading]);

  // Función optimizada para recargar ventas
  const fetchVentas = useCallback(async () => {
    if (!tourId) return;
    try {
      const response = await fetch(`/api/tour-aereo/${tourId}/ventas`);
      if (response.ok) {
        const data = await response.json();
        setVentas(data.ventas || []);
      }
    } catch (error) {
      console.error('Error fetching ventas:', error);
    }
  }, [tourId]);

  // Cargar datos iniciales cuando se monta el componente y el rol está listo
  useEffect(() => {
    if (!roleLoading && tourId) {
      fetchInitialData();
    }
  }, [roleLoading, tourId, fetchInitialData]);

  // Cargar datos iniciales (mantener compatibilidad con código existente si lo hay)
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Función optimizada para cargar clientes bajo demanda (solo cuando se abra el modal)
  const loadClientesIfNeeded = useCallback(async () => {
    if (clientesLoaded || loadingClientes) return;
    
    setLoadingClientes(true);
    try {
      const clientsData = await cachedFetch<{ clients?: Cliente[] }>('/api/clients', { ttlMs: 15000 });
      const clientsArray = clientsData.clients || clientsData;
      setClientes(Array.isArray(clientsArray) ? clientsArray : []);
        setClientesLoaded(true);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  }, [clientesLoaded, loadingClientes]);

  // Cargar clientes cuando se abre el modal
  useEffect(() => {
    if (isClientModalOpen && !clientesLoaded) {
      loadClientesIfNeeded();
    }
  }, [isClientModalOpen, clientesLoaded, loadClientesIfNeeded]);

  // Cerrar dropdown de clientes al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showClientDropdown && clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showClientDropdown]);

  // Wrapper para openModal que carga clientes primero
  const handleOpenCreateModal = useCallback(async () => {
    await loadClientesIfNeeded();
    setClientSearchTerm('');
    setShowClientDropdown(false);
    openModal();
  }, [loadClientesIfNeeded, openModal]);

  // Manejar cambio de número de cuotas
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
        fechaPago: '',
        monto: 0,
        nota: '',
        estado: 'Pendiente',
        attachedFile: null
      }));
      setCuotas(nuevasCuotas);
      cuotasInicializadas.current = true;
    } else {
      setCuotas([]);
      cuotasInicializadas.current = false;
    }
  }, [numeroCuotas, isLoadingCuotas]);

  useEffect(() => {
    if (!roleLoading && tourId) {
      fetchTourData();
      // NO cargar clientes automáticamente - se cargarán cuando se abra el modal (lazy loading)
      fetchIatas();
      fetchMetodosPagamento();
      fetchPagamentos();
    }
  }, [roleLoading, tourId]);

  const fetchTourData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tour-aereo/${tourId}`);
      if (response.ok) {
        const data = await response.json();
        setTour(data.tour);
        await fetchVentas();
      } else {
        setError('Error al cargar el tour');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };



  const fetchIatas = async () => {
    try {
      const response = await fetch('/api/iata');
      if (response.ok) {
        const data = await response.json();
        setIatas(data || []);
      }
    } catch (error) {
      console.error('Error fetching iatas:', error);
      setIatas([]);
    }
  };

  const fetchMetodosPagamento = async () => {
    try {
      const response = await fetch('/api/metodo-pagamento');
      if (response.ok) {
        const data = await response.json();
        setMetodosPagamento(data.metodosPagamento || []);
      }
    } catch (error) {
      console.error('Error fetching metodos pagamento:', error);
      setMetodosPagamento([]);
    }
  };

  const fetchPagamentos = async () => {
    try {
      const response = await fetch('/api/pagamento');
      if (response.ok) {
        const data = await response.json();
        setPagamentos(data || []);
      }
    } catch (error) {
      console.error('Error fetching pagamentos:', error);
      setPagamentos([]);
    }
  };

  const handleClienteChange = useCallback((clienteId: string) => {
    // Resetear el tipo de pasajero cuando se cambia el cliente
    setTipoPasajero(null);
    setFormData(prev => ({ ...prev, venduto: "" }));
    
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setFormData(prev => ({
        ...prev,
        clienteId,
        pasajero: `${cliente.firstName} ${cliente.lastName}`,
        codiceFiscale: cliente.fiscalCode,
        indirizzo: cliente.address,
        email: cliente.email,
        numeroTelefono: cliente.phoneNumber,
        paisOrigen: cliente.birthPlace
      }));
    }
  }, [clientes]);

  const handleClientSelect = useCallback((clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setClientSearchTerm(`${cliente.firstName} ${cliente.lastName}`);
      setShowClientDropdown(false);
      // Resetear el tipo de pasajero cuando se cambia el cliente
      setTipoPasajero(null);
      setFormData(prev => ({ ...prev, venduto: "" }));
      setFormData(prev => ({
        ...prev,
        clienteId,
        pasajero: `${cliente.firstName} ${cliente.lastName}`,
        codiceFiscale: cliente.fiscalCode,
        indirizzo: cliente.address,
        email: cliente.email,
        numeroTelefono: cliente.phoneNumber,
        paisOrigen: cliente.birthPlace
      }));
    }
  }, [clientes]);

  // Handlers memoizados para los campos del formulario (para evitar re-renders innecesarios)
  const handleInputChange = useCallback((field: keyof VentaFormData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    }, []);

  // Cálculo memoizado de "Da pagare" para evitar recalcular en cada render
  const daPagare = useMemo(() => {
    return (parseFloat(formData.venduto || '0') - parseFloat(formData.acconto || '0')).toFixed(2);
  }, [formData.venduto, formData.acconto]);

  // Memoizar opciones de clientes para evitar re-renders innecesarios
  const clientesOptions = useMemo(() => {
    if (!clientes || clientes.length === 0) return [];
    return clientes.map((cliente) => ({
      id: cliente.id,
      label: `${cliente.firstName} ${cliente.lastName}`
    }));
  }, [clientes]);

  // Filtrar clientes para la búsqueda (busca en nombre, apellido, email, teléfono y código fiscal)
  const filteredClients = useMemo(() => {
    if (!clientes || clientes.length === 0) return [];
    if (!clientSearchTerm.trim()) {
      // Si no hay término de búsqueda, devolver los primeros 50 clientes
      return clientes.slice(0, 50);
    }
    const searchLower = clientSearchTerm.toLowerCase().trim();
    const filtered = clientes.filter(client => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = (client.phoneNumber || '').toLowerCase();
      const fiscalCode = (client.fiscalCode || '').toLowerCase();
      
      return fullName.includes(searchLower) ||
             email.includes(searchLower) ||
             phone.includes(searchLower) ||
             fiscalCode.includes(searchLower);
    });
    // Limitar a 50 resultados para mejorar el rendimiento
    return filtered.slice(0, 50);
  }, [clientes, clientSearchTerm]);

  // Filtrar ventas por búsqueda (Pasajero, Stato, Metodo di Acquisto)
  const filteredVentas = useMemo(() => {
    if (!ventas || ventas.length === 0) return [];
    if (!searchTerm.trim()) return ventas;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return ventas.filter(venta => {
      // Buscar en Pasajero
      const pasajero = (venta.pasajero || '').toLowerCase();
      if (pasajero.includes(searchLower)) return true;
      
      // Buscar en Stato
      const stato = (venta.stato || '').toLowerCase();
      if (stato.includes(searchLower)) return true;
      
      // Buscar en Metodo di Acquisto
      const metodoCompra = (venta.metodoCompra || '').toLowerCase();
      if (metodoCompra.includes(searchLower)) return true;
      
      return false;
    });
  }, [ventas, searchTerm]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
       
      // Validar que al menos un IATA esté seleccionado
      if (!formData.iata || formData.iata.length === 0) {
        setMessage({ type: 'error', text: 'Debe seleccionar al menos un IATA' });
        setIsSubmitting(false);
        return;
      }

      // Validar que al menos un método de pago esté seleccionado
      if (!formData.metodoPagamento || formData.metodoPagamento.length === 0) {
        setMessage({ type: 'error', text: 'Debe seleccionar al menos un método de pago' });
        setIsSubmitting(false);
        return;
      }

      // Preparar FormData para enviar archivos
      const formDataToSend = new FormData();
      
      // Agregar campos del formulario (manejar arrays como JSON)
      formDataToSend.append('clienteId', formData.clienteId);
      formDataToSend.append('pasajero', formData.pasajero);
      formDataToSend.append('codiceFiscale', formData.codiceFiscale);
      formDataToSend.append('indirizzo', formData.indirizzo);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('numeroTelefono', formData.numeroTelefono);
      formDataToSend.append('paisOrigen', formData.paisOrigen);
      formDataToSend.append('iata', JSON.stringify(formData.iata)); // Convertir array a JSON
      formDataToSend.append('pnr', formData.pnr);
      formDataToSend.append('hotel', formData.hotel);
      formDataToSend.append('transfer', formData.transfer);
      formDataToSend.append('venduto', formData.venduto);
      formDataToSend.append('acconto', formData.acconto);
      formDataToSend.append('metodoPagamento', JSON.stringify(formData.metodoPagamento)); // Convertir array a JSON
      formDataToSend.append('metodoCompra', formData.metodoCompra);
      formDataToSend.append('stato', formData.stato);

      // Agregar archivo principal si existe
      if (attachedFile) {
        formDataToSend.append('file', attachedFile);
      }
      
      // Agregar cuotas como JSON
      const cuotasParaEnviar = cuotas.map(c => ({
        numeroCuota: c.numeroCuota,
        fechaPago: c.fechaPago,
        monto: c.monto,
        nota: c.nota
      }));
      formDataToSend.append('cuotas', JSON.stringify(cuotasParaEnviar));

      // Agregar archivos de cuotas
      cuotas.forEach((cuota: any, index: number) => {
        if (cuota.attachedFile) {
          formDataToSend.append(`cuotaFile${index}`, cuota.attachedFile);
        }
      });

      const response = await fetch(`/api/tour-aereo/${tourId}/ventas`, {
        method: 'POST',
        body: formDataToSend, // Sin Content-Type header para FormData
      });

      if (response.ok) {
        const data = await response.json();
        setVentas(prev => [data.venta, ...prev]);
        setFormData({
          clienteId: "",
          pasajero: "",
          codiceFiscale: "",
          indirizzo: "",
          email: "",
          numeroTelefono: "",
          paisOrigen: "",
          iata: [],
          pnr: "",
          hotel: "",
          transfer: "",
          venduto: "",
          acconto: "",
          metodoPagamento: [],
          metodoCompra: "",
          stato: "",
          cuotas: []
        });
        setCuotas([]);
        setNumeroCuotas(0);
        setAttachedFile(null);
        closeModal();
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 3000);
      } else {
        const errorData = await response.json();
          const errorMessage = errorData.error || 'Error al crear venta';
          setMessage({ type: 'error', text: errorMessage });
          setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
        console.error('Error al crear venta:', error);
        setMessage({ type: 'error', text: 'Error de conexión al crear la venta' });
        setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVenta = useCallback(async (ventaId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) return;

    try {
      const response = await fetch(`/api/tour-aereo/ventas/${ventaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Recargar las ventas para asegurar que tenemos los datos actualizados
        await fetchVentas();
        setMessage({
          type: 'success',
          text: 'Venta eliminada correctamente'
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Error al eliminar venta' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      setMessage({ type: 'error', text: 'Error de conexión al eliminar la venta' });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [fetchVentas]);

  // Función para exportar a Excel
  const handleExportToExcel = useCallback(() => {
    const dataToExport = filteredVentas.map(venta => ({
      'Pasajero': venta.pasajero || '',
      'Codice Fiscale': venta.codiceFiscale || '',
      'Indirizzo': venta.indirizzo || '',
      'Email': venta.email || '',
      'Telefono': venta.numeroTelefono || '',
      'País de origen': venta.paisOrigen || '',
      'IATA': (() => {
        try {
          const parsed = typeof venta.iata === 'string' 
            ? JSON.parse(venta.iata) 
            : venta.iata;
          return Array.isArray(parsed) ? parsed.join(', ') : venta.iata || '';
        } catch {
          return venta.iata || '';
        }
      })(),
      'PNR': venta.pnr || '',
      'Hotel (€)': venta.hotel || 0,
      'Transfer (€)': venta.transfer || 0,
      'Venduto (€)': venta.venduto || 0,
      'Acconto (€)': venta.acconto || 0,
      'Da pagare (€)': venta.daPagare || 0,
      'Metodo Pagamento': (() => {
        try {
          const parsed = typeof venta.metodoPagamento === 'string' 
            ? JSON.parse(venta.metodoPagamento) 
            : venta.metodoPagamento;
          return Array.isArray(parsed) ? parsed.join(', ') : venta.metodoPagamento || '';
        } catch {
          return venta.metodoPagamento || '';
        }
      })(),
      'Metodo di Acquisto': venta.metodoCompra || '',
      'Stato': venta.stato || '',
      'Agente': venta.creator?.firstName 
        ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
        : venta.creator?.email || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas Tour Aereo');
    
    const fileName = `ventas_tour_aereo_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [filteredVentas]);

  const handleEditVenta = useCallback(async (venta: VentaTourAereo) => {
    await loadClientesIfNeeded();
    setEditingVenta(venta);
    // Establecer el término de búsqueda con el nombre del pasajero
    setClientSearchTerm(venta.pasajero || '');
    setFormData({
      clienteId: venta.clienteId || '',
      pasajero: venta.pasajero,
      codiceFiscale: venta.codiceFiscale,
      indirizzo: venta.indirizzo,
      email: venta.email,
      numeroTelefono: venta.numeroTelefono,
      paisOrigen: venta.paisOrigen,
      iata: (() => {
        try {
          const parsed = typeof venta.iata === 'string' ? JSON.parse(venta.iata) : venta.iata;
          return Array.isArray(parsed) ? parsed : [venta.iata].filter(Boolean);
        } catch {
          return venta.iata ? [venta.iata] : [];
        }
      })(),
      pnr: venta.pnr || "",
      hotel: venta.hotel?.toString() || "",
      transfer: venta.transfer?.toString() || "",
      venduto: venta.venduto.toString(),
      acconto: venta.acconto.toString(),
      metodoPagamento: (() => {
        try {
          const parsed = typeof venta.metodoPagamento === 'string' ? JSON.parse(venta.metodoPagamento) : venta.metodoPagamento;
          return Array.isArray(parsed) ? parsed : [venta.metodoPagamento].filter(Boolean);
        } catch {
          return venta.metodoPagamento ? [venta.metodoPagamento] : [];
        }
      })(),
      metodoCompra: venta.metodoCompra || "",
      stato: venta.stato,
      cuotas: []
    });
    
    // Manejar cuotas
    const ventaCuotas = venta.cuotas || [];
    if (ventaCuotas.length > 0) {
      setIsLoadingCuotas(true);
      cuotasInicializadas.current = false;
      
      setTimeout(() => {
        setNumeroCuotas(ventaCuotas.length);
        
        const cuotasFormato = ventaCuotas.map(cuota => ({
          id: cuota.id, // Mantener el ID de la cuota
          numeroCuota: cuota.numeroCuota,
          fechaPago: cuota.fechaPago ? new Date(cuota.fechaPago).toISOString().split('T')[0] : '',
          monto: cuota.monto,
          nota: cuota.nota || '',
          estado: cuota.estado || "Pendiente",
          attachedFile: cuota.attachedFile || null, // Mantener el archivo existente
          attachedFileName: cuota.attachedFileName || null // Mantener el nombre del archivo
        }));
        
        setCuotas(cuotasFormato);
        cuotasInicializadas.current = true;
        
        setTimeout(() => setIsLoadingCuotas(false), 50);
      }, 0);
    } else {
      setNumeroCuotas(0);
      setCuotas([]);
      cuotasInicializadas.current = false;
    }
    
    setIsEditMode(true);
    openModal();
  }, [loadClientesIfNeeded, openModal]);

  const handleUpdateVenta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !editingVenta) return;

    setIsSubmitting(true);
    try {
      // Validar que al menos un IATA esté seleccionado
      if (!formData.iata || formData.iata.length === 0) {
        setMessage({ type: 'error', text: 'Debe seleccionar al menos un IATA' });
        setIsSubmitting(false);
        return;
      }

      // Validar que al menos un método de pago esté seleccionado
      if (!formData.metodoPagamento || formData.metodoPagamento.length === 0) {
        setMessage({ type: 'error', text: 'Debe seleccionar al menos un método de pago' });
        setIsSubmitting(false);
        return;
      }

      // Preparar FormData para enviar archivos
      const formDataToSend = new FormData();
      
      // Agregar campos del formulario (manejar arrays como JSON)
      formDataToSend.append('clienteId', formData.clienteId);
      formDataToSend.append('pasajero', formData.pasajero);
      formDataToSend.append('codiceFiscale', formData.codiceFiscale);
      formDataToSend.append('indirizzo', formData.indirizzo);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('numeroTelefono', formData.numeroTelefono);
      formDataToSend.append('paisOrigen', formData.paisOrigen);
      formDataToSend.append('iata', JSON.stringify(formData.iata)); // Convertir array a JSON
      formDataToSend.append('pnr', formData.pnr);
      formDataToSend.append('hotel', formData.hotel);
      formDataToSend.append('transfer', formData.transfer);
      formDataToSend.append('venduto', formData.venduto);
      formDataToSend.append('acconto', formData.acconto);
      formDataToSend.append('metodoPagamento', JSON.stringify(formData.metodoPagamento)); // Convertir array a JSON
      formDataToSend.append('metodoCompra', formData.metodoCompra);
      formDataToSend.append('stato', formData.stato);

      // Agregar archivo principal si existe
      if (attachedFile) {
        formDataToSend.append('file', attachedFile);
      }
      
      // Agregar cuotas como JSON (incluyendo archivos existentes)
      const cuotasParaEnviar = cuotas.map(c => ({
        id: c.id, // Incluir ID si existe (para actualizar cuotas existentes)
        numeroCuota: c.numeroCuota,
        fechaPago: c.fechaPago,
        monto: c.monto,
        nota: c.nota,
        estado: c.estado,
        // Mantener archivo existente si no se subió uno nuevo
        attachedFile: typeof c.attachedFile === 'string' ? c.attachedFile : null,
        attachedFileName: typeof c.attachedFile === 'string' ? c.attachedFileName : null
      }));
      formDataToSend.append('cuotas', JSON.stringify(cuotasParaEnviar));

      // Agregar archivos nuevos de cuotas
      cuotas.forEach((cuota: any, index: number) => {
        if (cuota.attachedFile && typeof cuota.attachedFile !== 'string') {
          formDataToSend.append(`cuotaFile${index}`, cuota.attachedFile);
        }
      });

      const response = await fetch(`/api/tour-aereo/ventas/${editingVenta.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        // Recargar las ventas para asegurar que tenemos los datos actualizados
        await fetchVentas();
        setFormData({
          clienteId: "",
          pasajero: "",
          codiceFiscale: "",
          indirizzo: "",
          email: "",
          numeroTelefono: "",
          paisOrigen: "",
          iata: [],
          pnr: "",
          hotel: "",
          transfer: "",
          venduto: "",
          acconto: "",
          metodoPagamento: [],
          metodoCompra: "",
          stato: "",
          cuotas: []
        });
        setIsEditMode(false);
        setEditingVenta(null);
        setAttachedFile(null);
        setNumeroCuotas(0);
        setCuotas([]);
        setMessage({
          type: 'success',
          text: 'Venta actualizada correctamente'
        });
        closeModal();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Error al actualizar venta' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error al actualizar venta:', error);
      setMessage({ type: 'error', text: 'Error de conexión al actualizar la venta' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingVenta(null);
    setAttachedFile(null);
    // Resetear cuotas
    setNumeroCuotas(0);
    setCuotas([]);
    setIsLoadingCuotas(false);
    cuotasInicializadas.current = false;
    setFormData({
      clienteId: "",
      pasajero: "",
      codiceFiscale: "",
      indirizzo: "",
      email: "",
      numeroTelefono: "",
      paisOrigen: "",
      iata: [],
      pnr: "",
      hotel: "",
      transfer: "",
      venduto: "",
      acconto: "",
      metodoPagamento: [],
      metodoCompra: "",
      stato: "",
      cuotas: []
    });
  };

  // Funciones para manejar la edición inline de Método de Compra
  const startEditingMetodoCompra = useCallback((venta: VentaTourAereo) => {
    setEditingMetodoCompraId(venta.id);
    setTempMetodoCompra(venta.metodoCompra || '');
  }, []);

  const saveMetodoCompra = useCallback(async (ventaId: string) => {
    setEditingMetodoCompraId(null);
    
    try {
      const response = await fetch(`/api/tour-aereo/ventas/${ventaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metodoCompra: tempMetodoCompra }),
      });

      if (response.ok) {
        setVentas(prev => prev.map(v => 
          v.id === ventaId ? { ...v, metodoCompra: tempMetodoCompra } : v
        ));
        setMessage({
          type: 'success',
          text: 'Método de compra actualizado correctamente'
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error al actualizar el método de compra'
      });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [tempMetodoCompra]);

  const cancelEditingMetodoCompra = useCallback(() => {
    setEditingMetodoCompraId(null);
    setTempMetodoCompra('');
  }, []);

  // Funciones para manejar cuotas
  const addCuota = useCallback(() => {
    setCuotas(prev => {
      if (prev.length < 3) {
        const nuevaCuota: CuotaVenta = {
          numeroCuota: prev.length + 1,
          fechaPago: "",
          monto: 0,
          nota: "",
          estado: "Pendiente",
          attachedFile: null
        };
        setNumeroCuotas(prev.length + 1);
        return [...prev, nuevaCuota];
      }
      return prev;
    });
  }, []);

  const removeCuota = useCallback((index: number) => {
    setCuotas(prev => prev.filter((_, i) => i !== index).map((cuota, i) => ({
      ...cuota,
      numeroCuota: i + 1
    })));
    setNumeroCuotas(prev => prev - 1);
  }, []);

  const updateCuota = useCallback((index: number, field: string, value: string | number | File | null) => {
    setCuotas(prev => prev.map((cuota, i) => 
      i === index ? { ...cuota, [field]: value } : cuota
    ));
  }, []);

  // Funciones para editar notas
  const startEditingNotas = useCallback((type: 'tour' | 'coordinador') => {
    setEditingNotas(prev => ({ ...prev, [type]: true }));
    setTempNotas(prev => ({
      ...prev,
      [type]: type === 'tour' ? (tour?.notas || '') : (tour?.notasCoordinador || '')
    }));
  }, [tour]);

  const saveNotas = async (type: 'tour' | 'coordinador') => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', tour?.titulo || '');
      formDataToSend.append('precioAdulto', tour?.precioAdulto.toString() || '0');
      formDataToSend.append('precioNino', tour?.precioNino.toString() || '0');
      formDataToSend.append('fechaViaje', tour?.fechaViaje ? new Date(tour.fechaViaje).toISOString().split('T')[0] : '');
      formDataToSend.append('meta', tour?.meta.toString() || '0');
      formDataToSend.append('acc', tour?.acc || '');
      formDataToSend.append('guidaLocale', tour?.guidaLocale?.toString() || '');
      formDataToSend.append('coordinatore', tour?.coordinatore?.toString() || '');
      formDataToSend.append('transporte', tour?.transporte?.toString() || '');
      formDataToSend.append('notas', type === 'tour' ? tempNotas.tour : (tour?.notas || ''));
      formDataToSend.append('notasCoordinador', type === 'coordinador' ? tempNotas.coordinador : (tour?.notasCoordinador || ''));
      formDataToSend.append('descripcion', tour?.descripcion || '');

      const response = await fetch(`/api/tour-aereo/${tourId}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setTour(data.tour);
        setEditingNotas(prev => ({ ...prev, [type]: false }));
        setMessage({
          type: 'success',
          text: 'Notas actualizadas correctamente'
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: 'Error al actualizar las notas'
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error de conexión'
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const cancelEditingNotas = useCallback((type: 'tour' | 'coordinador') => {
    setEditingNotas(prev => ({ ...prev, [type]: false }));
    setTempNotas(prev => ({
      ...prev,
      [type]: ''
    }));
  }, []);

  // Funciones para manejar archivos
  const handleViewFiles = useCallback((venta: VentaTourAereo) => {
    setViewingFiles(venta);
    setIsFileViewerOpen(true);
  }, []);

  const handleDownload = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error descargando archivo:', error);
      alert('Error al descargar el archivo');
    }
  }, []);

  const countFiles = useCallback((venta: VentaTourAereo) => {
    let count = 0;
    if (venta.attachedFile) count++;
    if (venta.cuotas) {
      count += venta.cuotas.filter(c => c.attachedFile).length;
    }
    return count;
  }, []);

  const handleClientClick = useCallback(async (venta: VentaTourAereo) => {
    try {
      // Buscar el cliente por email o codiceFiscale
      const cliente = clientes.find(c => 
        c.email === venta.email || c.fiscalCode === venta.codiceFiscale
      );
      
      if (cliente) {
        setSelectedClient(cliente);
        setIsClientModalOpen(true);
      } else {
        setMessage({
          type: 'error',
          text: 'Cliente no encontrado en la base de datos'
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error al cargar información del cliente'
      });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [clientes]);

  // Calcular estadísticas (memoizadas)
  const ventasRealizadas = useMemo(() => ventas.length, [ventas]);
  const meta = useMemo(() => tour?.meta || 0, [tour?.meta]);
  const porcentajeVendido = useMemo(() => {
    const metaValue = tour?.meta || 0;
    return metaValue > 0 ? Math.round((ventas.length / metaValue) * 100) : 0;
  }, [ventas.length, tour?.meta]);
  // Ingresos totales (memoizado)
  const ingresos = useMemo(() => {
    return ventas.reduce((sum, venta) => sum + venta.venduto, 0);
  }, [ventas]);

  // Fecha de viaje formateada (memoizada)
  const fechaViajeFormateada = useMemo(() => {
    if (!tour?.fechaViaje) return null;
    return new Date(tour.fechaViaje).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [tour?.fechaViaje]);

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
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse mb-4"></div>
          <div className="flex gap-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>
        
        {/* Info del tour skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
          </div>
        </div>
        
        {/* Lista de ventas skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
            ))}
          </div>
        </div>
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

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Tour no encontrado
          </h1>
          <p className="text-gray-600">
            El tour que buscas no existe o no tienes acceso a él.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={`Ventas - ${tour.titulo}`} />
      
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

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      {/* Información del Tour */}
      <ComponentCard title="" className="mb-6">
        <div className="px-6 pt-2 pb-2">
          {/* Título del tour centrado */}
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {tour.titulo}
            </h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSignIcon className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Precio Adulto</span>
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                €{tour.precioAdulto}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSignIcon className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Precio Niño</span>
              </div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                €{tour.precioNino}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <UsersIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Meta</span>
              </div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {tour.meta}
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUpIcon className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Progreso</span>
              </div>
              <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                {porcentajeVendido}%
              </div>
            </div>

            {tour.acc && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <PlaneIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">ACC</span>
                </div>
                <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                  {tour.acc}
                </div>
              </div>
            )}

            {tour.guidaLocale && (
              <div className="bg-teal-50 dark:bg-teal-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <UsersIcon className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-medium text-teal-700 dark:text-teal-300">Guida</span>
                </div>
                <div className="text-lg font-bold text-teal-900 dark:text-teal-100">
                  €{tour.guidaLocale.toFixed(2)}
                </div>
              </div>
            )}

            {tour.coordinatore && (
              <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <UsersIcon className="w-4 h-4 text-cyan-600" />
                  <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Coord.</span>
                </div>
                <div className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                  €{tour.coordinatore.toFixed(2)}
                </div>
              </div>
            )}

            {tour.hotel && (
              <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <PlaneIcon className="w-4 h-4 text-pink-600" />
                  <span className="text-xs font-medium text-pink-700 dark:text-pink-300">Hotel</span>
                </div>
                <div className="text-lg font-bold text-pink-900 dark:text-pink-100">
                  €{tour.hotel.toFixed(2)}
                </div>
              </div>
            )}

            {tour.transfer && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <PlaneIcon className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Transfer</span>
                </div>
                <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                  €{tour.transfer.toFixed(2)}
                </div>
              </div>
            )}

            {tour.transporte && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <PlaneIcon className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Transporte</span>
                </div>
                <div className="text-lg font-bold text-red-900 dark:text-red-100">
                  €{tour.transporte.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Tarjetas de Notas */}
          {(tour.notas || tour.notasCoordinador) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {tour.notas && (
                <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <FileTextIcon className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notas del Tour</span>
                  </div>
                  <div 
                    className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded transition-colors"
                    onDoubleClick={() => startEditingNotas('tour')}
                  >
                    {editingNotas.tour ? (
                      <div className="space-y-2">
                        <textarea
                          value={tempNotas.tour}
                          onChange={(e) => setTempNotas(prev => ({ ...prev, tour: e.target.value }))}
                          className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveNotas('tour')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => cancelEditingNotas('tour')}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {tour.notas.length > 100 && !expandedNotas.tour ? (
                          <>
                            {tour.notas.substring(0, 100)}...
                            <button
                              onClick={() => setExpandedNotas(prev => ({ ...prev, tour: true }))}
                              className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                              Leer más
                            </button>
                          </>
                        ) : (
                          <>
                            {tour.notas}
                            {tour.notas.length > 100 && expandedNotas.tour && (
                              <button
                                onClick={() => setExpandedNotas(prev => ({ ...prev, tour: false }))}
                                className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                              >
                                Leer menos
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {tour.notasCoordinador && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                  <div className="flex items-center gap-2 mb-3">
                    <FileTextIcon className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Notas Coordinador</span>
                  </div>
                  <div 
                    className="text-sm text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800 p-2 rounded transition-colors"
                    onDoubleClick={() => startEditingNotas('coordinador')}
                  >
                    {editingNotas.coordinador ? (
                      <div className="space-y-2">
                        <textarea
                          value={tempNotas.coordinador}
                          onChange={(e) => setTempNotas(prev => ({ ...prev, coordinador: e.target.value }))}
                          className="w-full p-2 border border-amber-300 dark:border-amber-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-amber-700 dark:text-white"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveNotas('coordinador')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => cancelEditingNotas('coordinador')}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {tour.notasCoordinador.length > 100 && !expandedNotas.coordinador ? (
                          <>
                            {tour.notasCoordinador.substring(0, 100)}...
                            <button
                              onClick={() => setExpandedNotas(prev => ({ ...prev, coordinador: true }))}
                              className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                              Leer más
                            </button>
                          </>
                        ) : (
                          <>
                            {tour.notasCoordinador}
                            {tour.notasCoordinador.length > 100 && expandedNotas.coordinador && (
                              <button
                                onClick={() => setExpandedNotas(prev => ({ ...prev, coordinador: false }))}
                                className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                              >
                                Leer menos
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              Ingresos totales: <span className="font-semibold text-green-600">€{ingresos.toFixed(2)}</span>
            </div>
            {tour.fechaViaje && (
              <div>
                Fecha de Viaje: <span className="text-gray-900 dark:text-white">
                  {new Date(tour.fechaViaje).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </ComponentCard>


      {/* Modal para crear venta - Solo renderizar contenido cuando está abierto */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-2xl mx-4 max-h-[90vh] z-[99999]"
      >
        {isModalOpen && (
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header fijo */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? "Editar Venta" : "Nuevo Registro"}
            </h2>
          </div>
          
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4" onClick={(e) => {
            // Cerrar dropdowns al hacer clic fuera
            if ((e.target as HTMLElement).closest('.iata-dropdown-container') === null) {
              setShowIataDropdown(false);
            }
            if ((e.target as HTMLElement).closest('.metodo-pagamento-dropdown-container') === null) {
              setShowMetodoPagamentoDropdown(false);
            }
          }}>
            <form onSubmit={isEditMode ? handleUpdateVenta : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pasajero *
                  </label>
                  <div className="relative" ref={clientDropdownRef}>
                    <input
                      type="text"
                      value={clientSearchTerm}
                      onChange={(e) => {
                        setClientSearchTerm(e.target.value);
                        setShowClientDropdown(true);
                        if (!e.target.value) {
                          setFormData(prev => ({ ...prev, clienteId: '', pasajero: '' }));
                        }
                      }}
                      onFocus={() => {
                        if (filteredClients.length > 0) {
                          setShowClientDropdown(true);
                        }
                      }}
                      placeholder={loadingClientes ? 'Cargando clientes...' : 'Buscar cliente...'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                    />
                    
                    {/* Dropdown de clientes */}
                    {showClientDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredClients.length > 0 ? (
                          filteredClients.map((client) => (
                            <div
                              key={client.id}
                              onClick={() => handleClientSelect(client.id)}
                              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                            >
                              {client.firstName} {client.lastName}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            {loadingClientes ? 'Cargando clientes...' : 'No se encontraron clientes'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkboxes de tipo de pasajero - Solo se muestran si hay un pasajero seleccionado */}
                {formData.clienteId && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Tipo de Pasajero *
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoPasajero"
                          value="adulto"
                          checked={tipoPasajero === 'adulto'}
                          onChange={() => handleTipoPasajeroChange('adulto')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                          Adulto (€{tour?.precioAdulto || 0})
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="tipoPasajero"
                          value="nino"
                          checked={tipoPasajero === 'nino'}
                          onChange={() => handleTipoPasajeroChange('nino')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                          Niño (€{tour?.precioNino || 0})
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Codice Fiscale
                  </label>
                  <input
                    type="text"
                    value={formData.codiceFiscale}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Indirizzo
                  </label>
                  <input
                    type="text"
                    value={formData.indirizzo}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Numero di Telefono
                  </label>
                  <input
                    type="tel"
                    value={formData.numeroTelefono}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    País de origen
                  </label>
                  <input
                    type="text"
                    value={formData.paisOrigen}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed dark:text-gray-400"
                  />
                </div>

                {/* IATA Dropdown (selección múltiple) */}
                <div className="relative iata-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IATA *
                  </label>
                  <div className="relative">
                    <div className="min-h-[40px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex flex-wrap gap-1 items-center cursor-text"
                         onClick={() => setShowIataDropdown(true)}>
                      {formData.iata.map(iata => (
                        <div key={iata} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          <span className="mr-1">{iata}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleIataToggle(iata); }} className="text-blue-600 hover:text-blue-800 focus:outline-none ml-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                      <input type="text" value={iataSearchTerm} onChange={(e) => { setIataSearchTerm(e.target.value); setShowIataDropdown(true); }} onFocus={() => setShowIataDropdown(true)} placeholder={formData.iata.length === 0 ? "Buscar o seleccionar IATA..." : "Buscar IATA..."} className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-gray-900 dark:text-white" onClick={(e) => e.stopPropagation()} />
                    </div>
                    {showIataDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredIatas.filter(iata => !formData.iata.includes(iata.iata)).map(iata => (
                          <div key={iata.id} onClick={() => { handleIataToggle(iata.iata); setShowIataDropdown(false); }} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <div className="font-medium text-gray-900 dark:text-white">{iata.iata}</div>
                          </div>
                        ))}
                        {filteredIatas.filter(iata => !formData.iata.includes(iata.iata)).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No hay IATAs disponibles</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PNR
                  </label>
                  <input
                    type="text"
                    value={formData.pnr}
                    onChange={handleInputChange('pnr')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hotel (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hotel}
                    onChange={handleInputChange('hotel')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transfer (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.transfer}
                    onChange={handleInputChange('transfer')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Venduto (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.venduto}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 cursor-not-allowed dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Acconto (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.acconto}
                    onChange={handleInputChange('acconto')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Da pagare (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={daPagare}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>

              </div>

              {/* Sección de Cuotas - Se muestra automáticamente si Da Pagare > 0 */}
              {parseFloat(daPagare) > 0 && (
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Pago en Cuotas
                    </h3>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Número de cuotas:
                      </label>
                      <select
                        value={numeroCuotas}
                        onChange={(e) => {
                          const numCuotas = parseInt(e.target.value);
                          setNumeroCuotas(numCuotas);
                          // La lógica de creación de cuotas se maneja en el useEffect
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value={0}>Sin cuotas</option>
                        <option value={1}>1 cuota</option>
                        <option value={2}>2 cuotas</option>
                        <option value={3}>3 cuotas</option>
                      </select>
                    </div>
                  </div>

                  {cuotas.length > 0 && (
                    <div className="space-y-4">
                      {cuotas.map((cuota, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Cuota {cuota.numeroCuota}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeCuota(index)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Fecha de Pago *
                              </label>
                              <input
                                type="date"
                                value={cuota.fechaPago}
                                onChange={(e) => updateCuota(index, 'fechaPago', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Monto *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cuota.monto}
                                onChange={(e) => updateCuota(index, 'monto', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nota (Opcional)
                              </label>
                              <input
                                type="text"
                                value={cuota.nota || ''}
                                onChange={(e) => updateCuota(index, 'nota', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Nota opcional..."
                              />
                            </div>
                          </div>

                          {/* Archivo adjunto para la cuota */}
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Comprobante de Pago (opcional)
                            </label>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                              onChange={(e) => {
                                updateCuota(index, 'attachedFile', e.target.files?.[0] || null);
                              }}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                            />
                            {cuota.attachedFile && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{typeof cuota.attachedFile === 'string' ? 'Archivo adjunto' : cuota.attachedFile.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cuotas.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Selecciona el número de cuotas para configurar el plan de pagos.
                    </p>
                  )}
                </div>
              )}

              {/* Campos Pagamento, Metodo di Acquisto y Stato al final */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {/* MetodoPagamento Dropdown (selección múltiple) */}
                <div className="relative metodo-pagamento-dropdown-container">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pagamento * 
                  </label>
                  <div className="relative">
                    <div className="min-h-[40px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex flex-wrap gap-1 items-center cursor-text"
                         onClick={() => setShowMetodoPagamentoDropdown(true)}>
                      {/* Chips de métodos de pago seleccionados */}
                      {formData.metodoPagamento.map(metodo => (
                        <div
                          key={metodo}
                          className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          <span className="mr-1">{metodo}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMetodoPagamentoToggle(metodo);
                            }}
                            className="text-green-600 hover:text-green-800 focus:outline-none ml-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      
                      {/* Input de búsqueda */}
                      <input
                        type="text"
                        value={metodoPagamentoSearchTerm}
                        onChange={(e) => {
                          setMetodoPagamentoSearchTerm(e.target.value);
                          setShowMetodoPagamentoDropdown(true);
                        }}
                        onFocus={() => setShowMetodoPagamentoDropdown(true)}
                        placeholder={formData.metodoPagamento.length === 0 ? "Buscar o seleccionar método de pago..." : "Buscar método..."}
                        className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-gray-900 dark:text-white"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {showMetodoPagamentoDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredMetodoPagamento
                          .filter(metodo => !formData.metodoPagamento.includes(metodo.metodoPagamento))
                          .map(metodo => (
                            <div
                              key={metodo.id}
                              onClick={() => {
                                handleMetodoPagamentoToggle(metodo.metodoPagamento);
                                setShowMetodoPagamentoDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {metodo.metodoPagamento}
                              </div>
                            </div>
                          ))}
                        {filteredMetodoPagamento.filter(metodo => !formData.metodoPagamento.includes(metodo.metodoPagamento)).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No hay métodos de pago disponibles
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Metodo di Acquisto Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metodo di Acquisto
                  </label>
                  <select
                    value={formData.metodoCompra}
                    onChange={(e) => handleInputChange('metodoCompra')(e)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {acquisti.map((acquisto) => (
                      <option key={acquisto.id} value={acquisto.acquisto}>
                        {acquisto.acquisto}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stato *
                  </label>
                  <select
                    value={formData.stato}
                    onChange={handleInputChange('stato')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar estado...</option>
                    {pagamentos && pagamentos.map((pagamento) => (
                      <option key={pagamento.id} value={pagamento.pagamento}>
                        {pagamento.pagamento}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campo de archivo principal */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Archivo Adjunto (opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,.doc,.docx"
                    onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50"
                >
                  {isSubmitting 
                    ? (isEditMode ? 'Actualizando...' : 'Guardando...') 
                    : (isEditMode ? 'Actualizar Venta' : 'Generar Venta')}
                </button>
              </div>
            </form>
          </div>
        </div>
        )}
      </Modal>

      

      {/* Tabla de ventas */}
      <ComponentCard title="">
        {/* Controles: Buscador, Botón Exportar y Botón Generar Venta */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[250px]">
            {/* Buscador */}
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <input
                                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Pasajero, Stato, Metodo di Acquisto..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                              />
                            </div>
                          </div>

          <div className="flex items-center gap-2">
            {/* Botón Exportar a Excel */}
                          <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
            >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
              Exportar a Excel
                </button>
            
        {/* Botón para generar venta */}
          <button
            onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <PlusIcon className="w-5 h-5" />
            Generar Venta
          </button>
          </div>
        </div>

        {filteredVentas.length === 0 ? (
          <div className="text-center py-12">
            <PlaneIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm.trim() ? 'No se encontraron resultados' : 'No hay ventas registradas'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm.trim() ? 'Intenta con otros términos de búsqueda' : 'Genera tu primera venta para comenzar'}
            </p>
            {!searchTerm.trim() && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg"
            >
              Generar Venta
            </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-[#0366D6]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Pasajero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Metodo di Acquisto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Transfer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Guida Locale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Coordinatore
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Transporte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Hotel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Neto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    IATA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    PNR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Venduto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Acconto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Da Pagare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Agente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Archivos
                  </th>
                  <th className="sticky right-0 px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-[#0366D6] z-10 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredVentas && filteredVentas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleClientClick(venta)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer font-medium"
                        title="Ver información del cliente"
                      >
                        {venta.pasajero}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingStatoId === venta.id ? (
                        <select
                          value={venta.stato}
                          autoFocus
                          onBlur={() => setEditingStatoId(null)}
                          onChange={async (e) => {
                            const newValue = e.target.value;
                            setEditingStatoId(null);
                            
                            try {
                              const response = await fetch(`/api/tour-aereo/ventas/${venta.id}`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ stato: newValue }),
                              });

                              if (response.ok) {
                                setVentas(prev => prev.map(v => 
                                  v.id === venta.id ? { ...v, stato: newValue } : v
                                ));
                                setMessage({
                                  type: 'success',
                                  text: 'Estado actualizado correctamente'
                                });
                                setTimeout(() => setMessage(null), 3000);
                              } else {
                                throw new Error('Error al actualizar');
                              }
                            } catch (error) {
                              setMessage({
                                type: 'error',
                                text: 'Error al actualizar el estado'
                              });
                              setTimeout(() => setMessage(null), 3000);
                            }
                          }}
                          className="w-full px-2 py-1 text-xs border border-brand-500 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-gray-800 dark:border-brand-400 dark:text-white"
                        >
                          {pagamentos && pagamentos.map((pag) => (
                            <option key={pag.id} value={pag.pagamento}>
                              {pag.pagamento}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => setEditingStatoId(venta.id)}
                          className={`text-xs truncate cursor-pointer px-2 py-1 rounded text-center font-medium ${
                            venta.stato === 'Acconto' ? 'bg-gray-500 text-white' :
                            venta.stato === 'Acconto V' ? 'bg-purple-400 text-white' :
                            venta.stato === 'Ricevuto' ? 'bg-green-500 text-white' :
                            venta.stato === 'Verificato' ? 'bg-purple-600 text-white' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}
                          title="Clic para editar"
                        >
                          {venta.stato}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingMetodoCompraId === venta.id ? (
                        <select
                          value={tempMetodoCompra}
                          autoFocus
                          onBlur={() => saveMetodoCompra(venta.id)}
                          onChange={(e) => setTempMetodoCompra(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveMetodoCompra(venta.id);
                            } else if (e.key === 'Escape') {
                              cancelEditingMetodoCompra();
                            }
                          }}
                          className="w-full px-2 py-1 text-xs border border-brand-500 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-gray-800 dark:border-brand-400 dark:text-white"
                        >
                          <option value="">Seleccionar...</option>
                          {acquisti.map((acquisto) => (
                            <option key={acquisto.id} value={acquisto.acquisto}>
                              {acquisto.acquisto}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => startEditingMetodoCompra(venta)}
                          className="text-xs truncate cursor-pointer px-2 py-1 rounded text-center font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30 min-h-[24px]"
                          title="Clic para editar"
                        >
                          {venta.metodoCompra || '\u00A0'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(venta.transfer || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(tour?.guidaLocale || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(tour?.coordinatore || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(tour?.transporte || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(venta.hotel || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{((venta.transfer || 0) + (tour?.guidaLocale || 0) + (tour?.coordinatore || 0) + (tour?.transporte || 0) + (venta.hotel || 0)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {venta.iata}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {venta.pnr || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{venta.venduto.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(venta.venduto - ((venta.transfer || 0) + (tour?.guidaLocale || 0) + (tour?.coordinatore || 0) + (tour?.transporte || 0) + (venta.hotel || 0))).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{venta.acconto.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{venta.daPagare.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {venta.metodoPagamento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {venta.creator?.firstName 
                        ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                        : venta.creator?.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleViewFiles(venta)}
                        disabled={countFiles(venta) === 0}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-all duration-200 ${
                          countFiles(venta) > 0
                            ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        }`}
                        title={countFiles(venta) > 0 ? 'Ver archivos' : 'Sin archivos'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs font-medium">{countFiles(venta)}</span>
                      </button>
                    </td>
                    <td className="sticky right-0 px-6 py-4 whitespace-nowrap text-sm font-medium bg-white dark:bg-gray-900 z-10 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditVenta(venta)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Editar venta"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVenta(venta.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Eliminar venta"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>

      {/* Notificación */}
      <CopyNotification
        show={showCopyNotification}
        onHide={() => setShowCopyNotification(false)}
      />

      {/* Modal visor de archivos */}
      {isMounted && isFileViewerOpen && viewingFiles && createPortal(
        <>
          <div className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] z-[9999999998]" onClick={() => setIsFileViewerOpen(false)} />
          <div className="fixed inset-0 modal z-[9999999999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Archivos Adjuntos - {viewingFiles.pasajero}
                </h2>
                <button
                  onClick={() => setIsFileViewerOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Archivo Principal */}
                {viewingFiles.attachedFile && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Archivo Principal</p>
                    {(() => {
                      const fileName = viewingFiles.attachedFileName || viewingFiles.attachedFile;
                      const isImage = fileName && (
                        fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                        viewingFiles.attachedFile.includes('/image/')
                      );
                      
                      if (isImage) {
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
                            <p className="text-sm text-gray-900 dark:text-white">{viewingFiles.attachedFileName || 'Documento'}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Clic para descargar</p>
                          </button>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* Archivos de Cuotas */}
                {viewingFiles.cuotas && viewingFiles.cuotas.filter(c => c.attachedFile).map((cuota) => (
                  <div key={cuota.id || cuota.numeroCuota}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cuota {cuota.numeroCuota}
                    </p>
                    {(() => {
                      const fileUrl = typeof cuota.attachedFile === 'string' ? cuota.attachedFile : null;
                      if (!fileUrl) return null;
                      
                      const fileName = cuota.attachedFileName || fileUrl;
                      const isImage = fileName && typeof fileName === 'string' && (
                        fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                        fileUrl.includes('/image/')
                      );
                      
                      if (isImage) {
                        return (
                          <img 
                            src={fileUrl} 
                            alt={`Cuota ${cuota.numeroCuota}`} 
                            className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleDownload(fileUrl, cuota.attachedFileName || `cuota_${cuota.numeroCuota}.jpg`)}
                          />
                        );
                      } else {
                        return (
                          <button
                            onClick={() => handleDownload(fileUrl, cuota.attachedFileName || `cuota_${cuota.numeroCuota}.pdf`)}
                            className="block w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            <p className="text-sm text-gray-900 dark:text-white">{cuota.attachedFileName || 'Documento'}</p>
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
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setIsFileViewerOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </>,
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
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Información Personal */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre Completo
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Código Fiscal
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedClient.fiscalCode}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedClient.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Teléfono
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedClient.phoneNumber}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha de Nacimiento
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(selectedClient.birthDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Lugar de Nacimiento
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedClient.birthPlace}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dirección
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedClient.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documentos */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Documentos Adjuntos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { url: selectedClient.document1, name: selectedClient.document1Name, label: 'Documento 1' },
                      { url: selectedClient.document2, name: selectedClient.document2Name, label: 'Documento 2' },
                      { url: selectedClient.document3, name: selectedClient.document3Name, label: 'Documento 3' },
                      { url: selectedClient.document4, name: selectedClient.document4Name, label: 'Documento 4' }
                    ].map((doc, index) => {
                      if (!doc.url) return null;
                      
                      const isImage = doc.url.includes('/image/') || doc.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                      
                      return (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {doc.label}
                          </h4>
                          {isImage ? (
                            <img 
                              src={doc.url} 
                              alt={doc.name || doc.label} 
                              className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleDownload(doc.url!, doc.name || `${doc.label}.jpg`)}
                            />
                          ) : (
                            <button
                              onClick={() => handleDownload(doc.url!, doc.name || `${doc.label}.pdf`)}
                              className="block w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <p className="text-sm text-gray-900 dark:text-white">{doc.name || 'Documento'}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Clic para descargar</p>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {!selectedClient.document1 && !selectedClient.document2 && !selectedClient.document3 && !selectedClient.document4 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No hay documentos adjuntos</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
