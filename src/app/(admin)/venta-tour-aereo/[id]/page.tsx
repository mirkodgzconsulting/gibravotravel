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
import SimpleRichTextEditor from "@/components/form/SimpleRichTextEditor";

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

const normalizeLegacyNote = (note?: string | null) => {
  if (!note) return '';
  return note
    .replace(/\[b\]([\s\S]*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[color=(red|blue|black)\]([\s\S]*?)\[\/color\]/g, (_, color: string, content: string) => {
      const colorMap: Record<string, string> = {
        red: '#dc2626',
        blue: '#1d4ed8',
        black: '#111827',
      };
      const mappedColor = colorMap[color] || '#111827';
      return `<span style="color:${mappedColor};">${content}</span>`;
    })
    .replace(/\[size=(small|medium|large)\]([\s\S]*?)\[\/size\]/g, (_, size: string, content: string) => {
      const sizeMap: Record<string, string> = {
        small: '0.875rem',
        medium: '1rem',
        large: '1.125rem',
      };
      const mappedSize = sizeMap[size] || '1rem';
      return `<span style="font-size:${mappedSize};">${content}</span>`;
    })
    .replace(/\n/g, '<br />');
};

const sanitizeEditorHtml = (note?: string | null) => {
  const normalized = normalizeLegacyNote(note);
  if (!normalized) return '';

  const allowedTags = new Set(['B', 'STRONG', 'I', 'EM', 'SPAN', 'BR']);
  const allowedStyles = new Set(['color', 'font-size']);

  try {
    if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(normalized, 'text/html');

      const sanitizeNode = (node: Node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            if (!allowedTags.has(el.tagName)) {
              const parent = el.parentNode;
              if (parent) {
                while (el.firstChild) {
                  parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
              }
              return;
            }

            if (el.tagName === 'SPAN') {
              Array.from(el.attributes).forEach((attr) => {
                if (attr.name !== 'style') {
                  el.removeAttribute(attr.name);
                }
              });
              const style = el.style;
              Array.from(style).forEach((prop) => {
                if (!allowedStyles.has(prop)) {
                  style.removeProperty(prop);
                }
              });
              if (!style.color && !style.fontSize) {
                el.removeAttribute('style');
              }
            } else {
              Array.from(el.attributes).forEach((attr) => {
                el.removeAttribute(attr.name);
              });
            }

            sanitizeNode(el);
          } else if (child.nodeType !== Node.TEXT_NODE) {
            child.parentNode?.removeChild(child);
          }
        });
      };

      sanitizeNode(doc.body);
      return doc.body.innerHTML;
    }
  } catch {
    // Fallback if DOMParser is not available
  }

  return normalized
    .replace(/<(?!\/?(b|strong|i|em|span|br)\b)[^>]*>/gi, '')
    .replace(/style=\"([^\"]*)\"/gi, (match, styles) => {
      const allowed = styles
        .split(';')
        .map((rule: string) => rule.trim())
        .filter((rule: string) => {
          const [property] = rule.split(':').map((part: string) => part.trim().toLowerCase());
          return allowedStyles.has(property);
        });
      return allowed.length ? `style="${allowed.join('; ')}"` : '';
    });
};

