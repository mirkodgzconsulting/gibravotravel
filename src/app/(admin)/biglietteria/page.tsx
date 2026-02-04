/* eslint-disable @next/next/no-img-element */
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import PassengerDetailsTable from "@/components/PassengerDetailsTable";
import PassengerDetailsTableSimple from "@/components/PassengerDetailsTableSimple";
import SimpleRichTextEditor from "@/components/form/SimpleRichTextEditor";
import * as XLSX from "xlsx";
import { cachedFetch, getCachedData } from "@/utils/cachedFetch";
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

interface PasajeroServicioDetalle {
  id?: string;
  servicio: string;
  metodoDiAcquisto?: string | null;
  iata?: string | null;
  andata?: string | null;
  ritorno?: string | null;
  neto?: number | string | null;
  venduto?: number | string | null;
  estado?: string | null;
  fechaPago?: string | null;
  fechaActivacion?: string | null;
  notas?: string | null;
}

interface PasajeroServicioDetalleApi extends Omit<
  PasajeroServicioDetalle,
  "neto" | "venduto"
> {
  neto?: number | string | null;
  venduto?: number | string | null;
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
  serviciosDetalle?: PasajeroServicioDetalle[];
  // Campos dinámicos para servicios adicionales (no incluidos en los anteriores)
  serviciosData?: Record<
    string,
    { iata: string; neto: string; venduto: string; metodoDiAcquisto?: string }
  >;
  metodoAcquistoBiglietteria: string;
  metodoAcquistoExpress: string;
  metodoAcquistoPolizza: string;
  metodoAcquistoLetteraInvito: string;
  metodoAcquistoHotel: string;
}

type RecordCreator = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type ApiUser = {
  clerkId: string;
  firstName: string;
  lastName: string;
  role: string;
};

type PagamentoOption = { pagamento: string };
type IataOption = { iata: string };
type MetodoPagamentoOption = { metodoPagamento: string };
type ServizioOption = { id: string; servizio: string; isActive: boolean };
type AcquistoOption = { acquisto: string };

type PasajeroApi = Partial<PasajeroData> & {
  servizio?: string;
  servicios?: string[] | string;
  serviciosDetalle?: PasajeroServicioDetalleApi[];
  notas?: string | null;
  estado?: string | null;
  fechaPago?: string | null;
  fechaActivacion?: string | null;
};

type BiglietteriaRecordApi = Omit<
  BiglietteriaRecord,
  "metodoPagamento" | "pasajeros"
> & {
  metodoPagamento: string[] | string;
  pasajeros: PasajeroApi[];
};

interface BiglietteriaRecord {
  id: string;
  pagamento: string;
  data: string;
  pnr: string | null;
  itinerario: string;
  metodoPagamento: string[]; // Array de métodos de pago
  metodoPagamentoParsed?: string[]; // OPTIMIZACIÓN: Pre-parseado para evitar JSON.parse en filtro
  notaDiVendita: string | null;
  notaDiRicevuta: string | null;
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
  notaDiRicevuta: string;
  numeroPasajeros: number;
  pasajeros: PasajeroData[];
  netoPrincipal: string;
  vendutoTotal: string;
  acconto: string;
  daPagare: string;
  feeAgv: string;
}

interface TotalesCalculados {
  netoPrincipal: string;
  vendutoTotal: string;
  daPagare: string;
  feeAgv: string;
}

function crearPasajeroVacio(): PasajeroData {
  return {
    nombrePasajero: "",
    servicios: [],
    andata: "",
    ritorno: "",
    iata: "",
    iataBiglietteria: "",
    iataExpress: "",
    iataPolizza: "",
    iataLetteraInvito: "",
    iataHotel: "",
    netoBiglietteria: "",
    vendutoBiglietteria: "",
    tieneExpress: false,
    netoExpress: "",
    vendutoExpress: "",
    tienePolizza: false,
    netoPolizza: "",
    vendutoPolizza: "",
    tieneLetteraInvito: false,
    netoLetteraInvito: "",
    vendutoLetteraInvito: "",
    tieneHotel: false,
    netoHotel: "",
    vendutoHotel: "",
    serviciosDetalle: [],
    serviciosData: {},
    metodoAcquistoBiglietteria: "",
    metodoAcquistoExpress: "",
    metodoAcquistoPolizza: "",
    metodoAcquistoLetteraInvito: "",
    metodoAcquistoHotel: "",
  };
}

function normalizeServiciosDetalle(
  detalles?: PasajeroServicioDetalleApi[],
): PasajeroServicioDetalle[] {
  if (!Array.isArray(detalles)) {
    return [];
  }

  return detalles.map((detalle) => ({
    id: detalle.id,
    servicio: detalle.servicio ?? "",
    metodoDiAcquisto: detalle.metodoDiAcquisto ?? null,
    iata: detalle.iata ?? null,
    andata: detalle.andata ?? null,
    ritorno: detalle.ritorno ?? null,
    neto: detalle.neto ?? null,
    venduto: detalle.venduto ?? null,
    estado: detalle.estado ?? null,
    fechaPago: detalle.fechaPago ?? null,
    fechaActivacion: detalle.fechaActivacion ?? null,
    notas: detalle.notas ?? null,
  }));
}

function normalizePasajero(pasajero: PasajeroApi): PasajeroData {
  const base = crearPasajeroVacio();

  let servicios: string[] = base.servicios;
  if (Array.isArray(pasajero.servicios)) {
    servicios = pasajero.servicios
      .map((servicio) => {
        if (typeof servicio === "string") {
          return servicio.trim();
        }
        return String(servicio);
      })
      .filter((servicio): servicio is string => servicio.length > 0);
  } else {
    const serviciosDesdeTexto = splitServicios(pasajero.servicios);
    if (serviciosDesdeTexto.length > 0) {
      servicios = serviciosDesdeTexto;
    } else {
      const serviciosDesdeServizio = splitServicios(pasajero.servizio);
      if (serviciosDesdeServizio.length > 0) {
        servicios = serviciosDesdeServizio;
      }
    }
  }

  return {
    ...base,
    ...pasajero,
    nombrePasajero: pasajero.nombrePasajero ?? base.nombrePasajero,
    servicios,
    andata: pasajero.andata ?? base.andata,
    ritorno: pasajero.ritorno ?? base.ritorno,
    iata: pasajero.iata ?? base.iata,
    iataBiglietteria: pasajero.iataBiglietteria ?? base.iataBiglietteria,
    iataExpress: pasajero.iataExpress ?? base.iataExpress,
    iataPolizza: pasajero.iataPolizza ?? base.iataPolizza,
    iataLetteraInvito: pasajero.iataLetteraInvito ?? base.iataLetteraInvito,
    iataHotel: pasajero.iataHotel ?? base.iataHotel,
    netoBiglietteria: pasajero.netoBiglietteria ?? base.netoBiglietteria,
    vendutoBiglietteria:
      pasajero.vendutoBiglietteria ?? base.vendutoBiglietteria,
    tieneExpress: pasajero.tieneExpress ?? base.tieneExpress,
    netoExpress: pasajero.netoExpress ?? base.netoExpress,
    vendutoExpress: pasajero.vendutoExpress ?? base.vendutoExpress,
    tienePolizza: pasajero.tienePolizza ?? base.tienePolizza,
    netoPolizza: pasajero.netoPolizza ?? base.netoPolizza,
    vendutoPolizza: pasajero.vendutoPolizza ?? base.vendutoPolizza,
    tieneLetteraInvito: pasajero.tieneLetteraInvito ?? base.tieneLetteraInvito,
    netoLetteraInvito: pasajero.netoLetteraInvito ?? base.netoLetteraInvito,
    vendutoLetteraInvito:
      pasajero.vendutoLetteraInvito ?? base.vendutoLetteraInvito,
    tieneHotel: pasajero.tieneHotel ?? base.tieneHotel,
    netoHotel: pasajero.netoHotel ?? base.netoHotel,
    vendutoHotel: pasajero.vendutoHotel ?? base.vendutoHotel,
    serviciosDetalle:
      pasajero.serviciosDetalle && pasajero.serviciosDetalle.length > 0
        ? normalizeServiciosDetalle(pasajero.serviciosDetalle)
        : base.serviciosDetalle,
    serviciosData: pasajero.serviciosData ?? base.serviciosData,
    metodoAcquistoBiglietteria:
      pasajero.metodoAcquistoBiglietteria ?? base.metodoAcquistoBiglietteria,
    metodoAcquistoExpress:
      pasajero.metodoAcquistoExpress ?? base.metodoAcquistoExpress,
    metodoAcquistoPolizza:
      pasajero.metodoAcquistoPolizza ?? base.metodoAcquistoPolizza,
    metodoAcquistoLetteraInvito:
      pasajero.metodoAcquistoLetteraInvito ?? base.metodoAcquistoLetteraInvito,
    metodoAcquistoHotel:
      pasajero.metodoAcquistoHotel ?? base.metodoAcquistoHotel,
  };
}

function processRecord(record: BiglietteriaRecordApi): BiglietteriaRecord {
  const metodoArray = normalizeMetodoPagamentoArray(record.metodoPagamento);

  const pasajerosNormalizados = Array.isArray(record.pasajeros)
    ? record.pasajeros.map(normalizePasajero)
    : [];

  return {
    ...record,
    metodoPagamento: metodoArray,
    metodoPagamentoParsed: metodoArray,
    pasajeros: pasajerosNormalizados,
  };
}

function splitServicios(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((segmento) => segmento.trim())
    .filter((segmento): segmento is string => segmento.length > 0);
}

function sanitizeMetodoPagamento(value: string): string {
  let sanitized = value.replace(/\\\\/g, "\\").replace(/\\"/g, '"').trim();
  if (sanitized.startsWith("[") && sanitized.endsWith("]")) {
    sanitized = sanitized.slice(1, -1).trim();
  }
  if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
    sanitized = sanitized.slice(1, -1).trim();
  }
  if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
    sanitized = sanitized.slice(1, -1).trim();
  }
  return sanitized;
}

function normalizeMetodoPagamentoArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? sanitizeMetodoPagamento(item) : String(item),
      )
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) =>
            typeof item === "string"
              ? sanitizeMetodoPagamento(item)
              : String(item),
          )
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    } catch {
      // Ignore parse error and fall back
    }

    return value
      .split(",")
      .map((item) => sanitizeMetodoPagamento(item))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

// ==================== COMPONENTE PRINCIPAL ====================