const extractPlainText = (note?: string | null) => {
  const sanitized = sanitizeEditorHtml(note);
  if (!sanitized) return '';
  return sanitized
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function VentaTourAereoPage() {
  const params = useParams();
  const tourId = params.id as string;
  const { userRole, isLoading: roleLoading, isAdmin, isTI } = useUserRole();
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();
  const allowedStatiForUser = useMemo(() => new Set(['Acconto', 'Ricevuto']), []);
  const canEditStato = useCallback(
    (value: string) => isAdmin || isTI || allowedStatiForUser.has(value),
    [isAdmin, isTI, allowedStatiForUser]
  );

  const handleStatoSelectChange = useCallback(
    (value: string) => {
      if (!canEditStato(value)) {
        setMessage({
          type: 'error',
          text: 'Il tuo ruolo non consente di impostare questo stato'
        });
        return;
      }
      setFormData(prev => ({ ...prev, stato: value }));
    },
    [canEditStato]
  );
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

  // Estado para el tipo de pasajero (adulto/nino) y precios editables
  const [tipoPasajero, setTipoPasajero] = useState<'adulto' | 'nino' | null>(null);
  const [adultoPrice, setAdultoPrice] = useState<string>('');
  const [bambinoPrice, setBambinoPrice] = useState<string>('');

  // Estados para dropdowns de multiselección
  const [iataSearchTerm, setIataSearchTerm] = useState("");
  const [showIataDropdown, setShowIataDropdown] = useState(false);
  const [metodoPagamentoSearchTerm, setMetodoPagamentoSearchTerm] = useState("");
  const [showMetodoPagamentoDropdown, setShowMetodoPagamentoDropdown] = useState(false);



  // Función para manejar el cambio de tipo de pasajero
  const handleTipoPasajeroChange = useCallback(
    (tipo: 'adulto' | 'nino') => {
      setTipoPasajero(tipo);
      const price = tipo === 'adulto' ? adultoPrice : bambinoPrice;
      setFormData(prev => ({
        ...prev,
        venduto: price ? price.replace(',', '.') : ''
      }));
    },
    [adultoPrice, bambinoPrice]
  );

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

  const handlePriceInputChange = useCallback(
    (type: 'adulto' | 'nino', rawValue: string) => {
      const sanitized = rawValue.replace(/[^\d.,]/g, '');
      if (type === 'adulto') {
        setAdultoPrice(sanitized);
      } else {
        setBambinoPrice(sanitized);
      }

      if (tipoPasajero === type) {
        setFormData(prev => ({
          ...prev,
          venduto: sanitized ? sanitized.replace(',', '.') : ''
        }));
      }
    },
    [tipoPasajero]
  );

  // Filtrar IATAs no seleccionados (memoizado)
  const availableIatas = useMemo(() => {
    return filteredIatas.filter(iata => !formData.iata.includes(iata.iata));
  }, [filteredIatas, formData.iata]);

  useEffect(() => {
    if (tour) {
      setAdultoPrice(
        tour.precioAdulto !== null && tour.precioAdulto !== undefined
          ? tour.precioAdulto.toString()
          : ''
      );
      setBambinoPrice(
        tour.precioNino !== null && tour.precioNino !== undefined
          ? tour.precioNino.toString()
          : ''
      );
    } else {
      setAdultoPrice('');
      setBambinoPrice('');
    }
  }, [tour]);

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
      setError('Errore di connessione');
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
        setError('Errore durante il caricamento del tour');
      }
    } catch (error) {
      setError('Errore di connessione');
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
    setAdultoPrice(tour?.precioAdulto != null ? tour.precioAdulto.toString() : '');
    setBambinoPrice(tour?.precioNino != null ? tour.precioNino.toString() : '');
    
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
  }, [clientes, tour]);

  const handleClientSelect = useCallback((clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setClientSearchTerm(`${cliente.firstName} ${cliente.lastName}`);
      setShowClientDropdown(false);
      setTipoPasajero(null);
      setFormData(prev => ({ ...prev, venduto: "" }));
      setAdultoPrice(tour?.precioAdulto != null ? tour.precioAdulto.toString() : '');
      setBambinoPrice(tour?.precioNino != null ? tour.precioNino.toString() : '');
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
  }, [clientes, tour]);

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

    const ensureValue = (value?: string | null, fallback?: string) => {
      const candidate = value ?? fallback ?? '';
      const trimmed = candidate.toString().trim();
      return trimmed !== '' ? trimmed : 'sindatos';
    };

    setIsSubmitting(true);
    try {
       
      // Validar que al menos un IATA esté seleccionado
      if (!formData.iata || formData.iata.length === 0) {
        setMessage({ type: 'error', text: 'Devi selezionare almeno un IATA' });
        setIsSubmitting(false);
        return;
      }

      // Validar que al menos un método de pago esté seleccionado
      if (!formData.metodoPagamento || formData.metodoPagamento.length === 0) {
        setMessage({ type: 'error', text: 'Devi selezionare almeno un metodo di pagamento' });
        setIsSubmitting(false);
        return;
      }

      // Preparar FormData para enviar archivos
      const formDataToSend = new FormData();
      
      // Agregar campos del formulario (manejar arrays como JSON)
      formDataToSend.append('clienteId', formData.clienteId);
      formDataToSend.append('pasajero', formData.pasajero);
      formDataToSend.append('codiceFiscale', ensureValue(formData.codiceFiscale));
      formDataToSend.append('indirizzo', ensureValue(formData.indirizzo));
      formDataToSend.append('email', ensureValue(formData.email));
      formDataToSend.append('numeroTelefono', ensureValue(formData.numeroTelefono));
      formDataToSend.append('paisOrigen', ensureValue(formData.paisOrigen));
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
        setTipoPasajero(null);
        setAdultoPrice(tour?.precioAdulto != null ? tour.precioAdulto.toString() : '');
        setBambinoPrice(tour?.precioNino != null ? tour.precioNino.toString() : '');
        closeModal();
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 3000);
      } else {
        const errorText = await response.text();
        console.error('Create venta error:', errorText);
        let errorMessage = 'Errore durante la creazione della vendita';
        try {
          const parsed = JSON.parse(errorText);
          if (parsed?.error) errorMessage = parsed.error;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        setMessage({ type: 'error', text: errorMessage });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
        console.error('Error al crear venta:', error);
        setMessage({ type: 'error', text: 'Errore di connessione durante la creazione della vendita' });
        setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVenta = useCallback(async (ventaId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa vendita?')) return;

    try {
      const response = await fetch(`/api/tour-aereo/ventas/${ventaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Recargar las ventas para asegurar que tenemos los datos actualizados
        await fetchVentas();
        setMessage({
          type: 'success',
          text: 'Vendita eliminata correttamente'
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || "Errore durante l'eliminazione della vendita" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      setMessage({ type: 'error', text: "Errore di connessione durante l'eliminazione della vendita" });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [fetchVentas]);

  // Función para exportar a Excel
  const handleExportToExcel = useCallback(() => {
    const dataToExport = filteredVentas.map(venta => ({
      'Passeggero': venta.pasajero || '',
      'Codice Fiscale': venta.codiceFiscale || '',
      'Indirizzo': venta.indirizzo || '',
      'Email': venta.email || '',
      'Telefono': venta.numeroTelefono || '',
      'Paese di origine': venta.paisOrigen || '',
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
      'Trasporto (€)': venta.transfer || 0,
      'Venduto (€)': venta.venduto || 0,
      'Acconto (€)': venta.acconto || 0,
      'Da pagare (€)': venta.daPagare || 0,
      'Metodo di pagamento': (() => {
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
    XLSX.utils.book_append_sheet(wb, ws, 'Vendite Tour Aereo');
    
    const fileName = `vendite_tour_aereo_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    
    const vendutoValue = venta.venduto != null ? venta.venduto.toString() : '';
    setAdultoPrice(vendutoValue || (tour?.precioAdulto != null ? tour.precioAdulto.toString() : ''));
    setBambinoPrice(vendutoValue || (tour?.precioNino != null ? tour.precioNino.toString() : ''));
    setTipoPasajero('adulto');

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
      const ensureValue = (value?: string | null, fallback?: string) => {
        const candidate = value ?? fallback ?? '';
        const trimmed = candidate.toString().trim();
        return trimmed !== '' ? trimmed : 'sindatos';
      };

      // Validar que al menos un IATA esté seleccionado
      if (!formData.iata || formData.iata.length === 0) {
        setMessage({ type: 'error', text: 'Devi selezionare almeno un IATA' });
        setIsSubmitting(false);
        return;
      }

      // Validar que al menos un método de pago esté seleccionado
      if (!formData.metodoPagamento || formData.metodoPagamento.length === 0) {
        setMessage({ type: 'error', text: 'Devi selezionare almeno un metodo di pagamento' });
        setIsSubmitting(false);
        return;
      }

      // Preparar FormData para enviar archivos
      const formDataToSend = new FormData();
      
      // Agregar campos del formulario (manejar arrays como JSON)
      formDataToSend.append('clienteId', formData.clienteId);
      formDataToSend.append('pasajero', formData.pasajero);
      formDataToSend.append('codiceFiscale', ensureValue(formData.codiceFiscale, editingVenta?.codiceFiscale));
      formDataToSend.append('indirizzo', ensureValue(formData.indirizzo, editingVenta?.indirizzo));
      formDataToSend.append('email', ensureValue(formData.email, editingVenta?.email));
      formDataToSend.append('numeroTelefono', ensureValue(formData.numeroTelefono, editingVenta?.numeroTelefono));
      formDataToSend.append('paisOrigen', ensureValue(formData.paisOrigen, editingVenta?.paisOrigen));
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
        setTipoPasajero(null);
        setAdultoPrice(tour?.precioAdulto != null ? tour.precioAdulto.toString() : '');
        setBambinoPrice(tour?.precioNino != null ? tour.precioNino.toString() : '');
        setMessage({
          type: 'success',
          text: 'Vendita aggiornata correttamente'
        });
        closeModal();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorText = await response.text();
        console.error('Update venta error:', errorText);
        let errorMessage = "Errore durante l'aggiornamento della vendita";
        try {
          const parsed = JSON.parse(errorText);
          if (parsed?.error) errorMessage = parsed.error;
        } catch {
          if (errorText) errorMessage = errorText;
        }
        setMessage({ type: 'error', text: errorMessage });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error al actualizar venta:', error);
      setMessage({ type: 'error', text: "Errore di connessione durante l'aggiornamento della vendita" });
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
    setTipoPasajero(null);
    setAdultoPrice(tour?.precioAdulto != null ? tour.precioAdulto.toString() : '');
    setBambinoPrice(tour?.precioNino != null ? tour.precioNino.toString() : '');
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
          text: 'Metodo di acquisto aggiornato correttamente'
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Errore durante l'aggiornamento");
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: "Errore durante l'aggiornamento del metodo di acquisto"
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
    const currentValue = type === 'tour' ? tour?.notas : tour?.notasCoordinador;
    setTempNotas(prev => ({
      ...prev,
      [type]: sanitizeEditorHtml(currentValue)
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
      formDataToSend.append(
        'notas',
        type === 'tour'
          ? sanitizeEditorHtml(tempNotas.tour)
          : sanitizeEditorHtml(tour?.notas)
      );
      formDataToSend.append(
        'notasCoordinador',
        type === 'coordinador'
          ? sanitizeEditorHtml(tempNotas.coordinador)
          : sanitizeEditorHtml(tour?.notasCoordinador)
      );
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
          text: 'Note aggiornate correttamente'
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: "Errore durante l'aggiornamento delle note"
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Errore di connessione'
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
      alert('Errore durante il download del file');
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
        text: 'Errore durante il caricamento delle informazioni del cliente'
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
          <p className="mt-4 text-gray-600">Caricamento...</p>
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
            Tour non trovato
          </h1>
          <p className="text-gray-600">
            Il tour che cerchi non esiste o non hai accesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle={`Vendite - ${tour.titulo}`} />
      
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
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Prezzo adulto</span>
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                €{tour.precioAdulto}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSignIcon className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Prezzo bambino</span>
              </div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                €{tour.precioNino}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <UsersIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Obiettivo</span>
              </div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {tour.meta}
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUpIcon className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Progresso</span>
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
                  <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Coordinatore</span>
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
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Transfer</span>
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
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Note del tour</span>
                  </div>
                  <div
                    className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded transition-colors"
                    onDoubleClick={() => startEditingNotas('tour')}
                    title={extractPlainText(tour.notas)}
                  >
                    {editingNotas.tour ? (
                      <div className="space-y-2">
                        <SimpleRichTextEditor
                          value={tempNotas.tour}
                          onChange={(html) =>
                            setTempNotas(prev => ({ ...prev, tour: html }))
                          }
                          placeholder="Scrivi le note del tour..."
                          rows={4}
                          className="w-full"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveNotas('tour');
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                          >
                            Salva
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditingNotas('tour');
                            }}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const sanitized = sanitizeEditorHtml(tour.notas);
                        return sanitized ? (
                          <div
                            className="leading-relaxed space-y-1"
                            dangerouslySetInnerHTML={{ __html: sanitized }}
                          />
                        ) : (
                          <span className="text-sm text-slate-400 italic">
                            Doppio click per aggiungere note...
                          </span>
                        );
                      })()
                    )}
                  </div>
                </div>
              )}

              {tour.notasCoordinador && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
                  <div className="flex items-center gap-2 mb-3">
                    <FileTextIcon className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Note del coordinatore</span>
                  </div>
                  <div 
                    className="text-sm text-amber-700 dark:text-amber-300 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800 p-2 rounded transition-colors"
                    onDoubleClick={() => startEditingNotas('coordinador')}
                    title={extractPlainText(tour.notasCoordinador)}
                  >
                    {editingNotas.coordinador ? (
                      <div className="space-y-2">
                        <SimpleRichTextEditor
                          value={tempNotas.coordinador}
                          onChange={(html) =>
                            setTempNotas(prev => ({ ...prev, coordinador: html }))
                          }
                          placeholder="Scrivi le note del coordinatore..."
                          rows={4}
                          className="w-full"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveNotas('coordinador');
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                          >
                            Salva
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditingNotas('coordinador');
                            }}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const sanitized = sanitizeEditorHtml(tour.notasCoordinador);
                        return sanitized ? (
                          <div
                            className="leading-relaxed space-y-1"
                            dangerouslySetInnerHTML={{ __html: sanitized }}
                          />
                        ) : (
                          <span className="text-sm text-amber-400 italic">
                            Doppio click per aggiungere note...
                          </span>
                        );
                      })()
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            Entrate totali: <span className="font-semibold text-green-600">€{ingresos.toFixed(2)}</span>
          </div>
          {tour.fechaViaje && (
            <div>
              Data del viaggio: <span className="text-gray-900 dark:text-white">
                {new Date(tour.fechaViaje).toLocaleDateString('it-IT', { 
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
              {isEditMode ? "Modifica vendita" : "Nuovo inserimento"}
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
                    Passeggero *
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
                      placeholder={loadingClientes ? 'Caricamento clienti...' : 'Cerca cliente...'}
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
                            {loadingClientes ? 'Caricamento clienti...' : 'Nessun cliente trovato'}
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
                      Tipo di passeggero *
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="tipoPasajero"
                          value="adulto"
                          checked={tipoPasajero === 'adulto'}
                          onChange={() => handleTipoPasajeroChange('adulto')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                            Adulto
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">€</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={adultoPrice}
                              onChange={(e) => handlePriceInputChange('adulto', e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="tipoPasajero"
                          value="nino"
                          checked={tipoPasajero === 'nino'}
                          onChange={() => handleTipoPasajeroChange('nino')}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                            Bambino
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">€</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={bambinoPrice}
                              onChange={(e) => handlePriceInputChange('nino', e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
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
                    Paese di origine
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
                      <input type="text" value={iataSearchTerm} onChange={(e) => { setIataSearchTerm(e.target.value); setShowIataDropdown(true); }} onFocus={() => setShowIataDropdown(true)} placeholder={formData.iata.length === 0 ? "Cerca o seleziona IATA..." : "Cerca IATA..."} className="flex-1 min-w-[120px] outline-none bg-transparent text-sm text-gray-900 dark:text-white" onClick={(e) => e.stopPropagation()} />
                    </div>
                    {showIataDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredIatas.filter(iata => !formData.iata.includes(iata.iata)).map(iata => (
                          <div key={iata.id} onClick={() => { handleIataToggle(iata.iata); setShowIataDropdown(false); }} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <div className="font-medium text-gray-900 dark:text-white">{iata.iata}</div>
                          </div>
                        ))}
                        {filteredIatas.filter(iata => !formData.iata.includes(iata.iata)).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Nessuna IATA disponibile</div>
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
                    Trasporto (€)
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
                      Pagamento a rate
                    </h3>
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Numero di rate:
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
                        <option value={0}>Senza rate</option>
                        <option value={1}>1 rata</option>
                        <option value={2}>2 rate</option>
                        <option value={3}>3 rate</option>
                      </select>
                    </div>
                  </div>

                  {cuotas.length > 0 && (
                    <div className="space-y-4">
                      {cuotas.map((cuota, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Rata {cuota.numeroCuota}
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
                                Data di pagamento *
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
                                Importo *
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
                                Nota (opzionale)
                              </label>
                              <input
                                type="text"
                                value={cuota.nota || ''}
                                onChange={(e) => updateCuota(index, 'nota', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Nota opzionale..."
                              />
                            </div>
                          </div>

                          {/* Archivo adjunto para la cuota */}
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Ricevuta di pagamento (opzionale)
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
                                <span>{typeof cuota.attachedFile === 'string' ? 'File allegato' : cuota.attachedFile.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cuotas.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Seleziona il numero di rate per configurare il piano di pagamenti.
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
                        placeholder={formData.metodoPagamento.length === 0 ? "Cerca o seleziona metodo di pagamento..." : "Cerca metodo..."}
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
                            Nessun metodo di pagamento disponibile
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
                    <option value="">Seleziona...</option>
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
                    onChange={(e) => handleStatoSelectChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus-border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seleziona stato...</option>
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
                    File allegato (opzionale)
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
                  Annulla
                </Button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50"
                >
                  {isSubmitting 
                    ? (isEditMode ? 'Aggiornamento...' : 'Salvataggio...') 
                    : (isEditMode ? 'Aggiorna Vendita' : 'Genera Vendita')}
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
                placeholder="Cerca per passeggero, stato, metodo di acquisto..."
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
              Esporta in Excel
                </button>
            
        {/* Botón para generar venta */}
          <button
            onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
          >
            <PlusIcon className="w-5 h-5" />
            Genera Vendita
          </button>
          </div>
        </div>

        {filteredVentas.length === 0 ? (
          <div className="text-center py-12">
            <PlaneIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm.trim() ? 'Nessun risultato trovato' : 'Nessuna vendita registrata'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm.trim() ? 'Prova con altri termini di ricerca' : 'Genera la tua prima vendita per iniziare'}
            </p>
            {!searchTerm.trim() && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg"
            >
              Genera Vendita
            </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-[#0366D6]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Passeggero
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
                    Trasporto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Hotel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Netto
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
                    Commissione
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
                    File
                  </th>
                  <th className="sticky right-0 px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider bg-[#0366D6] z-10 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                    Azioni
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
                        title="Visualizza informazioni cliente"
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
                            if (!canEditStato(newValue)) {
                              setMessage({
                                type: 'error',
                                text: 'Il tuo ruolo non consente di impostare questo stato'
                              });
                              e.target.value = venta.stato;
                              return;
                            }
                            
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
                                  text: 'Stato aggiornato correttamente'
                                });
                                setTimeout(() => setMessage(null), 3000);
                                setEditingStatoId(null);
                              } else {
                                throw new Error("Errore durante l'aggiornamento");
                              }
                            } catch (error) {
                              setMessage({
                                type: 'error',
                                text: "Errore durante l'aggiornamento dello stato"
                              });
                              setTimeout(() => setMessage(null), 3000);
                              setEditingStatoId(null);
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
                          title="Clicca per modificare"
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
                          <option value="">Seleziona...</option>
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
                          title="Clicca per modificare"
                        >
                          {venta.metodoCompra || '\u00A0'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(tour?.transporte || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(tour?.guidaLocale || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(tour?.coordinatore || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(venta.transfer || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{(venta.hotel || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      €{((venta.transfer || 0) + (tour?.guidaLocale || 0) + (tour?.coordinatore || 0) + (tour?.transporte || 0) + (venta.hotel || 0)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {(() => {
                        try {
                          const parsed = typeof venta.iata === 'string'
                            ? JSON.parse(venta.iata)
                            : venta.iata;
                          return Array.isArray(parsed) ? parsed.join(', ') : (venta.iata || '-');
                        } catch {
                          return venta.iata || '-';
                        }
                      })()}
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
                      {(() => {
                        try {
                          const parsed = typeof venta.metodoPagamento === 'string'
                            ? JSON.parse(venta.metodoPagamento)
                            : venta.metodoPagamento;
                          return Array.isArray(parsed) ? parsed.join(', ') : (venta.metodoPagamento || '-');
                        } catch {
                          return venta.metodoPagamento || '-';
                        }
                      })()}
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
                        title={countFiles(venta) > 0 ? 'Visualizza file' : 'Nessun file'}
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
                  File allegati - {viewingFiles.pasajero}
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
                {/* File principale */}
                {viewingFiles.attachedFile && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File principale</p>
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
                            alt="File principale" 
                            className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleDownload(viewingFiles.attachedFile!, viewingFiles.attachedFileName || 'file_principale.jpg')}
                          />
                        );
                      } else {
                        return (
                          <button
                            onClick={() => handleDownload(viewingFiles.attachedFile!, viewingFiles.attachedFileName || 'documento')}
                            className="block w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            <p className="text-sm text-gray-900 dark:text-white">{viewingFiles.attachedFileName || 'Documento'}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Clicca per scaricare</p>
                          </button>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* File delle rate */}
                {viewingFiles.cuotas && viewingFiles.cuotas.filter(c => c.attachedFile).map((cuota) => (
                  <div key={cuota.id || cuota.numeroCuota}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rata {cuota.numeroCuota}
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
                            alt={`Rata ${cuota.numeroCuota}`} 
                            className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleDownload(fileUrl, cuota.attachedFileName || `rata_${cuota.numeroCuota}.jpg`)}
                          />
                        );
                      } else {
                        return (
                          <button
                            onClick={() => handleDownload(fileUrl, cuota.attachedFileName || `rata_${cuota.numeroCuota}.pdf`)}
                            className="block w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                          >
                            <p className="text-sm text-gray-900 dark:text-white">{cuota.attachedFileName || 'Documento'}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Clicca per scaricare</p>
                          </button>
                        );
                      }
                    })()}
                  </div>
                ))}

                {/* Sin archivos */}
                {!viewingFiles.attachedFile && (!viewingFiles.cuotas || viewingFiles.cuotas.filter(c => c.attachedFile).length === 0) && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">Nessun file allegato</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setIsFileViewerOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Chiudi
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
                  Informazioni cliente - {selectedClient.firstName} {selectedClient.lastName}
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
                    Informazioni personali
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nome completo
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedClient.firstName} {selectedClient.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Codice fiscale
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
                        Telefono
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedClient.phoneNumber}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Data di nascita
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {new Date(selectedClient.birthDate).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Luogo di nascita
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedClient.birthPlace}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Indirizzo
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
                    Documenti allegati
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
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Clicca per scaricare</p>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {!selectedClient.document1 && !selectedClient.document2 && !selectedClient.document3 && !selectedClient.document4 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Nessun documento allegato</p>
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
                  Chiudi
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