export default function BiglietteriaPage() {
  const {
    canAccessGestione,
    isLoading: roleLoading,
    userRole,
    isUser,
  } = useUserRole();
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();

  // Estados principales
  const [records, setRecords] = useState<BiglietteriaRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Estados para edición y eliminación
  const [editingRecord, setEditingRecord] = useState<BiglietteriaRecord | null>(
    null,
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  // Estados para visualización de archivos
  const [viewingFiles, setViewingFiles] = useState<BiglietteriaRecord | null>(
    null,
  );
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Estados para modal de cliente
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Estados para tabla de detalles de pasajeros
  const [isPassengerDetailsOpen, setIsPassengerDetailsOpen] = useState(false);
  const [isPassengerDetailsSimpleOpen, setIsPassengerDetailsSimpleOpen] =
    useState(false);

  // Estado para edición inline de Pagamento
  const [editingPagamentoId, setEditingPagamentoId] = useState<string | null>(
    null,
  );

  // Estados para filtro de mes y año
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(
    new Date().getMonth(),
  );
  const [añoSeleccionado, setAñoSeleccionado] = useState<number>(
    new Date().getFullYear(),
  );

  // Estado para filtro de usuario creador
  const [filtroCreador, setFiltroCreador] = useState<string>("");
  const [usuarios, setUsuarios] = useState<
    Array<{
      clerkId: string;
      firstName: string;
      lastName: string;
      role: string;
    }>
  >([]);
  const [showCreadorDropdown, setShowCreadorDropdown] =
    useState<boolean>(false);

  const canUseAgentFilter = useMemo(() => {
    if (roleLoading) return false;
    return userRole === "ADMIN" || userRole === "TI";
  }, [roleLoading, userRole]);

  useEffect(() => {
    if (!canUseAgentFilter) {
      setFiltroCreador("");
      setCreadorSearchTerm("");
      setShowCreadorDropdown(false);
    }
  }, [canUseAgentFilter]);

  // Estados para filtro de pagamento
  const [pagamentos, setPagamentos] = useState<string[]>([]);

  // Estados para IATA y MetodoPagamento
  const [iataList, setIataList] = useState<string[]>([]);
  const [metodoPagamentoList, setMetodoPagamentoList] = useState<string[]>([]);
  const [acquistoOptions, setAcquistoOptions] = useState<string[]>([]);

  // Estados para búsqueda y paginación (igual que TOUR GRUPPO)
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para filtros (igual que TOUR GRUPPO) - creadorSearchTerm
  const [creadorSearchTerm, setCreadorSearchTerm] = useState("");

  // Estados para cliente dropdown
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  // Estados para pagamento dropdown (igual que cliente)
  const [showPagamentoDropdown, setShowPagamentoDropdown] = useState(false);
  const [pagamentoSearchTerm, setPagamentoSearchTerm] = useState("");

  // Estados para dropdowns individuales de IATA por pasajero y servicio
  const [showIndividualIataDropdowns, setShowIndividualIataDropdowns] =
    useState<{ [key: string]: boolean }>({});
  const [individualIataSearchTerms, setIndividualIataSearchTerms] = useState<{
    [key: string]: string;
  }>({});

  // Estados para MetodoPagamento dropdown (igual que cliente)
  const [showMetodoPagamentoDropdown, setShowMetodoPagamentoDropdown] =
    useState(false);
  const [metodoPagamentoSearchTerm, setMetodoPagamentoSearchTerm] =
    useState("");

  // Estado para controlar qué filas tienen expandidos los servicios
  const [expandedServiciosRows, setExpandedServiciosRows] = useState<
    Set<string>
  >(new Set());

  // Estados para servicios dropdown
  const [showServiziDropdown, setShowServiziDropdown] = useState<number | null>(
    null,
  );

  // Estados para servicios
  const [servizi, setServizi] = useState<
    Array<{ id: string; servizio: string; isActive: boolean }>
  >([]);

  // Función para filtrar clientes basado en la búsqueda
  const filteredClients =
    clients && Array.isArray(clients)
      ? clients.filter(
          (client) =>
            `${client.firstName} ${client.lastName}`
              .toLowerCase()
              .includes(clientSearchTerm.toLowerCase()) ||
            client.fiscalCode
              .toLowerCase()
              .includes(clientSearchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(clientSearchTerm.toLowerCase()),
        )
      : [];

  // Función para obtener pagamentos disponibles según el rol del usuario
  const getAvailablePagamentos = useMemo(() => {
    if (!pagamentos || !Array.isArray(pagamentos)) return [];

    // Si es USER, solo mostrar Acconto y Ricevuto
    if (isUser) {
      return pagamentos.filter(
        (pag) => pag === "Acconto" || pag === "Ricevuto",
      );
    }

    // ADMIN y TI pueden ver todas las opciones
    return pagamentos;
  }, [pagamentos, isUser]);

  // Función para filtrar pagamentos basado en la búsqueda (igual que clientes)
  const filteredPagamentos = getAvailablePagamentos.filter((pagamento) =>
    pagamento.toLowerCase().includes(pagamentoSearchTerm.toLowerCase()),
  );

  // Función para filtrar IATA basado en la búsqueda (igual que clientes)
  // Función para filtrar MetodoPagamento basado en la búsqueda (igual que clientes)
  const filteredMetodoPagamento =
    metodoPagamentoList && Array.isArray(metodoPagamentoList)
      ? metodoPagamentoList.filter((metodo) =>
          metodo
            .toLowerCase()
            .includes(metodoPagamentoSearchTerm.toLowerCase()),
        )
      : [];

  // Estados para archivos
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados para modal de detalles
  const [viewingDetails, setViewingDetails] =
    useState<BiglietteriaRecord | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Estados para funcionalidades de tabla
  const loadingClientData = false;

  // Estados para cuotas - REPLICANDO LÓGICA DE TOUR GRUPPO
  const [numeroCuotas, setNumeroCuotas] = useState<number>(0);
  const [cuotas, setCuotas] = useState<
    Array<{
      id?: string;
      numeroCuota: number;
      data: string;
      prezzo: string;
      note: string;
      isPagato: boolean;
      file: File | null;
      attachedFile?: string | null;
      attachedFileName?: string | null;
    }>
  >([]);

  // Estado para control de carga de cuotas en edición - REPLICANDO TOUR GRUPPO
  const [isLoadingCuotas, setIsLoadingCuotas] = useState(false);
  const cuotasInicializadas = useRef(false);

  // Resetear cuotas cuando se abre el modal en modo nuevo registro
  useEffect(() => {
    if (isModalOpen && !isEditMode && !isLoadingCuotas) {
      // Si el modal está abierto y no estamos en modo edición, resetear cuotas
      setNumeroCuotas(0);
      setCuotas([]);
      cuotasInicializadas.current = false;
    }
  }, [isModalOpen, isEditMode, isLoadingCuotas]);

  // Manejar cambio de número de cuotas - Actualizado para ser más dinámico
  useEffect(() => {
    // No sobrescribir cuotas si estamos cargando desde edición
    if (isLoadingCuotas) {
      return;
    }

    // Siempre actualizar dinámicamente cuando cambia el número de cuotas
    if (numeroCuotas > 0) {
      // Recrear las cuotas con el nuevo número
      const nuevasCuotas = Array.from({ length: numeroCuotas }, (_, i) => {
        // Buscar cuota existente por número de cuota (solo si ya existe una con ese número)
        const cuotaExistente = cuotas.find((c) => c.numeroCuota === i + 1);
        if (cuotaExistente && cuotaExistente.numeroCuota === i + 1) {
          // Preservar datos de cuota existente
          return {
            ...cuotaExistente,
            numeroCuota: i + 1,
          };
        }
        // Crear nueva cuota vacía
        return {
          numeroCuota: i + 1,
          data: "",
          prezzo: "",
          note: "",
          isPagato: false,
          file: null,
        };
      });
      setCuotas(nuevasCuotas);
      cuotasInicializadas.current = true;
    } else {
      // Si se selecciona 0 cuotas, limpiar el array
      setCuotas([]);
      cuotasInicializadas.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeroCuotas, isLoadingCuotas]);

  // Constantes - ahora se obtienen de la base de datos
  const serviciosDisponibles = servizi.map((s) => s.servizio);

  // ==================== FUNCIONES AUXILIARES ====================

  // Servicios conocidos que tienen campos específicos en la interfaz
  const serviciosConocidos = [
    "VOLO",
    "EXPRESS",
    "POLIZZA",
    "L.INVITO",
    "HOTEL",
  ];

  // Función para normalizar el nombre del servicio (para comparaciones)
  const normalizarServicio = (servicio: string): string => {
    return servicio.toUpperCase().trim();
  };

  // Función para verificar si un servicio es conocido
  const esServicioConocido = (servicio: string): boolean => {
    const normalizado = normalizarServicio(servicio);
    return serviciosConocidos.some(
      (conocido) =>
        normalizado.includes(conocido) || conocido.includes(normalizado),
    );
  };

  // Función para obtener servicios que requieren campos dinámicos
  const obtenerServiciosDinamicos = (servicios: string[]): string[] => {
    return servicios.filter((s) => !esServicioConocido(s));
  };

  const euroFormatter = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });

  const formatCurrencyDisplay = (
    value: number | string | null | undefined,
  ): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    const numericValue = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(numericValue)) {
      return "-";
    }
    return euroFormatter.format(numericValue);
  };

  const formatDateDisplay = (
    value: string | Date | null | undefined,
  ): string => {
    if (!value) return "-";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("it-IT");
  };

  const getReadableNotes = (value: string | null | undefined): string => {
    if (!value) return "";
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object") {
          if (
            typeof parsed.notasUsuario === "string" &&
            parsed.notasUsuario.trim()
          ) {
            return parsed.notasUsuario;
          }
          if (
            typeof parsed.descripcion === "string" &&
            parsed.descripcion.trim()
          ) {
            return parsed.descripcion;
          }
        }
      } catch {
        // ignorar errores de parseo
      }
    }
    return value;
  };

  const toISODateString = (
    value: string | Date | null | undefined,
  ): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  };

  const extractIataValue = (raw: unknown, servicio?: string): string => {
    if (!raw) return "";

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.startsWith("{")) {
        try {
          return extractIataValue(JSON.parse(trimmed), servicio);
        } catch {
          return trimmed;
        }
      }
      return trimmed;
    }

    if (typeof raw === "object" && raw !== null) {
      const record = raw as Record<string, unknown>;

      if (servicio) {
        const servicioLower = servicio.toLowerCase();
        const key = Object.keys(record).find((k) => {
          const lower = k.toLowerCase();
          return (
            lower === servicioLower ||
            servicioLower.includes(lower) ||
            lower.includes(servicioLower)
          );
        });
        const value = key ? record[key] : undefined;
        if (typeof value === "string") {
          return value;
        }
      }

      const values = Object.values(record).filter(
        (val): val is string =>
          typeof val === "string" && val.trim().length > 0,
      );

      return values.join(", ");
    }

    return String(raw);
  };

  const buildFallbackServicios = (
    pasajero: PasajeroData,
  ): PasajeroServicioDetalle[] => {
    const fallback: PasajeroServicioDetalle[] = [];

    const pushServicio = (
      servicio: string,
      data?: {
        iata?: string;
        neto?: string;
        venduto?: string;
        metodo?: string;
        andata?: string;
        ritorno?: string;
      },
    ) => {
      if (!data) return;
      const { iata, neto, venduto, metodo, andata, ritorno } = data;
      if (
        iata ||
        (neto !== undefined && neto !== "") ||
        (venduto !== undefined && venduto !== "") ||
        (metodo !== undefined && metodo !== "")
      ) {
        fallback.push({
          servicio,
          iata: iata || "",
          neto: neto ?? "",
          venduto: venduto ?? "",
          metodoDiAcquisto: metodo ?? "",
          andata: andata ?? null,
          ritorno: ritorno ?? null,
          estado: "Pendiente",
        });
      }
    };

    pushServicio("VOLO", {
      iata:
        pasajero.iataBiglietteria || extractIataValue(pasajero.iata, "volo"),
      neto: pasajero.netoBiglietteria,
      venduto: pasajero.vendutoBiglietteria,
      metodo: pasajero.metodoAcquistoBiglietteria,
      andata: pasajero.andata || undefined,
      ritorno: pasajero.ritorno || undefined,
    });

    pushServicio("EXPRESS", {
      iata: pasajero.iataExpress || extractIataValue(pasajero.iata, "express"),
      neto: pasajero.netoExpress,
      venduto: pasajero.vendutoExpress,
      metodo: pasajero.metodoAcquistoExpress,
    });

    pushServicio("POLIZZA", {
      iata: pasajero.iataPolizza || extractIataValue(pasajero.iata, "polizza"),
      neto: pasajero.netoPolizza,
      venduto: pasajero.vendutoPolizza,
      metodo: pasajero.metodoAcquistoPolizza,
    });

    pushServicio("L.INVITO", {
      iata:
        pasajero.iataLetteraInvito || extractIataValue(pasajero.iata, "invito"),
      neto: pasajero.netoLetteraInvito,
      venduto: pasajero.vendutoLetteraInvito,
      metodo: pasajero.metodoAcquistoLetteraInvito,
    });

    pushServicio("HOTEL", {
      iata: pasajero.iataHotel || extractIataValue(pasajero.iata, "hotel"),
      neto: pasajero.netoHotel,
      venduto: pasajero.vendutoHotel,
      metodo: pasajero.metodoAcquistoHotel,
    });

    if (pasajero.serviciosData) {
      Object.entries(pasajero.serviciosData).forEach(([servicio, data]) => {
        pushServicio(servicio, {
          iata: data.iata,
          neto: data.neto,
          venduto: data.venduto,
          metodo: data.metodoDiAcquisto,
        });
      });
    }

    return fallback;
  };

  const getServiciosDetallados = (
    pasajero: PasajeroData,
  ): PasajeroServicioDetalle[] => {
    if (pasajero.serviciosDetalle && pasajero.serviciosDetalle.length > 0) {
      return pasajero.serviciosDetalle;
    }
    return buildFallbackServicios(pasajero);
  };

  const getEstadoVisual = (estado?: string | null) => {
    const normalized = estado ? String(estado).trim() : "";
    const label = normalized || "Pendiente";
    const lower = label.toLowerCase();
    const isPagado =
      lower === "pagado" ||
      lower === "pagada" ||
      lower === "pagata" ||
      lower === "pagate";
    return {
      label,
      className: isPagado
        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200"
        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200",
    };
  };

  // Función para verificar si tiene Volo (anteriormente Biglietteria)
  const tieneBiglietteria = (servicios: string[]) => {
    return servicios.some((s) => s.toLowerCase().includes("volo"));
  };

  // Función para verificar si tiene servicios adicionales (cualquier servicio excepto Volo)
  const tieneServiciosAdicionales = (servicios: string[]) => {
    return servicios.some((s) => !tieneBiglietteria([s]));
  };

  // Función para verificar si tiene servicios que NO son adicionales
  const tieneServiciosNoAdicionales = (servicios: string[]) => {
    const hasBiglietteria = tieneBiglietteria(servicios); // hasBiglietteria ahora verifica "volo"
    const hasAdicionales = tieneServiciosAdicionales(servicios);

    if (hasBiglietteria && hasAdicionales) {
      // Si tiene Volo + servicios adicionales
      return {
        showDateFields: true,
        showBiglietteriaFields: true,
        showAdditionalServiceFields: true,
      };
    } else if (hasBiglietteria && !hasAdicionales) {
      // Si solo tiene Volo + otros servicios (no adicionales)
      return {
        showDateFields: true,
        showBiglietteriaFields: true,
        showAdditionalServiceFields: false,
      };
    } else if (!hasBiglietteria && hasAdicionales) {
      // Si solo tiene servicios adicionales (sin Volo)
      return {
        showDateFields: false,
        showBiglietteriaFields: false,
        showAdditionalServiceFields: true,
      };
    } else {
      // Si no tiene servicios
      return {
        showDateFields: false,
        showBiglietteriaFields: false,
        showAdditionalServiceFields: false,
      };
    }
  };

  // Función para determinar qué campos mostrar para un pasajero
  const shouldShowFieldsForPasajero = (pasajero: PasajeroData) => {
    return tieneServiciosNoAdicionales(pasajero.servicios);
  };

  // Estado del formulario
  const [formData, setFormData] = useState<BiglietteriaFormData>({
    cliente: "",
    codiceFiscale: "",
    indirizzo: "",
    email: "",
    numeroTelefono: "",
    pagamento: "",
    data: new Date().toISOString().split("T")[0],
    pnr: "",
    itinerario: "",
    metodoPagamento: [], // Array de métodos de pago
    notaDiVendita: "",
    notaDiRicevuta: "",
    numeroPasajeros: 1,
    pasajeros: [crearPasajeroVacio()],
    netoPrincipal: "",
    vendutoTotal: "",
    acconto: "",
    daPagare: "",
    feeAgv: "",
  });

  // Función para calcular totales
  const calcularTotales = useCallback(
    (pasajeros: PasajeroData[], accontoValue: string): TotalesCalculados => {
      let netoPrincipal = 0;
      let vendutoTotal = 0;

      pasajeros.forEach((pasajero) => {
        // Sumar Biglietteria
        if (pasajero.netoBiglietteria)
          netoPrincipal += parseFloat(pasajero.netoBiglietteria) || 0;
        if (pasajero.vendutoBiglietteria)
          vendutoTotal += parseFloat(pasajero.vendutoBiglietteria) || 0;

        // Sumar servicios adicionales
        if (pasajero.tieneExpress) {
          if (pasajero.netoExpress)
            netoPrincipal += parseFloat(pasajero.netoExpress) || 0;
          if (pasajero.vendutoExpress)
            vendutoTotal += parseFloat(pasajero.vendutoExpress) || 0;
        }
        if (pasajero.tienePolizza) {
          if (pasajero.netoPolizza)
            netoPrincipal += parseFloat(pasajero.netoPolizza) || 0;
          if (pasajero.vendutoPolizza)
            vendutoTotal += parseFloat(pasajero.vendutoPolizza) || 0;
        }
        if (pasajero.tieneLetteraInvito) {
          if (pasajero.netoLetteraInvito)
            netoPrincipal += parseFloat(pasajero.netoLetteraInvito) || 0;
          if (pasajero.vendutoLetteraInvito)
            vendutoTotal += parseFloat(pasajero.vendutoLetteraInvito) || 0;
        }
        if (pasajero.tieneHotel) {
          if (pasajero.netoHotel)
            netoPrincipal += parseFloat(pasajero.netoHotel) || 0;
          if (pasajero.vendutoHotel)
            vendutoTotal += parseFloat(pasajero.vendutoHotel) || 0;
        }

        // Sumar servicios dinámicos
        if (pasajero.serviciosData) {
          Object.values(pasajero.serviciosData).forEach((servicioData) => {
            if (servicioData.neto)
              netoPrincipal += parseFloat(servicioData.neto) || 0;
            if (servicioData.venduto)
              vendutoTotal += parseFloat(servicioData.venduto) || 0;
          });
        }
      });

      const acconto = parseFloat(accontoValue) || 0;
      const daPagare = vendutoTotal - acconto;
      const feeAgv = vendutoTotal - netoPrincipal;

      return {
        netoPrincipal: netoPrincipal.toFixed(2),
        vendutoTotal: vendutoTotal.toFixed(2),
        daPagare: daPagare.toFixed(2),
        feeAgv: feeAgv.toFixed(2),
      };
    },
    [],
  );

  const totalesCalculados = useMemo(
    () => calcularTotales(formData.pasajeros, formData.acconto),
    [formData.pasajeros, formData.acconto, calcularTotales],
  );

  // ==================== EFECTOS ====================

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Inicializar dropdowns de pasajeros

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".client-dropdown-container")) {
        setShowClientDropdown(false);
      }
      if (!target.closest(".pagamento-dropdown-container")) {
        setShowPagamentoDropdown(false);
      }
      if (!target.closest(".metodo-pagamento-dropdown-container")) {
        setShowMetodoPagamentoDropdown(false);
      }
      // Creador dropdown (para filtros)
      if (!target.closest(".creador-dropdown-container")) {
        setShowCreadorDropdown(false);
      }

      // Cerrar todos los dropdowns individuales de IATA si no se está haciendo click en ninguno
      if (!target.closest(".iata-dropdown-container")) {
        setShowIndividualIataDropdowns({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [formData.numeroPasajeros]);

  // Calcular Acconto automáticamente sumando las cuotas pagadas
  // Solo actualiza cuando cambia el estado isPagato de las cuotas, no cuando se seleccionan cuotas
  const estadoIsPagatoRef = useRef<
    Map<string, { isPagato: boolean; monto: number }>
  >(new Map());

  useEffect(() => {
    // Crear un mapa de estado isPagato actual por cuota
    const estadoIsPagatoActual = new Map<
      string,
      { isPagato: boolean; monto: number }
    >();
    cuotas.forEach((cuota) => {
      const key = cuota.id || `${cuota.numeroCuota}-${cuota.prezzo}`;
      const monto = parseFloat(cuota.prezzo.toString()) || 0;
      estadoIsPagatoActual.set(key, {
        isPagato: cuota.isPagato || false,
        monto,
      });
    });

    // Detectar cambios en isPagato (no solo agregar/remover cuotas)
    let cambioDetectado = false;
    let diferencia = 0;

    // Comparar con estado anterior - detectar cambios en isPagato
    estadoIsPagatoActual.forEach((estado, key) => {
      const estadoAnterior = estadoIsPagatoRef.current.get(key);
      if (estadoAnterior && estadoAnterior.isPagato !== estado.isPagato) {
        // Hubo cambio en el estado de pagado
        cambioDetectado = true;
        diferencia += estado.isPagato ? estado.monto : -estado.monto;
      }
    });

    // Verificar si se eliminó una cuota que estaba pagada
    estadoIsPagatoRef.current.forEach((estadoAnterior, key) => {
      if (!estadoIsPagatoActual.has(key) && estadoAnterior.isPagato) {
        cambioDetectado = true;
        diferencia -= estadoAnterior.monto;
      }
    });

    // Solo actualizar si hubo cambio en isPagato
    if (cambioDetectado) {
      const accontoActual = parseFloat(formData.acconto) || 0;
      const nuevoAcconto = Math.max(0, accontoActual + diferencia);

      setFormData((prev) => ({
        ...prev,
        acconto: nuevoAcconto.toFixed(2),
      }));
    }

    // Actualizar referencia
    estadoIsPagatoRef.current = new Map(estadoIsPagatoActual);
  }, [cuotas, formData.acconto]);

  // Calcular totales automáticamente cuando cambien los pasajeros o acconto
  useEffect(() => {
    setFormData((prev) => {
      if (
        prev.netoPrincipal === totalesCalculados.netoPrincipal &&
        prev.vendutoTotal === totalesCalculados.vendutoTotal &&
        prev.daPagare === totalesCalculados.daPagare &&
        prev.feeAgv === totalesCalculados.feeAgv
      ) {
        return prev;
      }

      return {
        ...prev,
        netoPrincipal: totalesCalculados.netoPrincipal,
        vendutoTotal: totalesCalculados.vendutoTotal,
        daPagare: totalesCalculados.daPagare,
        feeAgv: totalesCalculados.feeAgv,
      };
    });
  }, [totalesCalculados]);

  // Cargar datos iniciales - OPTIMIZADO: Mostrar datos del caché inmediatamente
  const fetchData = useCallback(async () => {
    if (roleLoading) return;
    try {
      // OPTIMIZACIÓN: Primero verificar si hay datos en caché
      // Si hay datos en caché, mostrarlos inmediatamente sin loading
      const biglietteriaUrl = `/api/biglietteria${isUser ? "?userOnly=true" : ""}`;
      // Datos dinámicos: 30 segundos
      const cachedRecords = getCachedData<{ records: BiglietteriaRecordApi[] }>(
        biglietteriaUrl,
        { ttlMs: 30000 },
      );
      // Datos de referencia: 5 minutos
      const cachedClients = getCachedData<{ clients: Client[] }>(
        "/api/clients",
        { ttlMs: 300000 },
      );
      const cachedServizi = getCachedData<ServizioOption[]>("/api/servizi", {
        ttlMs: 300000,
      });
      const cachedUsers = getCachedData<ApiUser[]>("/api/users", {
        ttlMs: 300000,
      });
      const cachedPagamentos = getCachedData<PagamentoOption[]>(
        "/api/pagamento",
        { ttlMs: 300000 },
      );
      const cachedIata = getCachedData<IataOption[]>("/api/iata", {
        ttlMs: 300000,
      });
      const cachedMetodo = getCachedData<{
        metodosPagamento: MetodoPagamentoOption[];
      }>("/api/metodo-pagamento", { ttlMs: 300000 });
      const cachedAcquisto = getCachedData<{ acquisti: AcquistoOption[] }>(
        "/api/acquisto",
        { ttlMs: 300000 },
      );

      // Si tenemos todos los datos en caché, mostrarlos inmediatamente
      const hasAllCachedData =
        cachedRecords &&
        cachedClients &&
        cachedServizi &&
        cachedUsers &&
        cachedPagamentos &&
        cachedIata &&
        cachedMetodo &&
        cachedAcquisto;

      if (hasAllCachedData) {
        // Mostrar datos del caché inmediatamente (sin loading)
        const processedRecords = (cachedRecords.records ?? []).map(
          processRecord,
        );
        setRecords(processedRecords);
        setClients(
          Array.isArray(cachedClients.clients) ? cachedClients.clients : [],
        );
        setServizi(Array.isArray(cachedServizi) ? cachedServizi : []);

        const validRoles = new Set(["USER", "ADMIN", "TI"]);
        const rawUsersArray = Array.isArray(cachedUsers)
          ? cachedUsers
          : Array.isArray((cachedUsers as { users?: ApiUser[] })?.users)
            ? ((cachedUsers as { users?: ApiUser[] }).users ?? [])
            : [];
        const usuariosNormalizados = rawUsersArray.filter((usuario) => {
          const role =
            typeof usuario.role === "string" ? usuario.role.toUpperCase() : "";
          return validRoles.has(role);
        });
        setUsuarios(usuariosNormalizados);

        const pagamentosNombres = (
          Array.isArray(cachedPagamentos) ? cachedPagamentos : []
        ).map((option) => option.pagamento);
        setPagamentos(pagamentosNombres);

        const iataNombres = (Array.isArray(cachedIata) ? cachedIata : []).map(
          (option) => option.iata,
        );
        setIataList(iataNombres);

        const metodoPagamentoNombres = (
          cachedMetodo?.metodosPagamento ?? []
        ).map((option) => option.metodoPagamento);
        setMetodoPagamentoList(metodoPagamentoNombres);

        const acquistoNombres = Array.isArray(cachedAcquisto?.acquisti)
          ? cachedAcquisto.acquisti.map((item) => item.acquisto)
          : [];
        setAcquistoOptions(acquistoNombres);

        setLoading(false); // No mostrar loading si tenemos datos en caché
      } else {
        // Si no hay datos en caché, mostrar loading
        setLoading(true);
      }

      // Siempre hacer fetch en background para actualizar datos (incluso si tenemos caché)
      const [
        recordsData,
        clientsData,
        serviziData,
        usersData,
        pagamentosData,
        iataData,
        metodoData,
        acquistoData,
      ] = await Promise.all([
        // Datos dinámicos: 30 segundos (cambian frecuentemente)
        cachedFetch<{ records: BiglietteriaRecordApi[] }>(biglietteriaUrl, {
          ttlMs: 30000,
        }),
        // Datos de referencia: 5 minutos (cambian raramente)
        cachedFetch<{ clients: Client[] }>(`/api/clients`, {
          ttlMs: 300000,
        }).catch(() => ({ clients: [] })),
        cachedFetch<ServizioOption[]>("/api/servizi", { ttlMs: 300000 }).catch(
          () => [],
        ),
        cachedFetch<ApiUser[]>("/api/users", { ttlMs: 300000 }).catch(() => []),
        cachedFetch<PagamentoOption[]>("/api/pagamento", {
          ttlMs: 300000,
        }).catch(() => []),
        cachedFetch<IataOption[]>("/api/iata", { ttlMs: 300000 }).catch(
          () => [],
        ),
        cachedFetch<{ metodosPagamento: MetodoPagamentoOption[] }>(
          "/api/metodo-pagamento",
          {
            ttlMs: 300000,
          },
        ).catch(() => ({ metodosPagamento: [] })),
        cachedFetch<{ acquisti: AcquistoOption[] }>("/api/acquisto", {
          ttlMs: 300000,
        }).catch(() => ({ acquisti: [] })),
      ]);

      // Procesar registros y pre-parsear metodoPagamento para evitar JSON.parse en filtro
      const processedRecords = (recordsData?.records ?? []).map(processRecord);
      setRecords(processedRecords);

      // Procesar clientes
      setClients(
        Array.isArray(clientsData?.clients) ? clientsData.clients : [],
      );

      // Procesar servicios
      setServizi(Array.isArray(serviziData) ? serviziData : []);

      // Procesar usuarios
      const validRoles = new Set(["USER", "ADMIN", "TI"]);
      const rawUsersArray = Array.isArray(usersData)
        ? usersData
        : Array.isArray((usersData as { users?: ApiUser[] })?.users)
          ? ((usersData as { users?: ApiUser[] }).users ?? [])
          : [];
      const usuariosNormalizados = rawUsersArray.filter((usuario) => {
        const role =
          typeof usuario.role === "string" ? usuario.role.toUpperCase() : "";
        return validRoles.has(role);
      });
      setUsuarios(usuariosNormalizados);

      // Procesar pagamentos
      const pagamentosNombres = (
        Array.isArray(pagamentosData) ? pagamentosData : []
      ).map((option) => option.pagamento);
      setPagamentos(pagamentosNombres);

      // Procesar IATA
      const iataNombres = (Array.isArray(iataData) ? iataData : []).map(
        (option) => option.iata,
      );
      setIataList(iataNombres);

      // Procesar MetodoPagamento
      const metodoPagamentoNombres = (metodoData?.metodosPagamento ?? []).map(
        (option) => option.metodoPagamento,
      );
      setMetodoPagamentoList(metodoPagamentoNombres);

      const acquistoNombres = Array.isArray(acquistoData?.acquisti)
        ? acquistoData.acquisti.map((item) => item.acquisto)
        : [];
      setAcquistoOptions(acquistoNombres);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, [roleLoading, isUser]);

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
        ...Array(nuevoNumero - pasajerosActuales.length)
          .fill(null)
          .map(() => crearPasajeroVacio()),
      ];
    } else {
      // Quitar pasajeros
      nuevosPasajeros = pasajerosActuales.slice(0, nuevoNumero);
    }

    // Actualizar el array de dropdowns
    setShowServiziDropdown(null);

    setFormData((prev) => ({
      ...prev,
      numeroPasajeros: nuevoNumero,
      pasajeros: nuevosPasajeros,
    }));
  };

  // Handler para actualizar datos de un pasajero
  const handlePasajeroChange = <K extends keyof PasajeroData>(
    index: number,
    field: K,
    value: PasajeroData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      pasajeros: prev.pasajeros.map((p, i) => {
        if (i !== index) return p;

        // 1. Actualizar el campo plano
        const updatedPasajero = { ...p, [field]: value };

        // 2. Sincronizar serviciosDetalle si es un campo financiero o relevante
        // Esto soluciona el problema donde el backend prioriza serviciosDetalle (con valores viejos) sobre los campos planos nuevos
        const fieldStr = String(field);
        if (
          updatedPasajero.serviciosDetalle &&
          updatedPasajero.serviciosDetalle.length > 0 &&
          (fieldStr.startsWith("neto") ||
            fieldStr.startsWith("venduto") ||
            fieldStr.startsWith("iata") ||
            fieldStr.startsWith("metodoAcquisto"))
        ) {
          // Identificar el tipo de servicio basado en el sufijo del campo
          let targetSuffix = "";
          let targetProp: keyof PasajeroServicioDetalle | "" = "";

          if (fieldStr.includes("Biglietteria")) targetSuffix = "Biglietteria";
          else if (fieldStr.includes("Express")) targetSuffix = "Express";
          else if (fieldStr.includes("Polizza")) targetSuffix = "Polizza";
          else if (fieldStr.includes("LetteraInvito"))
            targetSuffix = "LetteraInvito";
          else if (fieldStr.includes("Hotel")) targetSuffix = "Hotel";

          // Mapear el nombre del campo a la propiedad del detalle
          if (fieldStr.startsWith("neto")) targetProp = "neto";
          else if (fieldStr.startsWith("venduto")) targetProp = "venduto";
          else if (fieldStr.startsWith("iata")) targetProp = "iata";
          else if (fieldStr.startsWith("metodoAcquisto"))
            targetProp = "metodoDiAcquisto";

          if (targetSuffix && targetProp) {
            updatedPasajero.serviciosDetalle =
              updatedPasajero.serviciosDetalle.map((detalle) => {
                const servicioNorm = normalizarServicio(detalle.servicio);
                let isMatch = false;

                // Lógica de coincidencia de servicios (consistente con el resto del componente)
                if (targetSuffix === "Biglietteria")
                  isMatch =
                    servicioNorm.includes("VOLO") ||
                    servicioNorm.includes("BIGLIETTERIA");
                else if (targetSuffix === "Express")
                  isMatch = servicioNorm.includes("EXPRESS");
                else if (targetSuffix === "Polizza")
                  isMatch = servicioNorm.includes("POLIZZA");
                else if (targetSuffix === "LetteraInvito")
                  isMatch =
                    servicioNorm.includes("INVITO") ||
                    servicioNorm.includes("LETTERA");
                else if (targetSuffix === "Hotel")
                  isMatch = servicioNorm.includes("HOTEL");

                if (isMatch) {
                  // Actualizar la propiedad en el detalle para mantener consistencia
                  return { ...detalle, [targetProp]: value };
                }
                return detalle;
              });
          }
        }

        // 3. Sincronizar serviciosData (servicios dinámicos) con serviciosDetalle
        // Esto es CRÍTICO: el backend usa serviciosDetalle para guardar. Si solo actualizamos serviciosData,
        // el backend recibirá serviciosDetalle desactualizado y "revertirá" los cambios de precio.
        if (
          fieldStr === "serviciosData" &&
          updatedPasajero.serviciosDetalle &&
          updatedPasajero.serviciosDetalle.length > 0 &&
          value
        ) {
          const serviciosData = value as Record<
            string,
            {
              iata: string;
              neto: string;
              venduto: string;
              metodoDiAcquisto?: string;
            }
          >;

          updatedPasajero.serviciosDetalle =
            updatedPasajero.serviciosDetalle.map((detalle) => {
              const servicioNorm = normalizarServicio(detalle.servicio);
              const data = serviciosData[servicioNorm];

              if (data) {
                // Si encontramos datos para este servicio en el nuevo serviciosData, actualizamos el detalle
                return {
                  ...detalle,
                  iata: data.iata,
                  neto: data.neto,
                  venduto: data.venduto,
                  metodoDiAcquisto:
                    data.metodoDiAcquisto || detalle.metodoDiAcquisto,
                };
              }
              return detalle;
            });
        }

        return updatedPasajero;
      }),
    }));
  };

  // Handler para toggle servicio de un pasajero
  const handleServicioToggle = (index: number, servicio: string) => {
    setFormData((prev) => ({
      ...prev,
      pasajeros: prev.pasajeros.map((p, i) => {
        if (i !== index) return p;

        // Toggle el servicio
        const servicios = p.servicios.includes(servicio)
          ? p.servicios.filter((s) => s !== servicio)
          : [...p.servicios, servicio];

        // Determinar qué servicios están activos
        const hasBiglietteria = tieneBiglietteria(servicios);
        const tieneExpress = servicios.some((s) =>
          s.toLowerCase().includes("express"),
        );
        const tienePolizza = servicios.some((s) =>
          s.toLowerCase().includes("polizza"),
        );
        const tieneLetteraInvito = servicios.some(
          (s) =>
            s.toLowerCase().includes("l.invito") ||
            s.toLowerCase().includes("lettera"),
        );
        const tieneHotel = servicios.some((s) =>
          s.toLowerCase().includes("hotel"),
        );

        // Manejar serviciosData dinámicos
        const serviciosData = { ...(p.serviciosData || {}) };

        // Obtener servicios dinámicos actuales
        const serviciosDinamicosActuales = obtenerServiciosDinamicos(servicios);
        const serviciosDinamicosKeys = serviciosDinamicosActuales.map((s) =>
          normalizarServicio(s),
        );

        // Limpiar serviciosData que ya no están seleccionados
        Object.keys(serviciosData).forEach((key) => {
          if (!serviciosDinamicosKeys.includes(key)) {
            delete serviciosData[key];
          }
        });

        // Inicializar serviciosData para nuevos servicios dinámicos
        serviciosDinamicosActuales.forEach((servicio) => {
          const servicioKey = normalizarServicio(servicio);
          if (!serviciosData[servicioKey]) {
            serviciosData[servicioKey] = {
              iata: "",
              neto: "",
              venduto: "",
              metodoDiAcquisto: "",
            };
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
          andata: hasBiglietteria ? p.andata : "",
          ritorno: hasBiglietteria ? p.ritorno : "",
          netoBiglietteria: hasBiglietteria ? p.netoBiglietteria : "",
          vendutoBiglietteria: hasBiglietteria ? p.vendutoBiglietteria : "",
          metodoAcquistoBiglietteria: hasBiglietteria
            ? p.metodoAcquistoBiglietteria
            : "",
          netoExpress: tieneExpress ? p.netoExpress : "",
          vendutoExpress: tieneExpress ? p.vendutoExpress : "",
          metodoAcquistoExpress: tieneExpress ? p.metodoAcquistoExpress : "",
          netoPolizza: tienePolizza ? p.netoPolizza : "",
          vendutoPolizza: tienePolizza ? p.vendutoPolizza : "",
          metodoAcquistoPolizza: tienePolizza ? p.metodoAcquistoPolizza : "",
          netoLetteraInvito: tieneLetteraInvito ? p.netoLetteraInvito : "",
          vendutoLetteraInvito: tieneLetteraInvito
            ? p.vendutoLetteraInvito
            : "",
          metodoAcquistoLetteraInvito: tieneLetteraInvito
            ? p.metodoAcquistoLetteraInvito
            : "",
          netoHotel: tieneHotel ? p.netoHotel : "",
          vendutoHotel: tieneHotel ? p.vendutoHotel : "",
          metodoAcquistoHotel: tieneHotel ? p.metodoAcquistoHotel : "",
        };
      }),
    }));
  };

  // Handler para seleccionar cliente
  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find((c) => c.id === clientId);
    if (selectedClient) {
      setSelectedClientId(clientId);
      setFormData((prev) => ({
        ...prev,
        cliente: `${selectedClient.firstName} ${selectedClient.lastName}`,
        codiceFiscale: selectedClient.fiscalCode,
        indirizzo: selectedClient.address,
        email: selectedClient.email,
        numeroTelefono: selectedClient.phoneNumber,
      }));
      setShowClientDropdown(false);
      setClientSearchTerm("");
    }
  };

  // Handler para seleccionar pagamento (igual que cliente)
  const handlePagamentoSelect = (pagamento: string) => {
    setFormData((prev) => ({
      ...prev,
      pagamento: pagamento,
    }));
    setShowPagamentoDropdown(false);
    setPagamentoSearchTerm("");
  };

  // Funciones para manejar dropdowns individuales de IATA
  const getIndividualIataKey = (pasajeroIndex: number, servicio: string) => {
    return `${pasajeroIndex}-${servicio}`;
  };

  const isIndividualIataDropdownOpen = (
    pasajeroIndex: number,
    servicio: string,
  ) => {
    const key = getIndividualIataKey(pasajeroIndex, servicio);
    return showIndividualIataDropdowns[key] || false;
  };

  const getIndividualIataSearchTerm = (
    pasajeroIndex: number,
    servicio: string,
  ) => {
    const key = getIndividualIataKey(pasajeroIndex, servicio);
    return individualIataSearchTerms[key] || "";
  };

  const setIndividualIataDropdown = (
    pasajeroIndex: number,
    servicio: string,
    isOpen: boolean,
  ) => {
    const key = getIndividualIataKey(pasajeroIndex, servicio);
    setShowIndividualIataDropdowns((prev) => ({
      ...prev,
      [key]: isOpen,
    }));
  };

  const setIndividualIataSearchTerm = (
    pasajeroIndex: number,
    servicio: string,
    term: string,
  ) => {
    const key = getIndividualIataKey(pasajeroIndex, servicio);
    setIndividualIataSearchTerms((prev) => ({
      ...prev,
      [key]: term,
    }));
  };

  const handleIndividualIataSelect = (
    pasajeroIndex: number,
    servicio: string,
    iata: string,
  ) => {
    // Mapear servicio a campo IATA específico
    const campoIata =
      servicio === "EXPRESS"
        ? "iataExpress"
        : servicio === "POLIZZA"
          ? "iataPolizza"
          : servicio === "HOTEL"
            ? "iataHotel"
            : servicio === "L.INVITO" ||
                servicio === "LETTERA" ||
                servicio === "LETTERA D'INVITO"
              ? "iataLetteraInvito"
              : servicio === "Volo" ||
                  servicio === "VOLO" ||
                  servicio === "Biglietteria" ||
                  servicio === "BIGLIETTERIA"
                ? "iataBiglietteria"
                : "iata"; // Fallback para compatibilidad

    handlePasajeroChange(pasajeroIndex, campoIata as keyof PasajeroData, iata);
    setIndividualIataDropdown(pasajeroIndex, servicio, false);
    setIndividualIataSearchTerm(pasajeroIndex, servicio, "");
  };

  // Función para filtrar IATA individual
  const getFilteredIndividualIata = (
    pasajeroIndex: number,
    servicio: string,
  ) => {
    const searchTerm = getIndividualIataSearchTerm(pasajeroIndex, servicio);
    return iataList && Array.isArray(iataList)
      ? iataList.filter((iata) =>
          iata.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : [];
  };

  // Handler para toggle de MetodoPagamento (igual que servicios)
  const handleMetodoPagamentoToggle = (metodo: string) => {
    setFormData((prev) => {
      const sanitizedMetodo = sanitizeMetodoPagamento(metodo);
      const currentMetodos = (prev.metodoPagamento || []).map(
        sanitizeMetodoPagamento,
      );
      const isSelected = currentMetodos.includes(sanitizedMetodo);

      if (isSelected) {
        // Remover si ya está seleccionado
        return {
          ...prev,
          metodoPagamento: currentMetodos.filter((m) => m !== sanitizedMetodo),
        };
      } else {
        // Agregar si no está seleccionado
        return {
          ...prev,
          metodoPagamento: [...currentMetodos, sanitizedMetodo],
        };
      }
    });
    setMetodoPagamentoSearchTerm("");
  };

  // Handler para ver cliente (igual que TOUR GRUPPO)
  const handleClientClick = (clienteName: string) => {
    // Buscar el cliente por nombre completo o código fiscal
    const client = clients.find(
      (c) =>
        `${c.firstName} ${c.lastName}` === clienteName ||
        c.fiscalCode === clienteName,
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
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("❌ Error al descargar archivo:", error);
      // Fallback: abrir en nueva ventana
      window.open(url, "_blank");
    }
  };

  // Función para contar archivos (igual que TOUR GRUPPO)
  const countFiles = (record: BiglietteriaRecord): number => {
    let count = 0;
    if (record.attachedFile) count++;
    if (record.cuotas) {
      count += record.cuotas.filter((c) => c.attachedFile).length;
    }
    return count;
  };

  // Handler para generar recibo
  const handleGenerateRicevuta = async (recordId: string) => {
    try {
      setMessage({
        type: "success",
        text: "Generando ricevuta...",
      });

      const response = await fetch("/api/biglietteria/generate-ricevuta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recordId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Error al generar ricevuta (${response.status})`,
        );
      }

      // Descargar el archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extraer el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `Ricevuta_${recordId}_${new Date().getTime()}.pdf`;

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({
        type: "success",
        text: "Ricevuta generata con successo!",
      });
    } catch (error) {
      console.error("Error generating ricevuta:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Errore durante la generazione della ricevuta",
      });
    }
  };

  // Función para exportar a Excel (igual que TOUR GRUPPO)
  const handleExportToExcel = () => {
    const dataToExport = filteredRecords.map((record) => ({
      Cliente: record.cliente,
      "Codice Fiscale": record.codiceFiscale,
      Indirizzo: record.indirizzo,
      Email: record.email,
      Telefono: record.numeroTelefono,
      Pagamento: record.pagamento,
      Data: new Date(record.data).toLocaleDateString("it-IT"),
      PNR: record.pnr,
      Servizi: (() => {
        // Extraer todos los servicios únicos de todos los pasajeros
        const serviciosSet = new Set<string>();
        if (record.pasajeros && Array.isArray(record.pasajeros)) {
          record.pasajeros.forEach((pasajero: PasajeroApi) => {
            if (pasajero.servicios && Array.isArray(pasajero.servicios)) {
              pasajero.servicios.forEach((servicio: string) => {
                serviciosSet.add(servicio.trim());
              });
            } else if (typeof pasajero.servizio === "string") {
              // Compatibilidad con formato antiguo
              const servicios = pasajero.servizio
                .split(",")
                .map((s) => s.trim());
              servicios.forEach((servicio: string) => {
                serviciosSet.add(servicio);
              });
            }
          });
        }
        return Array.from(serviciosSet).join(", ") || "-";
      })(),
      Itinerario: record.itinerario,
      Neto: record.netoPrincipal,
      Venduto: record.vendutoTotal,
      "Pagato/Acconto": record.acconto,
      "Da Pagare": record.daPagare,
      "Metodo Pagamento": (() => {
        try {
          const parsed =
            typeof record.metodoPagamento === "string"
              ? JSON.parse(record.metodoPagamento)
              : record.metodoPagamento;
          return Array.isArray(parsed)
            ? parsed.join(", ")
            : record.metodoPagamento;
        } catch {
          return record.metodoPagamento;
        }
      })(),
      "Fee AGV": record.feeAgv,
      Agente: record.creator?.firstName
        ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ""}`.trim()
        : record.creator?.email || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Biglietteria");

    const fileName = `biglietteria_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // OPTIMIZACIÓN: Memoizar el cálculo del nombre del creator para evitar re-calcularlo
  const getCreatorName = useCallback(
    (creator?: RecordCreator | null): string => {
      if (creator?.firstName) {
        return `${creator.firstName}${creator.lastName ? ` ${creator.lastName}` : ""}`.trim();
      }
      return creator?.email || "N/A";
    },
    [],
  );

  // OPTIMIZACIÓN: Memoizar fechas parseadas para evitar crear nuevos Date en cada render
  // Calcular primer y último día del mes seleccionado
  const fechaDesdeDate = useMemo(() => {
    return new Date(añoSeleccionado, mesSeleccionado, 1);
  }, [añoSeleccionado, mesSeleccionado]);

  const fechaHastaDate = useMemo(() => {
    return new Date(añoSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);
  }, [añoSeleccionado, mesSeleccionado]);

  // Filtrado y paginación - OPTIMIZADO: useMemo y uso de datos pre-parseados
  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];

    const searchLower = searchTerm ? searchTerm.toLowerCase() : "";

    return records.filter((record) => {
      // Filtro por búsqueda de texto - OPTIMIZADO: usar metodoPagamentoParsed pre-parseado
      if (searchTerm) {
        // Usar metodoPagamentoParsed en lugar de hacer JSON.parse aquí
        const metodoPagamentoText = record.metodoPagamentoParsed
          ? record.metodoPagamentoParsed.join(", ")
          : record.metodoPagamento || "";

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
          creatorName,
        ];

        const matchesSearch = searchFields.some(
          (field) =>
            field && field.toString().toLowerCase().includes(searchLower),
        );

        if (!matchesSearch) return false;
      }

      // Filtro por mes y año - OPTIMIZADO: usar fechas memoizadas
      const recordDate = new Date(record.data);
      if (recordDate < fechaDesdeDate || recordDate > fechaHastaDate)
        return false;

      // Filtro por creador - solo para TI/ADMIN
      if (canUseAgentFilter && filtroCreador) {
        const nombreCompleto = getCreatorName(record.creator);
        if (nombreCompleto !== filtroCreador) return false;
      }

      return true;
    });
  }, [
    records,
    searchTerm,
    fechaDesdeDate,
    fechaHastaDate,
    filtroCreador,
    getCreatorName,
    canUseAgentFilter,
  ]);

  const totalItems = filteredRecords.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredRecords.slice(startIndex, endIndex);

  // Calcular totales de las columnas NETO, VENDUTO, PAGATO/ACCONTO, DAPAGARE y FEE/AGV
  const totales = useMemo(() => {
    const totalNeto = filteredRecords.reduce(
      (sum, record) => sum + (record.netoPrincipal || 0),
      0,
    );
    const totalVenduto = filteredRecords.reduce(
      (sum, record) => sum + (record.vendutoTotal || 0),
      0,
    );
    const totalAcconto = filteredRecords.reduce(
      (sum, record) => sum + (record.acconto || 0),
      0,
    );
    const totalDaPagare = filteredRecords.reduce(
      (sum, record) => sum + (record.daPagare || 0),
      0,
    );
    const totalFeeAgv = filteredRecords.reduce(
      (sum, record) => sum + (record.feeAgv || 0),
      0,
    );

    return {
      totalNeto,
      totalVenduto,
      totalAcconto,
      totalDaPagare,
      totalFeeAgv,
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
        throw new Error("Por favor complete todos los campos obligatorios");
      }

      if (formData.pasajeros.length === 0) {
        throw new Error("Debe agregar al menos un pasajero");
      }

      // Validar metodoPagamento
      if (!formData.metodoPagamento || formData.metodoPagamento.length === 0) {
        throw new Error("Debe seleccionar al menos un método de pago");
      }

      // Validar que cada pasajero tenga nombre y al menos un servicio
      for (let i = 0; i < formData.pasajeros.length; i++) {
        const p = formData.pasajeros[i];
        if (!p.nombrePasajero) {
          throw new Error(`El pasajero ${i + 1} debe tener nombre`);
        }
        if (p.servicios.length === 0) {
          throw new Error(
            `El pasajero ${i + 1} debe tener al menos un servicio seleccionado`,
          );
        }
      }

      // Preparar datos para enviar
      const dataToSend = new FormData();

      // Datos básicos
      Object.entries(formData).forEach(([key, value]) => {
        if (
          [
            "pasajeros",
            "netoPrincipal",
            "vendutoTotal",
            "daPagare",
            "feeAgv",
          ].includes(key)
        ) {
          return;
        }

        if (key === "metodoPagamento" && Array.isArray(value)) {
          dataToSend.append(key, JSON.stringify(value));
          return;
        }

        if (typeof value === "string") {
          dataToSend.append(key, value);
          return;
        }

        if (typeof value === "number" || typeof value === "boolean") {
          dataToSend.append(key, String(value));
        }
      });

      // Agregar pasajeros como JSON
      dataToSend.append("pasajeros", JSON.stringify(formData.pasajeros));

      // Agregar archivo si existe
      if (selectedFile) {
        dataToSend.append("file", selectedFile);
      }

      // Agregar información de cuotas - REPLICANDO TOUR GRUPPO
      dataToSend.append(
        "numeroCuotas",
        (numeroCuotas > 0 ? numeroCuotas : 0).toString(),
      );

      // Agregar cuotas si existen
      if (numeroCuotas > 0 && cuotas.length > 0) {
        dataToSend.append(
          "cuotas",
          JSON.stringify(
            cuotas.map((c) => ({
              id: c.id, // Incluir ID si existe (para actualizar cuotas existentes)
              numeroCuota: c.numeroCuota,
              data: c.data,
              prezzo: c.prezzo,
              note: c.note,
              isPagato: c.isPagato || false, // Incluir estado de pago
              // Mantener archivo existente si no se subió uno nuevo
              attachedFile: c.file ? null : c.attachedFile || null,
              attachedFileName: c.file ? null : c.attachedFileName || null,
            })),
          ),
        );

        // Agregar archivos nuevos de cuotas
        cuotas.forEach((cuota, index) => {
          if (cuota.file) {
            dataToSend.append(`cuotaFile${index}`, cuota.file);
          }
        });
      }

      // Enviar al servidor
      const url = isEditMode
        ? `/api/biglietteria/${editingRecord?.id}`
        : "/api/biglietteria";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: dataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      const result = await response.json();

      // Actualizar lista de registros
      if (isEditMode) {
        // El API devuelve { record, message }
        const updatedRecord = result.record || result;
        // OPTIMIZACIÓN: Procesar registro antes de actualizar estado
        setRecords((prev) =>
          prev.map((r) =>
            r.id === updatedRecord.id ? processRecord(updatedRecord) : r,
          ),
        );
        setMessage({
          type: "success",
          text: "Registro actualizado correctamente",
        });

        // Cerrar modal automáticamente después de actualizar
        setTimeout(() => {
          handleCancelEdit();
        }, 500); // Pequeño delay para mostrar el mensaje de éxito
      } else {
        // OPTIMIZACIÓN: Procesar registro antes de agregar al estado
        setRecords((prev) => [processRecord(result), ...prev]);
        setMessage({ type: "success", text: "Registro creado correctamente" });

        // Limpiar formulario y cerrar modal
        handleCancelEdit();
      }
    } catch (error: unknown) {
      console.error("Error al guardar:", error);
      const message =
        error instanceof Error ? error.message : "Error al guardar el registro";
      setMessage({ type: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handler para cancelar edición
  const handleCancelEdit = () => {
    setEditingRecord(null);
    setIsEditMode(false);
    setFormData({
      cliente: "",
      codiceFiscale: "",
      indirizzo: "",
      email: "",
      numeroTelefono: "",
      pagamento: "",
      data: new Date().toISOString().split("T")[0],
      pnr: "",
      itinerario: "",
      metodoPagamento: [],
      notaDiVendita: "",
      notaDiRicevuta: "",
      numeroPasajeros: 1,
      pasajeros: [crearPasajeroVacio()],
      netoPrincipal: "",
      vendutoTotal: "",
      acconto: "",
      daPagare: "",
      feeAgv: "",
    });
    setSelectedFile(null);
    setNumeroCuotas(0); // Resetear número de cuotas
    setCuotas([]);
    cuotasInicializadas.current = false; // Resetear flag de inicialización
    setSelectedClientId("");
    setShowServiziDropdown(null);

    closeModal();
  };

  // Handler para editar registro
  const handleEditRecord = (record: BiglietteriaRecord) => {
    setEditingRecord(record);
    setIsEditMode(true);

    // Buscar el cliente por nombre
    const matchingClient = clients.find(
      (c) => `${c.firstName} ${c.lastName}` === record.cliente,
    );
    if (matchingClient) {
      setSelectedClientId(matchingClient.id);
    }

    // Mapear pasajeros desde el formato de la base de datos al formato del formulario
    const pasajerosMapeados = record.pasajeros?.map((pasajeroRaw) => {
      const pasajero = pasajeroRaw as PasajeroApi;

      let servicios: string[] = [];
      if (Array.isArray(pasajero.servicios)) {
        servicios = pasajero.servicios
          .map((servicio) =>
            typeof servicio === "string" ? servicio.trim() : String(servicio),
          )
          .filter((servicio): servicio is string => servicio.length > 0);
      } else {
        servicios = splitServicios(pasajero.servicios);
        if (servicios.length === 0) {
          servicios = splitServicios(pasajero.servizio);
        }
      }

      const mapIataFields = () => {
        const defaults = {
          iata: "",
          iataBiglietteria: "",
          iataExpress: "",
          iataPolizza: "",
          iataLetteraInvito: "",
          iataHotel: "",
        };

        const hydrate = (recordValue: Record<string, unknown>) => ({
          iata:
            typeof recordValue.biglietteria === "string"
              ? recordValue.biglietteria
              : "",
          iataBiglietteria:
            typeof recordValue.biglietteria === "string"
              ? recordValue.biglietteria
              : "",
          iataExpress:
            typeof recordValue.express === "string" ? recordValue.express : "",
          iataPolizza:
            typeof recordValue.polizza === "string" ? recordValue.polizza : "",
          iataLetteraInvito:
            typeof recordValue.letteraInvito === "string"
              ? recordValue.letteraInvito
              : "",
          iataHotel:
            typeof recordValue.hotel === "string" ? recordValue.hotel : "",
        });

        const iataValue = pasajero.iata;
        if (!iataValue) {
          return defaults;
        }

        if (typeof iataValue === "string") {
          try {
            const parsed = JSON.parse(iataValue) as Record<string, unknown>;
            if (parsed && typeof parsed === "object") {
              return hydrate(parsed);
            }
          } catch {
            return {
              iata: iataValue,
              iataBiglietteria: iataValue,
              iataExpress: "",
              iataPolizza: "",
              iataLetteraInvito: "",
              iataHotel: "",
            };
          }
        } else if (typeof iataValue === "object" && iataValue !== null) {
          return hydrate(iataValue as Record<string, unknown>);
        }

        return {
          iata: String(iataValue),
          iataBiglietteria: String(iataValue),
          iataExpress: "",
          iataPolizza: "",
          iataLetteraInvito: "",
          iataHotel: "",
        };
      };

      const serviciosDataFromNotas = (() => {
        const result: Record<
          string,
          {
            iata: string;
            neto: string;
            venduto: string;
            metodoDiAcquisto?: string;
          }
        > = {};
        if (!pasajero.notas) return result;

        try {
          const parsed = JSON.parse(pasajero.notas) as {
            serviciosDinamicos?: Record<
              string,
              {
                neto?: string | number;
                venduto?: string | number;
                metodoDiAcquisto?: string;
              }
            >;
          };
          const dinamicos = parsed.serviciosDinamicos;
          if (!dinamicos) return result;

          Object.entries(dinamicos).forEach(([key, value]) => {
            result[key.toUpperCase()] = {
              iata: "",
              neto: value?.neto !== undefined ? String(value.neto) : "",
              venduto:
                value?.venduto !== undefined ? String(value.venduto) : "",
              metodoDiAcquisto: value?.metodoDiAcquisto
                ? String(value.metodoDiAcquisto)
                : "",
            };
          });
        } catch {
          // Notas no está en formato JSON; ignorar
        }

        return result;
      })();

      const serviciosDataCombinados: Record<
        string,
        {
          iata: string;
          neto: string;
          venduto: string;
          metodoDiAcquisto?: string;
        }
      > = {
        ...serviciosDataFromNotas,
      };

      if (pasajero.serviciosData) {
        Object.entries(pasajero.serviciosData).forEach(([key, data]) => {
          const normalizedKey = normalizarServicio(key);
          serviciosDataCombinados[normalizedKey] = {
            iata: data.iata || "",
            neto: data.neto || "",
            venduto: data.venduto || "",
            metodoDiAcquisto: data.metodoDiAcquisto || "",
          };
        });
      }

      const serviciosDetalleNormalizados: PasajeroServicioDetalle[] = (
        Array.isArray(pasajero.serviciosDetalle)
          ? pasajero.serviciosDetalle
          : []
      ).map((detalle: PasajeroServicioDetalleApi) => ({
        id: detalle.id,
        servicio: typeof detalle.servicio === "string" ? detalle.servicio : "",
        metodoDiAcquisto: detalle.metodoDiAcquisto ?? "",
        iata: detalle.iata ?? "",
        andata: detalle.andata ? toISODateString(detalle.andata) : null,
        ritorno: detalle.ritorno ? toISODateString(detalle.ritorno) : null,
        neto: detalle.neto ?? null,
        venduto: detalle.venduto ?? null,
        estado: detalle.estado ?? "Pendiente",
        fechaPago: detalle.fechaPago
          ? toISODateString(detalle.fechaPago)
          : null,
        fechaActivacion: detalle.fechaActivacion
          ? toISODateString(detalle.fechaActivacion)
          : null,
        notas: detalle.notas ?? null,
      }));

      const iataFields = mapIataFields();
      let andataValue = pasajero.andata
        ? new Date(pasajero.andata).toISOString().split("T")[0]
        : "";
      let ritornoValue = pasajero.ritorno
        ? new Date(pasajero.ritorno).toISOString().split("T")[0]
        : "";
      let netoBiglietteria = pasajero.netoBiglietteria?.toString() || "";
      let vendutoBiglietteria = pasajero.vendutoBiglietteria?.toString() || "";
      let netoExpress = pasajero.netoExpress?.toString() || "";
      let vendutoExpress = pasajero.vendutoExpress?.toString() || "";
      let netoPolizza = pasajero.netoPolizza?.toString() || "";
      let vendutoPolizza = pasajero.vendutoPolizza?.toString() || "";
      let netoLetteraInvito = pasajero.netoLetteraInvito?.toString() || "";
      let vendutoLetteraInvito =
        pasajero.vendutoLetteraInvito?.toString() || "";
      let netoHotel = pasajero.netoHotel?.toString() || "";
      let vendutoHotel = pasajero.vendutoHotel?.toString() || "";
      let metodoAcquistoBiglietteria =
        pasajero.metodoAcquistoBiglietteria || "";
      let metodoAcquistoExpress = pasajero.metodoAcquistoExpress || "";
      let metodoAcquistoPolizza = pasajero.metodoAcquistoPolizza || "";
      let metodoAcquistoLetteraInvito =
        pasajero.metodoAcquistoLetteraInvito || "";
      let metodoAcquistoHotel = pasajero.metodoAcquistoHotel || "";

      serviciosDetalleNormalizados.forEach((detalle) => {
        const servicioKey = normalizarServicio(detalle.servicio);
        const netoString =
          detalle.neto !== null && detalle.neto !== undefined
            ? detalle.neto.toString()
            : "";
        const vendutoString =
          detalle.venduto !== null && detalle.venduto !== undefined
            ? detalle.venduto.toString()
            : "";
        const metodoString = detalle.metodoDiAcquisto ?? "";

        const applyDynamicData = () => {
          const existing = serviciosDataCombinados[servicioKey] || {
            iata: "",
            neto: "",
            venduto: "",
            metodoDiAcquisto: "",
          };
          serviciosDataCombinados[servicioKey] = {
            iata: detalle.iata ?? existing.iata ?? "",
            neto: netoString || existing.neto || "",
            venduto: vendutoString || existing.venduto || "",
            metodoDiAcquisto: metodoString || existing.metodoDiAcquisto || "",
          };
        };

        if (
          servicioKey.includes("VOLO") ||
          servicioKey.includes("BIGLIETTERIA")
        ) {
          if (detalle.andata) {
            andataValue = detalle.andata.split("T")[0];
          }
          if (detalle.ritorno) {
            ritornoValue = detalle.ritorno.split("T")[0];
          }
          if (detalle.iata) {
            iataFields.iata = detalle.iata;
            iataFields.iataBiglietteria = detalle.iata;
          }
          if (netoString) {
            netoBiglietteria = netoString;
          }
          if (vendutoString) {
            vendutoBiglietteria = vendutoString;
          }
          if (metodoString) {
            metodoAcquistoBiglietteria = metodoString;
          }
        } else if (servicioKey.includes("EXPRESS")) {
          if (detalle.iata) {
            iataFields.iataExpress = detalle.iata;
          }
          if (netoString) {
            netoExpress = netoString;
          }
          if (vendutoString) {
            vendutoExpress = vendutoString;
          }
          if (metodoString) {
            metodoAcquistoExpress = metodoString;
          }
        } else if (servicioKey.includes("POLIZZA")) {
          if (detalle.iata) {
            iataFields.iataPolizza = detalle.iata;
          }
          if (netoString) {
            netoPolizza = netoString;
          }
          if (vendutoString) {
            vendutoPolizza = vendutoString;
          }
          if (metodoString) {
            metodoAcquistoPolizza = metodoString;
          }
        } else if (
          servicioKey.includes("INVITO") ||
          servicioKey.includes("LETTERA")
        ) {
          if (detalle.iata) {
            iataFields.iataLetteraInvito = detalle.iata;
          }
          if (netoString) {
            netoLetteraInvito = netoString;
          }
          if (vendutoString) {
            vendutoLetteraInvito = vendutoString;
          }
          if (metodoString) {
            metodoAcquistoLetteraInvito = metodoString;
          }
        } else if (servicioKey.includes("HOTEL")) {
          if (detalle.iata) {
            iataFields.iataHotel = detalle.iata;
          }
          if (netoString) {
            netoHotel = netoString;
          }
          if (vendutoString) {
            vendutoHotel = vendutoString;
          }
          if (metodoString) {
            metodoAcquistoHotel = metodoString;
          }
        } else {
          applyDynamicData();
        }
      });

      const serviciosDataFinal: Record<
        string,
        {
          iata: string;
          neto: string;
          venduto: string;
          metodoDiAcquisto?: string;
        }
      > =
        Object.keys(serviciosDataCombinados).length > 0
          ? serviciosDataCombinados
          : {};

      const pasajeroResultado: PasajeroData = {
        id: pasajero.id,
        nombrePasajero: pasajero.nombrePasajero || "",
        servicios,
        andata: andataValue,
        ritorno: ritornoValue,
        ...iataFields,
        serviciosData: serviciosDataFinal,
        netoBiglietteria,
        vendutoBiglietteria,
        tieneExpress: pasajero.tieneExpress || false,
        netoExpress,
        vendutoExpress,
        tienePolizza: pasajero.tienePolizza || false,
        netoPolizza,
        vendutoPolizza,
        tieneLetteraInvito: pasajero.tieneLetteraInvito || false,
        netoLetteraInvito,
        vendutoLetteraInvito,
        tieneHotel: pasajero.tieneHotel || false,
        netoHotel,
        vendutoHotel,
        metodoAcquistoBiglietteria,
        metodoAcquistoExpress,
        metodoAcquistoPolizza,
        metodoAcquistoLetteraInvito,
        metodoAcquistoHotel,
        serviciosDetalle: serviciosDetalleNormalizados,
      };

      pasajeroResultado.serviciosDetalle = serviciosDetalleNormalizados;

      return pasajeroResultado;
    }) || [crearPasajeroVacio()];

    // Parsear metodoPagamento desde JSON o string
    const metodoPagamentoArray = normalizeMetodoPagamentoArray(
      record.metodoPagamento,
    );

    // Cargar datos del formulario
    setFormData({
      cliente: record.cliente,
      codiceFiscale: record.codiceFiscale,
      indirizzo: record.indirizzo,
      email: record.email,
      numeroTelefono: record.numeroTelefono,
      pagamento: record.pagamento,
      data: new Date(record.data).toISOString().split("T")[0],
      pnr: record.pnr || "",
      itinerario: record.itinerario,
      metodoPagamento: metodoPagamentoArray,
      notaDiVendita: record.notaDiVendita || "",
      notaDiRicevuta: record.notaDiRicevuta || "",
      numeroPasajeros: record.numeroPasajeros,
      pasajeros: pasajerosMapeados,
      netoPrincipal: record.netoPrincipal.toString(),
      vendutoTotal: record.vendutoTotal.toString(),
      acconto: record.acconto.toString(),
      daPagare: record.daPagare.toString(),
      feeAgv: record.feeAgv.toString(),
    });

    // Actualizar arrays de dropdowns
    setShowServiziDropdown(null);

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
          const cuotasFormato = record.cuotas.map((cuota) => ({
            id: cuota.id, // Mantener el ID de la cuota
            numeroCuota: cuota.numeroCuota,
            data: cuota.data
              ? new Date(cuota.data).toISOString().split("T")[0]
              : "",
            prezzo: cuota.prezzo.toString(),
            note: cuota.note || "",
            isPagato: Boolean(cuota.isPagato), // Asegurar conversión booleana explícita
            file: null, // Para archivos nuevos
            attachedFile: cuota.attachedFile || null, // Mantener archivo existente
            attachedFileName: cuota.attachedFileName || null, // Mantener nombre del archivo
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
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setDeletingRecordId(recordId);

    try {
      const response = await fetch(`/api/biglietteria/${recordId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      setRecords((prev) => prev.filter((r) => r.id !== recordId));
      setMessage({ type: "success", text: "Registro eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar:", error);
      setMessage({ type: "error", text: "Error al eliminar el registro" });
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
                <div
                  key={i}
                  className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  style={{
                    gridColumn:
                      i === 0 ? "span 2" : i === 11 ? "span 2" : "span 1",
                  }}
                ></div>
              ))}
            </div>
            {/* Filas skeleton */}
            {Array.from({ length: 8 }).map((_, rowIdx) => (
              <div
                key={rowIdx}
                className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-100 dark:border-white/[0.05] last:border-b-0"
              >
                {Array.from({ length: 12 }).map((_, colIdx) => (
                  <div
                    key={colIdx}
                    className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                    style={{
                      gridColumn:
                        colIdx === 0
                          ? "span 2"
                          : colIdx === 11
                            ? "span 2"
                            : "span 1",
                      animationDelay: `${rowIdx * 50}ms`,
                    }}
                  ></div>
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No tienes permisos para acceder a esta sección
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Biglietteria
        </h1>
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
            {(userRole === "TI" || userRole === "ADMIN") && (
              <button
                onClick={handleOpenPassengerDetails}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 hover:text-purple-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:hover:text-purple-300 rounded transition-colors duration-200"
                title="Ver detalles por pasajero y servicio"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Pagos/Express
              </button>
            )}
            {/* Botón Express - Solo visible para USER */}
            {userRole === "USER" && (
              <button
                onClick={() => setIsPassengerDetailsSimpleOpen(true)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 hover:text-indigo-800 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:hover:text-indigo-300 rounded transition-colors duration-200"
                title="Ver detalles simplificados de pasajeros"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Express
              </button>
            )}
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300 rounded transition-colors duration-200"
              title="Esporta tutti i biglietteria in Excel"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Excel
            </button>
            {/* Paginación selector */}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Mostra
            </span>
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

            {/* Filtro de mes y año */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Mese
              </span>
              <select
                value={mesSeleccionado}
                onChange={(e) => {
                  setMesSeleccionado(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-2 pl-3 pr-8 text-xs text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 w-[140px]"
              >
                <option value={0}>Gennaio</option>
                <option value={1}>Febbraio</option>
                <option value={2}>Marzo</option>
                <option value={3}>Aprile</option>
                <option value={4}>Maggio</option>
                <option value={5}>Giugno</option>
                <option value={6}>Luglio</option>
                <option value={7}>Agosto</option>
                <option value={8}>Settembre</option>
                <option value={9}>Ottobre</option>
                <option value={10}>Novembre</option>
                <option value={11}>Dicembre</option>
              </select>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Anno
              </span>
              <select
                value={añoSeleccionado}
                onChange={(e) => {
                  setAñoSeleccionado(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-2 pl-3 pr-8 text-xs text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 w-[100px]"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const año = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={año} value={año}>
                      {año}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filtro por Creador */}
            {canUseAgentFilter && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Agente
                </span>
                <div className="relative creador-dropdown-container">
                  <input
                    type="text"
                    value={creadorSearchTerm}
                    onChange={(e) => {
                      setCreadorSearchTerm(e.target.value);
                      setShowCreadorDropdown(true);
                      if (!e.target.value) {
                        setFiltroCreador("");
                        setCurrentPage(1);
                      }
                    }}
                    onFocus={() => setShowCreadorDropdown(true)}
                    placeholder="Tutti"
                    className="py-2 pl-3 pr-8 text-xs text-gray-800 bg-transparent border border-gray-300 rounded-lg dark:bg-dark-900 h-9 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 w-[140px]"
                  />
                  {/* Ícono de dropdown */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>

                  {/* Dropdown de usuarios */}
                  {showCreadorDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {/* Opción "Tutti" */}
                      <div
                        onClick={() => {
                          setFiltroCreador("");
                          setCreadorSearchTerm("");
                          setShowCreadorDropdown(false);
                          setCurrentPage(1);
                        }}
                        className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-xs text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700"
                      >
                        Tutti
                      </div>

                      {/* Lista de usuarios filtrados */}
                      {usuarios
                        .filter((usuario) => {
                          const nombreCompleto =
                            `${usuario.firstName} ${usuario.lastName}`
                              .trim()
                              .toLowerCase();
                          return nombreCompleto.includes(
                            creadorSearchTerm.toLowerCase(),
                          );
                        })
                        .map((usuario) => {
                          const nombreCompleto =
                            `${usuario.firstName} ${usuario.lastName}`.trim();
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
                              {nombreCompleto}
                            </div>
                          );
                        })}

                      {/* Mensaje cuando no hay resultados */}
                      {creadorSearchTerm &&
                        usuarios.filter((usuario) => {
                          const nombreCompleto =
                            `${usuario.firstName} ${usuario.lastName}`
                              .trim()
                              .toLowerCase();
                          return nombreCompleto.includes(
                            creadorSearchTerm.toLowerCase(),
                          );
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
                      setFiltroCreador("");
                      setCreadorSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    title="Cancella filtro"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Buscador y botón Nuovo */}
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
            {/* Buscador mejorado */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
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
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuovo
            </button>
          </div>
        </div>

        {/* Mensaje */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
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
                  SERVIZI
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
                  Pagato/Acconto
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
                  <td
                    colSpan={16}
                    className="px-5 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm
                      ? "Nessun record trovato con i criteri di ricerca"
                      : "Nessun record registrato"}
                  </td>
                </tr>
              ) : (
                currentData.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
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
                              const response = await fetch(
                                `/api/biglietteria/${record.id}`,
                                {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ pagamento: newValue }),
                                },
                              );

                              if (response.ok) {
                                // OPTIMIZACIÓN: Procesar registro actualizado
                                setRecords((prev) =>
                                  prev.map((r) =>
                                    r.id === record.id
                                      ? processRecord({
                                          ...r,
                                          pagamento: newValue,
                                        })
                                      : r,
                                  ),
                                );
                                setMessage({
                                  type: "success",
                                  text: "Pagamento aggiornato",
                                });
                                setTimeout(() => setMessage(null), 3000);
                              } else {
                                throw new Error("Error al actualizar");
                              }
                            } catch (error) {
                              console.error(
                                "Error actualizando pagamento",
                                error,
                              );
                              setMessage({
                                type: "error",
                                text: "Error al actualizar pagamento",
                              });
                              setTimeout(() => setMessage(null), 3000);
                            }
                          }}
                          className="w-full px-2 py-1 text-xs border border-brand-500 rounded focus:ring-2 focus:ring-brand-500 focus:outline-none dark:bg-gray-800 dark:border-brand-400 dark:text-white"
                        >
                          {getAvailablePagamentos.map((pag) => (
                            <option key={pag} value={pag}>
                              {pag}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => {
                            // Si es USER y el valor actual no es Acconto ni Ricevuto, no permitir edición
                            if (
                              isUser &&
                              record.pagamento !== "Acconto" &&
                              record.pagamento !== "Ricevuto"
                            ) {
                              setMessage({
                                type: "error",
                                text: "No tienes permisos para editar este valor de pagamento",
                              });
                              setTimeout(() => setMessage(null), 3000);
                              return;
                            }
                            setEditingPagamentoId(record.id);
                          }}
                          className={`text-xs truncate px-2 py-1 rounded text-center font-medium ${
                            record.pagamento === "Acconto"
                              ? "bg-gray-500 text-white"
                              : record.pagamento === "Acconto V"
                                ? "bg-purple-400 text-white"
                                : record.pagamento === "Ricevuto"
                                  ? "bg-green-500 text-white"
                                  : record.pagamento === "Verificato"
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          } ${
                            // Si es USER y el valor no es editable, mostrar cursor no permitido
                            isUser &&
                            record.pagamento !== "Acconto" &&
                            record.pagamento !== "Ricevuto"
                              ? "cursor-not-allowed opacity-75"
                              : "cursor-pointer"
                          }`}
                          title={
                            isUser &&
                            record.pagamento !== "Acconto" &&
                            record.pagamento !== "Ricevuto"
                              ? "No tienes permisos para editar este valor"
                              : "Clic para editar"
                          }
                        >
                          {record.pagamento}
                        </div>
                      )}
                    </td>
                    <td className="w-[100px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 truncate">
                      {new Date(record.data).toLocaleDateString("it-IT")}
                    </td>
                    <td className="w-[100px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 font-mono truncate">
                      {record.pnr || "-"}
                    </td>
                    <td className="w-[150px] px-3 py-2 text-gray-600 text-start text-[10px] dark:text-gray-300">
                      {(() => {
                        // Extraer todos los servicios únicos de todos los pasajeros
                        const serviciosSet = new Set<string>();
                        if (
                          record.pasajeros &&
                          Array.isArray(record.pasajeros)
                        ) {
                          record.pasajeros.forEach((pasajero: PasajeroApi) => {
                            if (
                              pasajero.servicios &&
                              Array.isArray(pasajero.servicios)
                            ) {
                              pasajero.servicios.forEach((servicio: string) => {
                                serviciosSet.add(servicio.trim());
                              });
                            } else if (typeof pasajero.servizio === "string") {
                              // Compatibilidad con formato antiguo
                              const servicios = pasajero.servizio
                                .split(",")
                                .map((s) => s.trim());
                              servicios.forEach((servicio: string) => {
                                serviciosSet.add(servicio);
                              });
                            }
                          });
                        }
                        const serviciosArray = Array.from(serviciosSet);
                        const isExpanded = expandedServiciosRows.has(record.id);

                        const toggleExpand = () => {
                          setExpandedServiciosRows((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(record.id)) {
                              newSet.delete(record.id);
                            } else {
                              newSet.add(record.id);
                            }
                            return newSet;
                          });
                        };

                        if (serviciosArray.length === 0) {
                          return <span className="text-gray-400">-</span>;
                        }

                        // Si hay un solo servicio, mostrarlo directamente sin colapsar
                        if (serviciosArray.length === 1) {
                          return (
                            <span className="inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-[10px]">
                              {serviciosArray[0].length > 20
                                ? `${serviciosArray[0].substring(0, 20)}...`
                                : serviciosArray[0]}
                            </span>
                          );
                        }

                        // Si hay múltiples servicios, mostrar colapsable
                        return (
                          <span className="inline-flex items-center gap-1.5 flex-nowrap">
                            {isExpanded ? (
                              <>
                                {serviciosArray.map((servicio, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-[10px] whitespace-nowrap"
                                    title={servicio}
                                  >
                                    {servicio.length > 10
                                      ? `${servicio.substring(0, 10)}...`
                                      : servicio}
                                  </span>
                                ))}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand();
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:underline text-[10px] whitespace-nowrap"
                                >
                                  Menos
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-[10px] whitespace-nowrap">
                                  {serviciosArray[0].length > 10
                                    ? `${serviciosArray[0].substring(0, 10)}...`
                                    : serviciosArray[0]}
                                  {serviciosArray.length > 1 &&
                                    ` +${serviciosArray.length - 1}`}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand();
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:underline text-[10px] whitespace-nowrap"
                                  title={`Mostrar todos los ${serviciosArray.length} servicios`}
                                >
                                  Ver más
                                </button>
                              </>
                            )}
                          </span>
                        );
                      })()}
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
                          const parsed =
                            typeof record.metodoPagamento === "string"
                              ? JSON.parse(record.metodoPagamento)
                              : record.metodoPagamento;
                          return Array.isArray(parsed)
                            ? parsed.join(", ")
                            : record.metodoPagamento;
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
                            ? "bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                        }`}
                        title={
                          countFiles(record) > 0
                            ? `Ver ${countFiles(record)} archivo(s)`
                            : "Sin archivos"
                        }
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        {countFiles(record) > 0 && (
                          <span className="text-xs font-semibold">
                            {countFiles(record)}
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Columna Creato da */}
                    <td className="w-[100px] px-3 py-2 text-gray-600 text-start text-xs dark:text-gray-300 truncate">
                      {record.creator?.firstName
                        ? `${record.creator.firstName}${record.creator.lastName ? ` ${record.creator.lastName}` : ""}`.trim()
                        : record.creator?.email || "N/A"}
                    </td>

                    <td className="w-[140px] px-3 py-2 text-start sticky right-0 bg-white dark:bg-gray-900 z-10 border-l border-gray-200 dark:border-gray-700 shadow-lg">
                      <div className="flex items-center gap-1">
                        {/* Botón Ver Detalles */}
                        <button
                          onClick={() => handleViewDetails(record)}
                          className="p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 hover:text-purple-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:hover:text-purple-300 rounded transition-all duration-200 transform hover:scale-105"
                          title="Ver detalles completos"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>

                        {/* Botón Editar */}
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300 rounded transition-all duration-200 transform hover:scale-105"
                          title="Modifica"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        {/* Botón Recibo */}
                        <button
                          onClick={() => handleGenerateRicevuta(record.id)}
                          className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300 rounded transition-all duration-200 transform hover:scale-105"
                          title="Ricevuta"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          disabled={deletingRecordId === record.id}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 rounded transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Elimina"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
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
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-right font-semibold text-blue-800 dark:text-blue-200 text-sm"
                  >
                    TOTAL:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 dark:text-blue-200">
                    €{totales.totalNeto.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 dark:text-blue-200">
                    €{totales.totalVenduto.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 dark:text-blue-200">
                    €{totales.totalAcconto.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 dark:text-blue-200">
                    €{totales.totalDaPagare.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    -
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800 dark:text-blue-200">
                    €{totales.totalFeeAgv.toFixed(2)}
                  </td>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300"
                  >
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
                          ? "bg-brand-500 text-white"
                          : "border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
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
      {isMounted &&
        isModalOpen &&
        createPortal(
          <Modal
            isOpen={isModalOpen}
            onClose={handleCancelEdit}
            className="p-6 md:p-8"
          >
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Editar Registro" : "Nuevo Registro"}
              </h2>
            </div>
            <form
              onSubmit={handleSubmit}
              className="space-y-6 max-h-[80vh] overflow-y-auto"
            >
              {/* Sección: Información del Cliente */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Información del Cliente
                </h3>

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
                          setFormData((prev) => ({
                            ...prev,
                            cliente: e.target.value,
                          }));
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        placeholder="Seleziona un cliente o cerca per nome..."
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        required
                      />
                      {/* Ícono de búsqueda */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>

                    {showClientDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredClients.length > 0 ? (
                          filteredClients.map((client) => (
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
                            {clients && clients.length > 0
                              ? "No se encontraron clientes"
                              : "Cargando clientes..."}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mensaje cuando no hay resultados */}
                    {showClientDropdown &&
                      clientSearchTerm &&
                      filteredClients.length === 0 && (
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          codiceFiscale: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          indirizzo: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          numeroTelefono: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                      readOnly={!!selectedClientId}
                    />
                  </div>
                </div>
              </div>

              {/* Sección: Información del Viaje */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Información del Viaje
                </h3>

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
                          setFormData((prev) => ({
                            ...prev,
                            pagamento: e.target.value,
                          }));
                        }}
                        onFocus={() => setShowPagamentoDropdown(true)}
                        placeholder="Seleziona un pagamento o cerca per nome..."
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        required
                      />
                      {/* Ícono de búsqueda */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>

                    {showPagamentoDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredPagamentos.length > 0 ? (
                          filteredPagamentos.map((pagamento) => (
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
                            {pagamentos && pagamentos.length > 0
                              ? "No se encontraron pagamentos"
                              : "Cargando pagamentos..."}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mensaje cuando no hay resultados */}
                    {showPagamentoDropdown &&
                      pagamentoSearchTerm &&
                      filteredPagamentos.length === 0 && (
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          data: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pnr: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          itinerario: e.target.value,
                        }))
                      }
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pasajeros
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Número de pasajeros:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.numeroPasajeros}
                      onChange={(e) =>
                        handleNumeroPasajerosChange(
                          parseInt(e.target.value) || 1,
                        )
                      }
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
                      <div
                        key={index}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800"
                      >
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
                              onChange={(e) =>
                                handlePasajeroChange(
                                  index,
                                  "nombrePasajero",
                                  e.target.value,
                                )
                              }
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
                              <div
                                className="min-h-[40px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex flex-wrap gap-1 items-center cursor-text"
                                onClick={() => setShowServiziDropdown(index)}
                              >
                                {/* Chips de servicios seleccionados */}
                                {pasajero.servicios.map((servicio) => (
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
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
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
                                    .filter(
                                      (servicio) =>
                                        !pasajero.servicios.includes(servicio),
                                    )
                                    .map((servizio) => (
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
                              <p className="text-xs text-red-500 mt-1">
                                Debe seleccionar al menos un servicio
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Fechas (solo si tiene Volo) */}
                        {fieldsToShow.showDateFields && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Andata
                              </label>
                              <input
                                type="date"
                                value={pasajero.andata}
                                onChange={(e) =>
                                  handlePasajeroChange(
                                    index,
                                    "andata",
                                    e.target.value,
                                  )
                                }
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
                                onChange={(e) =>
                                  handlePasajeroChange(
                                    index,
                                    "ritorno",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                        )}

                        {/* Campos de Volo */}
                        {fieldsToShow.showBiglietteriaFields && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                            <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                              Costos Volo
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  IATA *
                                </label>
                                <div className="relative iata-dropdown-container">
                                  <input
                                    type="text"
                                    value={pasajero.iataBiglietteria}
                                    onChange={(e) => {
                                      handlePasajeroChange(
                                        index,
                                        "iataBiglietteria",
                                        e.target.value,
                                      );
                                      setIndividualIataSearchTerm(
                                        index,
                                        "Volo",
                                        e.target.value,
                                      );
                                      setIndividualIataDropdown(
                                        index,
                                        "Volo",
                                        true,
                                      );
                                    }}
                                    onFocus={() =>
                                      setIndividualIataDropdown(
                                        index,
                                        "Volo",
                                        true,
                                      )
                                    }
                                    placeholder="Buscar IATA"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    required
                                  />

                                  {/* Dropdown de IATA */}
                                  {isIndividualIataDropdownOpen(
                                    index,
                                    "Volo",
                                  ) &&
                                    getFilteredIndividualIata(index, "Volo")
                                      .length > 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {getFilteredIndividualIata(
                                          index,
                                          "Volo",
                                        ).map((iata, idx) => (
                                          <div
                                            key={`pasajero-${index}-iata-volo-${idx}`}
                                            onClick={() =>
                                              handleIndividualIataSelect(
                                                index,
                                                "Volo",
                                                iata,
                                              )
                                            }
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
                                  {isIndividualIataDropdownOpen(
                                    index,
                                    "Volo",
                                  ) &&
                                    getFilteredIndividualIata(index, "Volo")
                                      .length === 0 && (
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
                                  onChange={(e) =>
                                    handlePasajeroChange(
                                      index,
                                      "netoBiglietteria",
                                      e.target.value,
                                    )
                                  }
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
                                  onChange={(e) =>
                                    handlePasajeroChange(
                                      index,
                                      "vendutoBiglietteria",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Metodo di acquisto
                                </label>
                                <select
                                  value={pasajero.metodoAcquistoBiglietteria}
                                  onChange={(e) =>
                                    handlePasajeroChange(
                                      index,
                                      "metodoAcquistoBiglietteria",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  <option value="">Seleziona...</option>
                                  {acquistoOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      IATA *
                                    </label>
                                    <div className="relative iata-dropdown-container">
                                      <input
                                        type="text"
                                        value={pasajero.iataExpress}
                                        onChange={(e) => {
                                          handlePasajeroChange(
                                            index,
                                            "iataExpress",
                                            e.target.value,
                                          );
                                          setIndividualIataSearchTerm(
                                            index,
                                            "EXPRESS",
                                            e.target.value,
                                          );
                                          setIndividualIataDropdown(
                                            index,
                                            "EXPRESS",
                                            true,
                                          );
                                        }}
                                        onFocus={() =>
                                          setIndividualIataDropdown(
                                            index,
                                            "EXPRESS",
                                            true,
                                          )
                                        }
                                        placeholder="Buscar IATA"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        required
                                      />

                                      {/* Dropdown de IATA */}
                                      {isIndividualIataDropdownOpen(
                                        index,
                                        "EXPRESS",
                                      ) &&
                                        getFilteredIndividualIata(
                                          index,
                                          "EXPRESS",
                                        ).length > 0 && (
                                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {getFilteredIndividualIata(
                                              index,
                                              "EXPRESS",
                                            ).map((iata, idx) => (
                                              <div
                                                key={idx}
                                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                onClick={() =>
                                                  handleIndividualIataSelect(
                                                    index,
                                                    "EXPRESS",
                                                    iata,
                                                  )
                                                }
                                              >
                                                {iata}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                      {isIndividualIataDropdownOpen(
                                        index,
                                        "EXPRESS",
                                      ) &&
                                        getFilteredIndividualIata(
                                          index,
                                          "EXPRESS",
                                        ).length === 0 && (
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
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "netoExpress",
                                          e.target.value,
                                        )
                                      }
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
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "vendutoExpress",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Metodo di acquisto
                                    </label>
                                    <select
                                      value={pasajero.metodoAcquistoExpress}
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "metodoAcquistoExpress",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                      <option value="">Seleziona...</option>
                                      {acquistoOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      IATA *
                                    </label>
                                    <div className="relative iata-dropdown-container">
                                      <input
                                        type="text"
                                        value={pasajero.iataPolizza}
                                        onChange={(e) => {
                                          handlePasajeroChange(
                                            index,
                                            "iataPolizza",
                                            e.target.value,
                                          );
                                          setIndividualIataSearchTerm(
                                            index,
                                            "POLIZZA",
                                            e.target.value,
                                          );
                                          setIndividualIataDropdown(
                                            index,
                                            "POLIZZA",
                                            true,
                                          );
                                        }}
                                        onFocus={() =>
                                          setIndividualIataDropdown(
                                            index,
                                            "POLIZZA",
                                            true,
                                          )
                                        }
                                        placeholder="Buscar IATA"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        required
                                      />

                                      {/* Dropdown de IATA */}
                                      {isIndividualIataDropdownOpen(
                                        index,
                                        "POLIZZA",
                                      ) &&
                                        getFilteredIndividualIata(
                                          index,
                                          "POLIZZA",
                                        ).length > 0 && (
                                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {getFilteredIndividualIata(
                                              index,
                                              "POLIZZA",
                                            ).map((iata, idx) => (
                                              <div
                                                key={idx}
                                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                onClick={() =>
                                                  handleIndividualIataSelect(
                                                    index,
                                                    "POLIZZA",
                                                    iata,
                                                  )
                                                }
                                              >
                                                {iata}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                      {isIndividualIataDropdownOpen(
                                        index,
                                        "POLIZZA",
                                      ) &&
                                        getFilteredIndividualIata(
                                          index,
                                          "POLIZZA",
                                        ).length === 0 && (
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
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "netoPolizza",
                                          e.target.value,
                                        )
                                      }
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
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "vendutoPolizza",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Metodo di acquisto
                                    </label>
                                    <select
                                      value={pasajero.metodoAcquistoPolizza}
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "metodoAcquistoPolizza",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                      <option value="">Seleziona...</option>
                                      {acquistoOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* L.invito */}
                            {pasajero.tieneLetteraInvito && (
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                <h6 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                                  L.invito
                                </h6>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      IATA *
                                    </label>
                                    <div className="relative iata-dropdown-container">
                                      <input
                                        type="text"
                                        value={pasajero.iataLetteraInvito}
                                        onChange={(e) => {
                                          handlePasajeroChange(
                                            index,
                                            "iataLetteraInvito",
                                            e.target.value,
                                          );
                                          setIndividualIataSearchTerm(
                                            index,
                                            "L.INVITO",
                                            e.target.value,
                                          );
                                          setIndividualIataDropdown(
                                            index,
                                            "L.INVITO",
                                            true,
                                          );
                                        }}
                                        onFocus={() =>
                                          setIndividualIataDropdown(
                                            index,
                                            "L.INVITO",
                                            true,
                                          )
                                        }
                                        placeholder="Buscar IATA"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        required
                                      />

                                      {/* Dropdown de IATA */}
                                      {isIndividualIataDropdownOpen(
                                        index,
                                        "L.INVITO",
                                      ) &&
                                        getFilteredIndividualIata(
                                          index,
                                          "L.INVITO",
                                        ).length > 0 && (
                                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {getFilteredIndividualIata(
                                              index,
                                              "L.INVITO",
                                            ).map((iata, idx) => (
                                              <div
                                                key={idx}
                                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                onClick={() =>
                                                  handleIndividualIataSelect(
                                                    index,
                                                    "L.INVITO",
                                                    iata,
                                                  )
                                                }
                                              >
                                                {iata}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                      {isIndividualIataDropdownOpen(
                                        index,
                                        "L.INVITO",
                                      ) &&
                                        getFilteredIndividualIata(
                                          index,
                                          "L.INVITO",
                                        ).length === 0 && (
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
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "netoLetteraInvito",
                                          e.target.value,
                                        )
                                      }
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
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "vendutoLetteraInvito",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Metodo di acquisto
                                    </label>
                                    <select
                                      value={
                                        pasajero.metodoAcquistoLetteraInvito
                                      }
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "metodoAcquistoLetteraInvito",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300.dark:border-gray-600 rounded-lg bg-white.dark:bg-gray-800 text-gray-900.dark:text-white"
                                    >
                                      <option value="">Seleziona...</option>
                                      {acquistoOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      IATA *
                                    </label>
                                    <div className="relative iata-dropdown-container">
                                      <input
                                        type="text"
                                        value={pasajero.iataHotel}
                                        onChange={(e) => {
                                          handlePasajeroChange(
                                            index,
                                            "iataHotel",
                                            e.target.value,
                                          );
                                          setIndividualIataSearchTerm(
                                            index,
                                            "HOTEL",
                                            e.target.value,
                                          );
                                          setIndividualIataDropdown(
                                            index,
                                            "HOTEL",
                                            true,
                                          );
                                        }}
                                        onFocus={() =>
                                          setIndividualIataDropdown(
                                            index,
                                            "HOTEL",
                                            true,
                                          )
                                        }
                                        placeholder="Buscar IATA"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        required
                                      />

                                      {/* Dropdown de IATA */}
                                      {isIndividualIataDropdownOpen(
                                        index,
                                        "HOTEL",
                                      ) &&
                                        getFilteredIndividualIata(
                                          index,
                                          "HOTEL",
                                        ).length > 0 && (
                                          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {getFilteredIndividualIata(
                                              index,
                                              "HOTEL",
                                            ).map((iata, idx) => (
                                              <div
                                                key={idx}
                                                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                onClick={() =>
                                                  handleIndividualIataSelect(
                                                    index,
                                                    "HOTEL",
                                                    iata,
                                                  )
                                                }
                                              >
                                                {iata}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                      {isIndividualIataDropdownOpen(
                                        index,
                                        "HOTEL",
                                      ) &&
                                        getFilteredIndividualIata(
                                          index,
                                          "HOTEL",
                                        ).length === 0 && (
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
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "netoHotel",
                                          e.target.value,
                                        )
                                      }
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
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "vendutoHotel",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                      Metodo di acquisto
                                    </label>
                                    <select
                                      value={pasajero.metodoAcquistoHotel}
                                      onChange={(e) =>
                                        handlePasajeroChange(
                                          index,
                                          "metodoAcquistoHotel",
                                          e.target.value,
                                        )
                                      }
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                      <option value="">Seleziona...</option>
                                      {acquistoOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Servicios Dinámicos - Para todos los servicios que no están en la lista de conocidos */}
                            {obtenerServiciosDinamicos(pasajero.servicios).map(
                              (servicio) => {
                                // Normalizar el nombre del servicio para usar como clave
                                const servicioKey =
                                  normalizarServicio(servicio);
                                const servicioData = pasajero.serviciosData?.[
                                  servicioKey
                                ] || {
                                  iata: "",
                                  neto: "",
                                  venduto: "",
                                  metodoDiAcquisto: "",
                                };

                                // Colores diferentes para cada servicio (usando hash simple)
                                const colores = [
                                  {
                                    bg: "bg-cyan-50",
                                    dark: "dark:bg-cyan-900/20",
                                    text: "text-cyan-900",
                                    darkText: "dark:text-cyan-300",
                                  },
                                  {
                                    bg: "bg-pink-50",
                                    dark: "dark:bg-pink-900/20",
                                    text: "text-pink-900",
                                    darkText: "dark:text-pink-300",
                                  },
                                  {
                                    bg: "bg-orange-50",
                                    dark: "dark:bg-orange-900/20",
                                    text: "text-orange-900",
                                    darkText: "dark:text-orange-300",
                                  },
                                  {
                                    bg: "bg-teal-50",
                                    dark: "dark:bg-teal-900/20",
                                    text: "text-teal-900",
                                    darkText: "dark:text-teal-300",
                                  },
                                  {
                                    bg: "bg-amber-50",
                                    dark: "dark:bg-amber-900/20",
                                    text: "text-amber-900",
                                    darkText: "dark:text-amber-300",
                                  },
                                ];
                                const colorIndex =
                                  servicioKey.length % colores.length;
                                const color = colores[colorIndex];

                                return (
                                  <div
                                    key={servicioKey}
                                    className={`${color.bg} ${color.dark} p-3 rounded-lg`}
                                  >
                                    <h6
                                      className={`text-sm font-semibold ${color.text} ${color.darkText} mb-2`}
                                    >
                                      {servicio}
                                    </h6>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          IATA *
                                        </label>
                                        <div className="relative iata-dropdown-container">
                                          <input
                                            type="text"
                                            value={servicioData.iata}
                                            onChange={(e) => {
                                              const newData = {
                                                ...servicioData,
                                                iata: e.target.value,
                                              };
                                              const updatedData = {
                                                ...(pasajero.serviciosData ||
                                                  {}),
                                                [servicioKey]: newData,
                                              };
                                              handlePasajeroChange(
                                                index,
                                                "serviciosData",
                                                updatedData,
                                              );
                                              setIndividualIataSearchTerm(
                                                index,
                                                servicioKey,
                                                e.target.value,
                                              );
                                              setIndividualIataDropdown(
                                                index,
                                                servicioKey,
                                                true,
                                              );
                                            }}
                                            onFocus={() =>
                                              setIndividualIataDropdown(
                                                index,
                                                servicioKey,
                                                true,
                                              )
                                            }
                                            placeholder="Buscar IATA"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                            required
                                          />

                                          {/* Dropdown de IATA */}
                                          {isIndividualIataDropdownOpen(
                                            index,
                                            servicioKey,
                                          ) &&
                                            getFilteredIndividualIata(
                                              index,
                                              servicioKey,
                                            ).length > 0 && (
                                              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {getFilteredIndividualIata(
                                                  index,
                                                  servicioKey,
                                                ).map((iata, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-900 dark:text-white"
                                                    onClick={() => {
                                                      const newData = {
                                                        ...servicioData,
                                                        iata: iata,
                                                      };
                                                      const updatedData = {
                                                        ...(pasajero.serviciosData ||
                                                          {}),
                                                        [servicioKey]: newData,
                                                      };
                                                      handlePasajeroChange(
                                                        index,
                                                        "serviciosData",
                                                        updatedData,
                                                      );
                                                      handleIndividualIataSelect(
                                                        index,
                                                        servicioKey,
                                                        iata,
                                                      );
                                                    }}
                                                  >
                                                    {iata}
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                          {isIndividualIataDropdownOpen(
                                            index,
                                            servicioKey,
                                          ) &&
                                            getFilteredIndividualIata(
                                              index,
                                              servicioKey,
                                            ).length === 0 && (
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
                                            const newData = {
                                              ...servicioData,
                                              neto: e.target.value,
                                            };
                                            const updatedData = {
                                              ...(pasajero.serviciosData || {}),
                                              [servicioKey]: newData,
                                            };
                                            handlePasajeroChange(
                                              index,
                                              "serviciosData",
                                              updatedData,
                                            );
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
                                            const newData = {
                                              ...servicioData,
                                              venduto: e.target.value,
                                            };
                                            const updatedData = {
                                              ...(pasajero.serviciosData || {}),
                                              [servicioKey]: newData,
                                            };
                                            handlePasajeroChange(
                                              index,
                                              "serviciosData",
                                              updatedData,
                                            );
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Metodo di acquisto
                                        </label>
                                        <select
                                          value={
                                            servicioData.metodoDiAcquisto || ""
                                          }
                                          onChange={(e) => {
                                            const newData = {
                                              ...servicioData,
                                              metodoDiAcquisto: e.target.value,
                                            };
                                            const updatedData = {
                                              ...(pasajero.serviciosData || {}),
                                              [servicioKey]: newData,
                                            };
                                            handlePasajeroChange(
                                              index,
                                              "serviciosData",
                                              updatedData,
                                            );
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                          <option value="">Seleziona...</option>
                                          {acquistoOptions.map((option) => (
                                            <option
                                              key={`${servicioKey}-${option}`}
                                              value={option}
                                            >
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección: Totales Calculados */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Totales
                </h3>

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
                      Pagato/Acconto (calculado)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.acconto}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          acconto: e.target.value,
                        }))
                      }
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
                      <div
                        className="min-h-[40px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex flex-wrap gap-1 items-center cursor-text"
                        onClick={() => setShowMetodoPagamentoDropdown(true)}
                      >
                        {/* Chips de métodos seleccionados */}
                        {formData.metodoPagamento.map((metodo) => (
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
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
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
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>

                    {showMetodoPagamentoDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredMetodoPagamento
                          .filter(
                            (metodo) =>
                              !formData.metodoPagamento.includes(metodo),
                          )
                          .map((metodo) => (
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
                        {filteredMetodoPagamento.filter(
                          (metodo) =>
                            !formData.metodoPagamento.includes(metodo),
                        ).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            Nessun metodo disponibile
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mensaje de error */}
                    {formData.metodoPagamento.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        Debe seleccionar al menos un método de pago
                      </p>
                    )}
                  </div>

                  {/* Campos de Notas - lado a lado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Campo Nota di vendita */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        nota interna di vendita
                      </label>
                      <textarea
                        value={formData.notaDiVendita}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notaDiVendita: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        rows={3}
                        placeholder="Nota interna della vendita..."
                      />
                    </div>

                    {/* Campo Note di ricevuta */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Note di ricevuta
                      </label>
                      <SimpleRichTextEditor
                        value={formData.notaDiRicevuta || ""}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            notaDiRicevuta: value,
                          }))
                        }
                        placeholder="Note di ricevuta..."
                        rows={3}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección: Archivo Adjunto */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Archivo Adjunto (opcional)
                </h3>

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
                      onChange={(e) =>
                        setNumeroCuotas(parseInt(e.target.value))
                      }
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
                        return (
                          <div className="text-gray-500 text-center py-4">
                            No hay cuotas registradas
                          </div>
                        );
                      }
                      return cuotas.map((cuota, index) => (
                        <div
                          key={index}
                          className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              Cuota {cuota.numeroCuota}
                            </h4>
                            <button
                              type="button"
                              onClick={() =>
                                setCuotas((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                            <div className="flex flex-col justify-end">
                              <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input
                                  type="checkbox"
                                  checked={!!cuota.isPagato}
                                  onChange={(e) => {
                                    const newCuotas = [...cuotas];
                                    newCuotas[index].isPagato =
                                      e.target.checked;
                                    setCuotas(newCuotas);
                                  }}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Pagado
                                </span>
                              </label>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Archivo de la cuota (opcional)
                              </label>
                              <input
                                type="file"
                                onChange={(e) => {
                                  const newCuotas = [...cuotas];
                                  newCuotas[index].file =
                                    e.target.files?.[0] || null;
                                  setCuotas(newCuotas);
                                }}
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
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
                  {submitting
                    ? isEditMode
                      ? "Actualizando..."
                      : "Guardando..."
                    : isEditMode
                      ? "Actualizar"
                      : "Guardar"}
                </button>
              </div>
            </form>
          </Modal>,
          document.body,
        )}

      {/* Modal de Visualización de Archivos */}
      {isMounted &&
        isFileViewerOpen &&
        viewingFiles &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] z-[9999999998]"
              onClick={handleCloseFileViewer}
            ></div>
            <div className="fixed inset-0 flex items-center justify-center z-[9999999999] p-4">
              <div
                className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Comprobantes de Pago
                  </h2>
                  <button
                    onClick={handleCloseFileViewer}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Archivo Principal */}
                  {viewingFiles.attachedFile && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Archivo Principal
                      </p>
                      {(() => {
                        // Usar el nombre del archivo para detectar el tipo
                        const fileName =
                          viewingFiles.attachedFileName ||
                          viewingFiles.attachedFile;

                        if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                          return (
                            <img
                              src={viewingFiles.attachedFile}
                              alt="Archivo principal"
                              className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() =>
                                handleDownload(
                                  viewingFiles.attachedFile!,
                                  viewingFiles.attachedFileName ||
                                    "archivo_principal.jpg",
                                )
                              }
                            />
                          );
                        } else {
                          return (
                            <button
                              onClick={() =>
                                handleDownload(
                                  viewingFiles.attachedFile!,
                                  viewingFiles.attachedFileName || "documento",
                                )
                              }
                              className="block w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                            >
                              <p className="text-sm text-gray-900 dark:text-white">
                                {viewingFiles.attachedFileName}
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                Clic para descargar
                              </p>
                            </button>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {/* Archivos de Cuotas */}
                  {viewingFiles.cuotas &&
                    viewingFiles.cuotas
                      .filter((c) => c.attachedFile)
                      .map((cuota) => (
                        <div key={cuota.id}>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cuota {cuota.numeroCuota}
                          </p>
                          {(() => {
                            // Usar el nombre del archivo para detectar el tipo
                            const fileName =
                              cuota.attachedFileName || cuota.attachedFile!;

                            if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                              return (
                                <img
                                  src={cuota.attachedFile!}
                                  alt={`Cuota ${cuota.numeroCuota}`}
                                  className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() =>
                                    handleDownload(
                                      cuota.attachedFile!,
                                      cuota.attachedFileName ||
                                        `cuota_${cuota.numeroCuota}.jpg`,
                                    )
                                  }
                                />
                              );
                            } else {
                              return (
                                <button
                                  onClick={() =>
                                    handleDownload(
                                      cuota.attachedFile!,
                                      cuota.attachedFileName ||
                                        `cuota_${cuota.numeroCuota}`,
                                    )
                                  }
                                  className="block w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                >
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {cuota.attachedFileName}
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Clic para descargar
                                  </p>
                                </button>
                              );
                            }
                          })()}
                        </div>
                      ))}

                  {/* Sin archivos */}
                  {!viewingFiles.attachedFile &&
                    (!viewingFiles.cuotas ||
                      viewingFiles.cuotas.filter((c) => c.attachedFile)
                        .length === 0) && (
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">
                          No hay archivos adjuntos
                        </p>
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
          document.body,
        )}

      {/* Modal de detalles completos */}
      {isDetailsModalOpen &&
        viewingDetails &&
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999999] p-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Detalles del Registro
                  </h2>
                  <button
                    onClick={handleCloseDetailsModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Información general */}
                <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Información general
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Cliente
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {viewingDetails.cliente || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">PNR</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {viewingDetails.pnr || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Itinerario
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {viewingDetails.itinerario || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Fecha registro
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatDateDisplay(viewingDetails.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Última actualización
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatDateDisplay(viewingDetails.updatedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Agente
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {(() => {
                          if (viewingDetails.creator) {
                            const fullName =
                              `${viewingDetails.creator.firstName || ""} ${viewingDetails.creator.lastName || ""}`.trim();
                            return (
                              fullName || viewingDetails.creator.email || "-"
                            );
                          }
                          return viewingDetails.creadoPor || "-";
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Estado general (Pagamento)
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {viewingDetails.pagamento || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Método(s) de pago
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {(() => {
                          const methods =
                            viewingDetails.metodoPagamentoParsed &&
                            viewingDetails.metodoPagamentoParsed.length > 0
                              ? viewingDetails.metodoPagamentoParsed
                              : viewingDetails.metodoPagamento || [];
                          if (Array.isArray(methods)) {
                            const values = methods
                              .map((m) =>
                                typeof m === "string" ? m : String(m),
                              )
                              .filter((m) => m.trim().length > 0);
                            return values.length > 0 ? values.join(", ") : "-";
                          }
                          return methods ? String(methods) : "-";
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        N.º Pasajeros
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {viewingDetails.numeroPasajeros ??
                          viewingDetails.pasajeros?.length ??
                          0}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        N.º Cuotas
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {viewingDetails.numeroCuotas ??
                          (viewingDetails.cuotas
                            ? viewingDetails.cuotas.length
                            : 0)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Total Neto
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrencyDisplay(viewingDetails.netoPrincipal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Total Venduto
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrencyDisplay(viewingDetails.vendutoTotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Pagato / Acconto
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrencyDisplay(viewingDetails.acconto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Da pagare
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrencyDisplay(viewingDetails.daPagare)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Fee / AGV
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrencyDisplay(viewingDetails.feeAgv)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Teléfono
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {viewingDetails.numeroTelefono || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Correo
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {viewingDetails.email || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Dirección
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {viewingDetails.indirizzo || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pasajeros y Servicios */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 space-y-3 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-base font-semibold text-purple-900 dark:text-purple-200">
                    Pasajeros y servicios individualizados
                  </h3>
                  {viewingDetails.pasajeros &&
                  viewingDetails.pasajeros.length > 0 ? (
                    <div className="space-y-4">
                      {viewingDetails.pasajeros.map((pasajero, index) => {
                        const serviciosDetallados =
                          getServiciosDetallados(pasajero);
                        return (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-900/40 rounded-lg border border-purple-200 dark:border-purple-700 p-4 space-y-3"
                          >
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <h4 className="font-semibold text-purple-900 dark:text-purple-100 text-sm">
                                {index + 1}.{" "}
                                {pasajero.nombrePasajero ||
                                  "Pasajero sin nombre"}
                              </h4>
                              {pasajero.andata || pasajero.ritorno ? (
                                <div className="flex flex-wrap gap-3 text-xs text-purple-800 dark:text-purple-200">
                                  {pasajero.andata && (
                                    <span>
                                      <span className="font-medium">
                                        Fecha ida:
                                      </span>{" "}
                                      {formatDateDisplay(pasajero.andata)}
                                    </span>
                                  )}
                                  {pasajero.ritorno && (
                                    <span>
                                      <span className="font-medium">
                                        Fecha vuelta:
                                      </span>{" "}
                                      {formatDateDisplay(pasajero.ritorno)}
                                    </span>
                                  )}
                                </div>
                              ) : null}
                            </div>

                            {serviciosDetallados.length > 0 ? (
                              <div className="overflow-x-auto rounded-lg border border-purple-100 dark:border-purple-800">
                                <table className="min-w-full divide-y divide-purple-100 dark:divide-purple-800 text-xs">
                                  <thead className="bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold">
                                        Servicio
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold">
                                        Método compra
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold">
                                        IATA / Proveedor
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold">
                                        Fecha ida
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold">
                                        Fecha vuelta
                                      </th>
                                      <th className="px-3 py-2 text-right font-semibold">
                                        Neto
                                      </th>
                                      <th className="px-3 py-2 text-right font-semibold">
                                        Venduto
                                      </th>
                                      <th className="px-3 py-2 text-center font-semibold">
                                        Estado
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold">
                                        Fecha pago
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold">
                                        Fecha activación
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold">
                                        Notas
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-purple-50 dark:divide-purple-900/40 bg-white dark:bg-gray-900">
                                    {serviciosDetallados.map((detalle, idx) => {
                                      const { label, className } =
                                        getEstadoVisual(detalle.estado);
                                      return (
                                        <tr
                                          key={
                                            detalle.id ??
                                            `${detalle.servicio}-${idx}`
                                          }
                                          className="hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                                        >
                                          <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100">
                                            {detalle.servicio || "-"}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                            {detalle.metodoDiAcquisto &&
                                            detalle.metodoDiAcquisto.trim()
                                              ? detalle.metodoDiAcquisto
                                              : "-"}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                            {detalle.iata && detalle.iata.trim()
                                              ? detalle.iata
                                              : "-"}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                            {formatDateDisplay(
                                              detalle.andata || null,
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                            {formatDateDisplay(
                                              detalle.ritorno || null,
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-100">
                                            {formatCurrencyDisplay(
                                              detalle.neto ?? null,
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-100">
                                            {formatCurrencyDisplay(
                                              detalle.venduto ?? null,
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-center">
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
                                            >
                                              {label}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                            {formatDateDisplay(
                                              detalle.fechaPago || null,
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                            {formatDateDisplay(
                                              detalle.fechaActivacion || null,
                                            )}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200 max-w-[160px]">
                                            {getReadableNotes(detalle.notas) ||
                                              "-"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-purple-800 dark:text-purple-200 italic">
                                No se registraron servicios detallados para este
                                pasajero.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300 text-xs text-center py-4">
                      No hay pasajeros registrados en este expediente.
                    </p>
                  )}
                </div>

                {/* Cuotas */}
                {viewingDetails.cuotas && viewingDetails.cuotas.length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 space-y-3 border border-orange-200 dark:border-orange-800">
                    <h3 className="text-base font-semibold text-orange-900 dark:text-orange-200">
                      Sistema de cuotas ({viewingDetails.cuotas.length}{" "}
                      {viewingDetails.cuotas.length === 1 ? "cuota" : "cuotas"})
                    </h3>
                    <div className="space-y-3">
                      {viewingDetails.cuotas.map((cuota, index) => {
                        const { label, className } = getEstadoVisual(
                          cuota.isPagato ? "Pagado" : "Pendiente",
                        );
                        return (
                          <div
                            key={index}
                            className="bg-white dark:bg-gray-900/40 border border-orange-200 dark:border-orange-700 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <div>
                                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                                  Cuota {cuota.numeroCuota}
                                </p>
                                <p className="text-xs text-orange-700 dark:text-orange-300">
                                  Fecha programada:{" "}
                                  {formatDateDisplay(cuota.data)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                                  {formatCurrencyDisplay(cuota.prezzo)}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}
                                >
                                  {label}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 dark:text-gray-200">
                              <div>
                                <span className="font-medium">Notas:</span>{" "}
                                <span>
                                  {getReadableNotes(cuota.note) || "Sin notas"}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Archivo:</span>{" "}
                                <span>
                                  {cuota.attachedFile
                                    ? cuota.attachedFileName ||
                                      "Adjunto disponible en la sección de archivos"
                                    : "Sin archivo adjunto"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botón de cierre */}
                <div className="flex justify-end">
                  <button
                    onClick={handleCloseDetailsModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal de información del cliente */}
      {isMounted &&
        isClientModalOpen &&
        selectedClient &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-gray-400/50 backdrop-blur-[32px] z-[9999999998]"
              onClick={() => setIsClientModalOpen(false)}
            />
            <div className="fixed inset-0 modal z-[9999999999] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Información del Cliente - {selectedClient.firstName}{" "}
                    {selectedClient.lastName}
                  </h2>
                  <button
                    onClick={() => setIsClientModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-2 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
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
                  {(selectedClient.document1 ||
                    selectedClient.document2 ||
                    selectedClient.document3 ||
                    selectedClient.document4) && (
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
                              {selectedClient.document1.includes("/image/") ? (
                                <img
                                  src={selectedClient.document1}
                                  alt="Documento 1"
                                  className="max-h-full max-w-full object-contain rounded"
                                />
                              ) : (
                                <button
                                  onClick={() =>
                                    handleDownload(
                                      selectedClient.document1!,
                                      selectedClient.document1Name ||
                                        "documento1",
                                    )
                                  }
                                  className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
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
                              {selectedClient.document2.includes("/image/") ? (
                                <img
                                  src={selectedClient.document2}
                                  alt="Documento 2"
                                  className="max-h-full max-w-full object-contain rounded"
                                />
                              ) : (
                                <button
                                  onClick={() =>
                                    handleDownload(
                                      selectedClient.document2!,
                                      selectedClient.document2Name ||
                                        "documento2",
                                    )
                                  }
                                  className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
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
                              {selectedClient.document3.includes("/image/") ? (
                                <img
                                  src={selectedClient.document3}
                                  alt="Documento 3"
                                  className="max-h-full max-w-full object-contain rounded"
                                />
                              ) : (
                                <button
                                  onClick={() =>
                                    handleDownload(
                                      selectedClient.document3!,
                                      selectedClient.document3Name ||
                                        "documento3",
                                    )
                                  }
                                  className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
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
                              {selectedClient.document4.includes("/image/") ? (
                                <img
                                  src={selectedClient.document4}
                                  alt="Documento 4"
                                  className="max-h-full max-w-full object-contain rounded"
                                />
                              ) : (
                                <button
                                  onClick={() =>
                                    handleDownload(
                                      selectedClient.document4!,
                                      selectedClient.document4Name ||
                                        "documento4",
                                    )
                                  }
                                  className="flex flex-col items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
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
          document.body,
        )}

      {/* Tabla de detalles de pasajeros */}
      <PassengerDetailsTable
        isOpen={isPassengerDetailsOpen}
        onClose={handleClosePassengerDetails}
      />

      {/* Tabla simplificada de detalles de pasajeros */}
      <PassengerDetailsTableSimple
        isOpen={isPassengerDetailsSimpleOpen}
        onClose={handleClosePassengerDetailsSimple}
      />
    </div>
  );
}
