"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";
import { CopyNotification } from "@/components/ui/notification/CopyNotification";
import { Modal } from "@/components/ui/modal";
import VentaForm from "@/components/tour-bus/VentaForm";
import EditVentaForm from "@/components/tour-bus/EditVentaForm";
import SimpleRichTextEditor from "@/components/form/SimpleRichTextEditor";
import { 
  UsersIcon, 
  CalendarIcon, 
  DollarSignIcon,
  PlusIcon,
  XIcon,
  SearchIcon,
  DownloadIcon,
  FilterIcon,
  TrashIcon,
  PlaneIcon
} from "lucide-react";
import { Icon } from '@iconify/react';

interface TourBus {
  id: string;
  titulo: string;
  precioAdulto: number;
  precioNino: number;
  cantidadAsientos: number;
  fechaViaje: string | null;
  descripcion: string | null;
  notas: string | null;
  notasCoordinador: string | null;
  // Campos de costos
  acc: string | null;
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
  documentoViaggio?: Array<{ url: string; name: string }> | null;
  creator: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  asientos: AsientoBus[];
  ventasTourBus: VentaTourBus[];
}

interface VentaTourBus {
  id: string;
  tourBusId: string;
  clienteId: string | null;
  clienteNombre: string;
  codiceFiscale: string;
  indirizzo: string;
  email: string;
  numeroTelefono: string;
  fechaNacimiento: string;
  fermata: string;
  numeroAsiento: number;
  tieneMascotas: boolean;
  numeroMascotas: number | null;
  tieneInfantes: boolean;
  numeroInfantes: number | null;
  totalAPagar: number;
  acconto: number;
  daPagare: number;
  metodoPagamento: string;
  estadoPago: string;
  numeroAcompanantes: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  acompanantes: Acompanante[];
  cuotas: CuotaTourBus[];
}

interface Acompanante {
  id: string;
  nombreCompleto: string;
  telefono: string | null;
  codiceFiscale: string | null;
  esAdulto: boolean;
  fermata: string;
  numeroAsiento: number;
}

interface CuotaTourBus {
  id: string;
  numeroCuota: number;
  fechaPago: string | null;
  precioPagar: number;
  metodoPagamento: string;
  isPagado: boolean;
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

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  fiscalCode: string;
  address: string;
  email: string;
  phoneNumber: string;
  birthPlace: string;
  birthDate: string;
}

// Funciones de utilidad para notas
const sanitizeEditorHtml = (note?: string | null) => {
  if (!note) return '';
  const allowedTags = ['b', 'strong', 'i', 'em', 'span', 'br'];
  const allowedStyles = ['color', 'font-size'];

  // Usar solo regex para evitar manipulación del DOM
  let sanitized = note;

  // Remover todos los tags excepto los permitidos
  sanitized = sanitized.replace(/<(\/?)([^>]+)>/gi, (match, closing, tagContent) => {
    const tagName = tagContent.split(/\s/)[0].toLowerCase();
    
    // Si es un tag de cierre
    if (closing) {
      return allowedTags.includes(tagName) ? `</${tagName}>` : '';
    }
    
    // Si es un tag de apertura
    if (allowedTags.includes(tagName)) {
      // Si es span, permitir solo atributos style con estilos permitidos
      if (tagName === 'span') {
        const styleMatch = tagContent.match(/style\s*=\s*["']([^"']*)["']/i);
        if (styleMatch) {
          const styles = styleMatch[1];
          const allowedStylesList = styles
            .split(';')
            .map((rule: string) => rule.trim())
            .filter((rule: string) => {
              const [property] = rule.split(':').map((part: string) => part.trim().toLowerCase());
              return allowedStyles.includes(property);
            });
          if (allowedStylesList.length > 0) {
            return `<span style="${allowedStylesList.join('; ')}">`;
          }
        }
        return '<span>';
      }
      
      // Para otros tags permitidos, remover todos los atributos
      return `<${tagName}>`;
    }
    
    // Si el tag no está permitido, removerlo
    return '';
  });

  // Limpiar atributos restantes que puedan haber quedado
  sanitized = sanitized.replace(/\s+style\s*=\s*["'][^"']*["']/gi, (match) => {
    const styles = match.match(/["']([^"']*)["']/)?.[1] || '';
    const allowedStylesList = styles
      .split(';')
      .map((rule: string) => rule.trim())
      .filter((rule: string) => {
        const [property] = rule.split(':').map((part: string) => part.trim().toLowerCase());
        return allowedStyles.includes(property);
      });
    return allowedStylesList.length > 0 ? ` style="${allowedStylesList.join('; ')}"` : '';
  });

  return sanitized;
};

const extractPlainText = (note?: string | null) => {
  const sanitized = sanitizeEditorHtml(note);
  if (!sanitized) return '';
  return sanitized
    .replace(/<br\s*\/?>(?:\r?\n)?/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getNotePreview = (note?: string | null, maxLength = 280) => {
  const text = extractPlainText(note);
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
};

export default function AsientosTourBusPage() {
  const params = useParams();
  const router = useRouter();
  const { userRole, isLoading: roleLoading } = useUserRole();
  const [tour, setTour] = useState<TourBus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  
  // Estados para el modal de venta
  const [isVentaModalOpen, setIsVentaModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Datos de referencia cacheados
  const [referenceData, setReferenceData] = useState({
    clients: [] as Client[],
    fermate: [] as string[],
    metodosPagamento: [] as string[],
    stati: [] as string[]
  });
  const [isLoadingReference, setIsLoadingReference] = useState(false);
  
  // Estados para la lista de ventas
  const [usuariosVentas, setUsuariosVentas] = useState<Record<string, { firstName: string; lastName: string }>>({});
  
  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<VentaTourBus | null>(null);
  
  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Referencias para las secciones
  const busLayoutRef = useRef<HTMLDivElement>(null);
  const ventasListRef = useRef<HTMLDivElement>(null);
  const pasajeroTableRef = useRef<HTMLDivElement>(null);

  // Estados para editar notas
  const [editingNotas, setEditingNotas] = useState<{tour: boolean, coordinador: boolean}>({
    tour: false,
    coordinador: false
  });
  const [tempNotas, setTempNotas] = useState<{tour: string, coordinador: string}>({
    tour: '',
    coordinador: ''
  });
  const [expandedNotas, setExpandedNotas] = useState<{ tour: boolean; coordinador: boolean }>({
    tour: false,
    coordinador: false
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados para Documento Viaggio
  const [isUploadingDocumentoViaggio, setIsUploadingDocumentoViaggio] = useState(false);
  const [isDocumentoViaggioModalOpen, setIsDocumentoViaggioModalOpen] = useState(false);
  const documentoViaggioInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos de referencia UNA VEZ al montar
  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchTour();
    }
  }, [params.id]);

  const loadReferenceData = async () => {
    setIsLoadingReference(true);
    try {
      const [clientsRes, fermateRes, metodosRes, statiRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/fermata-bus'),
        fetch('/api/metodo-pagamento'),
        fetch('/api/stato-bus')
      ]);
      
      const [clientsData, fermateData, metodosData, statiData] = await Promise.all([
        clientsRes.json(),
        fermateRes.json(),
        metodosRes.json(),
        statiRes.json()
      ]);
      
      setReferenceData({
        clients: clientsData.clients || [],
        fermate: fermateData.fermate?.map((f: any) => f.fermata) || [],
        metodosPagamento: metodosData.metodosPagamento?.map((m: any) => m.metodoPagamento) || [],
        stati: statiData.stati?.map((s: any) => s.stato) || []
      });
    } catch (error) {
      // Error silencioso, se maneja en la UI
    } finally {
      setIsLoadingReference(false);
    }
  };

  const fetchTour = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/tour-bus/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTour(data.tour);
      } else {
        setError('Error al cargar el tour');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleVentaSubmit = async (ventaData: any) => {
    setIsSubmitting(true);
    try {
      // Si es FormData, no agregar headers (el navegador lo hace automáticamente)
      const isFormData = ventaData instanceof FormData;
      const response = await fetch('/api/tour-bus/venta', {
        method: 'POST',
        ...(isFormData ? {} : { 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ventaData)
        }),
        ...(isFormData ? { body: ventaData } : {})
      });

      if (response.ok) {
        setIsVentaModalOpen(false);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
        
        // Recargar el tour para actualizar los asientos
        fetchTour();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.details 
          ? `${errorData.error}\n\nDetalles: ${errorData.details}` 
          : errorData.error || 'Error al crear la venta';
        alert(errorMessage);
      }
    } catch (error: any) {
      alert(`Error de conexión: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const numerosAsientosDisponibles = tour?.asientos
    .filter(a => !a.isVendido && a.tipo !== 'CONDUCTOR')
    .map(a => a.numeroAsiento) || [];

  // Cargar información de usuarios cuando se carga el tour
  useEffect(() => {
    if (tour?.ventasTourBus) {
      const userIds = [...new Set(tour.ventasTourBus.map(v => v.createdBy))];
      userIds.forEach(userId => {
        if (!usuariosVentas[userId]) {
          fetchUserInfo(userId);
        }
      });
    }
  }, [tour]);

  const fetchUserInfo = async (clerkId: string) => {
    try {
      // Buscar el usuario por clerkId en la base de datos
      const response = await fetch('/api/user/list');
      if (response.ok) {
        const data = await response.json();
        const user = data.users.find((u: any) => u.clerkId === clerkId);
        if (user) {
          setUsuariosVentas(prev => ({
            ...prev,
            [clerkId]: {
              firstName: user.firstName || '',
              lastName: user.lastName || ''
            }
          }));
        }
      }
    } catch (error) {
      // Error silencioso al buscar información de usuario
    }
  };


  // Handler para generar recibo
  const handleGenerateRicevuta = async (ventaId: string) => {
    try {
      setMessage({
        type: 'success',
        text: 'Generando ricevuta...'
      });

      const response = await fetch('/api/tour-bus/generate-ricevuta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ventaId }),
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
        : `Ricevuta_TourBus_${ventaId}_${new Date().getTime()}.pdf`;
      
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

  const handlePrintVenta = (venta: VentaTourBus) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

                    const userName = venta.creator?.firstName 
                      ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                      : venta.creator?.email || 'Usuario';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Venta - ${venta.clienteNombre}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 20px; }
            .info-row { display: flex; margin-bottom: 8px; }
            .label { font-weight: bold; min-width: 200px; }
            .value { color: #555; }
            .acompanante { background: #f3f4f6; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Información de Venta - Tour Bus</h1>
          <h2>Cliente Principal (Capo Gruppo)</h2>
          <div class="info-row"><div class="label">Nombre Completo:</div><div class="value">${venta.clienteNombre}</div></div>
          <div class="info-row"><div class="label">Mascotas:</div><div class="value">${venta.tieneMascotas ? `Sí (${venta.numeroMascotas})` : 'No'}</div></div>
          <div class="info-row"><div class="label">Total a Pagar:</div><div class="value">€${venta.totalAPagar.toFixed(2)}</div></div>
          <div class="info-row"><div class="label">Monto Pagado (Acconto):</div><div class="value">€${venta.acconto.toFixed(2)}</div></div>
          <div class="info-row"><div class="label">Saldo Pendiente:</div><div class="value">€${venta.daPagare.toFixed(2)}</div></div>
          <div class="info-row"><div class="label">Fermata:</div><div class="value">${venta.fermata}</div></div>
          <div class="info-row"><div class="label">Número Telefónico:</div><div class="value">${venta.numeroTelefono}</div></div>
          <div class="info-row"><div class="label">Usuario que Registró:</div><div class="value">${userName}</div></div>
          
          ${venta.acompanantes.length > 0 ? `
            <h2>Acompañantes</h2>
            ${venta.acompanantes.map(acomp => `
              <div class="acompanante">
                <div class="info-row"><div class="label">Nombre Completo:</div><div class="value">${acomp.nombreCompleto}</div></div>
                <div class="info-row"><div class="label">Fermata:</div><div class="value">${acomp.fermata}</div></div>
                <div class="info-row"><div class="label">Número de Contacto:</div><div class="value">${acomp.telefono || 'N/A'}</div></div>
              </div>
            `).join('')}
          ` : ''}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEditVenta = (venta: VentaTourBus) => {
    setEditingVenta(venta);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingVenta(null);
  };

  const handleUpdateVenta = async (ventaData: any) => {
    try {
      setIsSubmitting(true);
      
      // Si es FormData, no agregar headers (el navegador lo hace automáticamente)
      const isFormData = ventaData instanceof FormData;
      const response = await fetch(`/api/tour-bus/venta/${isFormData ? ventaData.get('id') : ventaData.id}`, {
        method: 'PUT',
        ...(isFormData ? {} : { 
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ventaData)
        }),
        ...(isFormData ? { body: ventaData } : {})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar la venta');
      }

      // Recargar los datos del tour
      await fetchTour();
      
      setIsEditModalOpen(false);
      setEditingVenta(null);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al actualizar la venta');
      alert(error instanceof Error ? error.message : 'Error al actualizar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVenta = async (ventaId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta venta? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/tour-bus/venta/${ventaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la venta');
      }

      // Recargar los datos del tour
      await fetchTour();
      
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const passengers = useMemo(() => {
    if (!tour) return [];

    const passengersAccum: Array<{
      nome: string;
      cognome: string;
      codiceFiscale: string | null;
    }> = [];

    const ventas = tour.ventasTourBus || [];

    ventas.forEach((venta) => {
      const fullName = venta.clienteNombre.split(' ');
      const nome = fullName[0] || '';
      const cognome = fullName.slice(1).join(' ') || '';

      passengersAccum.push({
        nome,
        cognome,
        codiceFiscale: venta.codiceFiscale,
      });

      venta.acompanantes.forEach((acomp) => {
        const acompFullName = acomp.nombreCompleto.split(' ');
        const acompNome = acompFullName[0] || '';
        const acompCognome = acompFullName.slice(1).join(' ') || '';

        passengersAccum.push({
          nome: acompNome,
          cognome: acompCognome,
          codiceFiscale: acomp.codiceFiscale,
        });
      });
    });

    return passengersAccum;
  }, [tour]);

  const {
    asientosVendidos,
    asientosDisponibles,
    totalCostos,
    totalIngresos,
    feeTotal,
    totalGeneral,
    totalPagos,
    totalSaldo,
    totalPets,
    totalInfantes,
    totalAdultos,
    totalNinos,
    fermateStats,
    agentesTexto,
  } = useMemo(() => {
    if (!tour) {
      return {
        asientosVendidos: 0,
        asientosDisponibles: 0,
        totalCostos: 0,
        totalIngresos: 0,
        feeTotal: 0,
        totalGeneral: 0,
        totalPagos: 0,
        totalSaldo: 0,
        totalPets: 0,
        totalInfantes: 0,
        totalAdultos: 0,
        totalNinos: 0,
        fermateStats: {} as Record<string, number>,
        agentesTexto: 'Sin ventas',
        agentesLista: [] as string[],
      };
    }

    const ventas = tour.ventasTourBus || [];
    const asientos = tour.asientos || [];

    const asientosVendidos = asientos.filter((a) => a.isVendido).length;
    const asientosDisponibles = tour.cantidadAsientos - asientosVendidos;

    let totalGeneral = 0;
    let totalPagos = 0;
    let totalSaldo = 0;
    let totalPets = 0;
    let totalInfantes = 0;
    let totalAdultos = 0;
    let totalNinos = 0;
    const fermateStats: Record<string, number> = {};
    const agentesSet = new Set<string>();

    ventas.forEach((venta) => {
      totalGeneral += venta.totalAPagar;
      totalPagos += venta.acconto;
      totalSaldo += venta.daPagare;
      totalPets += venta.numeroMascotas || 0;
      totalInfantes += venta.numeroInfantes || 0;

      const adultosVenta = 1 + venta.acompanantes.filter((a) => a.esAdulto).length;
      const ninosVenta = venta.acompanantes.filter((a) => !a.esAdulto).length;

      totalAdultos += adultosVenta;
      totalNinos += ninosVenta;

      fermateStats[venta.fermata] = (fermateStats[venta.fermata] || 0) + 1;
      venta.acompanantes.forEach((acomp) => {
        fermateStats[acomp.fermata] = (fermateStats[acomp.fermata] || 0) + 1;
      });

      const agenteNombre = venta.creator?.firstName
        ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
        : venta.creator?.email || 'Usuario';

      if (agenteNombre) {
        agentesSet.add(agenteNombre);
      }
    });

    const totalCostos =
      (tour.bus || 0) +
      (tour.pasti || 0) +
      (tour.parking || 0) +
      (tour.coordinatore1 || 0) +
      (tour.coordinatore2 || 0) +
      (tour.ztl || 0) +
      (tour.hotel || 0) +
      (tour.polizza || 0) +
      (tour.tkt || 0);

    const totalIngresos = totalPagos;
    const feeTotal = totalIngresos - totalCostos;
    const agentesLista = Array.from(agentesSet);
    const agentesTexto = agentesLista.length > 0 ? agentesLista.join(', ') : 'Sin ventas';

    return {
      asientosVendidos,
      asientosDisponibles,
      totalCostos,
      totalIngresos,
      feeTotal,
      totalGeneral,
      totalPagos,
      totalSaldo,
      totalPets,
      totalInfantes,
      totalAdultos,
      totalNinos,
      fermateStats,
      agentesTexto,
      agentesLista,
    };
  }, [tour]);

  const processedVentas = useMemo(() => {
    if (!tour) return [];

    const ventas = tour.ventasTourBus || [];

    return ventas.map((venta) => {
      const totalAdultos = 1 + venta.acompanantes.filter((a) => a.esAdulto).length;
      const totalNinos = venta.acompanantes.filter((a) => !a.esAdulto).length;
      const agenteNombre = venta.creator?.firstName
        ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
        : venta.creator?.email || 'Usuario';

      return {
        venta,
        totalAdultos,
        totalNinos,
        agenteNombre,
      };
    });
  }, [tour]);

  const handleExportPassengers = async () => {
    try {
      if (passengers.length === 0) {
        alert('No hay pasajeros para exportar');
        return;
      }

      // Crear datos para Excel
      const excelData = passengers.map(passenger => ({
        'Nome': passenger.nome,
        'Cognome': passenger.cognome,
        'DNI EXTRANJERO': 'DNI EXTRANJERO',
        'Codice Fiscale': passenger.codiceFiscale || ''
      }));

      // Crear workbook
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pasajeros');

      // Generar nombre de archivo
      const fileName = `Pasajeros_${tour?.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Descargar archivo
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      alert('Error al exportar el archivo Excel');
    }
  };

  // Función para exportar tabla de costos a Excel
  const handleExportToExcel = () => {
    if (!tour) return;

    const data = [
      {
        'DESTINAZIONE': tour.titulo,
        'AUTOSERVIZIO': tour.autoservicio || '-',
        'BUS': tour.bus || 0,
        'PASTI': tour.pasti || 0,
        'PARKING': tour.parking || 0,
        'TC.1': tour.coordinatore1 || 0,
        'TC.2': tour.coordinatore2 || 0,
        'ZTL': tour.ztl || 0,
        'HOTEL': tour.hotel || 0,
        'POLIZZA': tour.polizza || 0,
        'TKT': tour.tkt || 0,
        'SPESA TOTALE': totalCostos,
        'RICAVO TOTALE': totalIngresos,
        'FEE TOTALE': feeTotal,
        'AGENTE': agentesTexto
      }
    ];

    // Crear CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analisi-costi-ricavi-${tour.titulo.replace(/\s+/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintListaCompleta = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fermateStatsEntries = Object.entries(fermateStats);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lista Completa - ${tour?.titulo}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f9fafb;
              color: #111827;
            }
            
            .container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            
            .header {
              background: #4F46E5;
              color: white;
              padding: 16px;
              text-align: center;
              font-size: 18px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .stats-section {
              background: #f3f4f6;
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 30px;
            }
            
            .stats-column {
              flex: 1;
            }
            
            .stats-column h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              font-weight: 600;
              color: #374151;
            }
            
            .stat-item {
              font-size: 12px;
              margin-bottom: 4px;
              color: #111827;
              font-weight: 500;
            }
            
            .print-button {
              background: #4F46E5;
              color: white;
              padding: 8px 16px;
              border-radius: 4px;
              border: none;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;
            }
            
            .table-container {
              overflow-x: auto;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            
            .table-header {
              background: #f9fafb;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .table-header th {
              padding: 8px 16px;
              text-align: left;
              font-size: 12px;
              font-weight: 500;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            
            .capo-gruppo-row {
              background: #dbeafe;
            }
            
            .acompanante-row {
              background: #f0fdf4;
            }
            
            .capo-gruppo-row td,
            .acompanante-row td {
              padding: 8px 16px;
              vertical-align: middle;
            }
            
            .seat-button {
              background: #f97316;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              text-align: center;
              border: none;
              min-width: 30px;
            }
            
            .capo-gruppo-name {
              color: #1e40af;
              font-weight: 500;
              font-size: 14px;
            }
            
            .acompanante-name {
              color: #374151;
              font-weight: 500;
              font-size: 12px;
            }
            
            .group-info {
              font-size: 10px;
              color: #6b7280;
              margin-top: 2px;
            }
            
            .capo-gruppo-badge {
              background: #bfdbfe;
              color: #1e3a8a;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 500;
            }
            
            .adulto-badge {
              background: #bbf7d0;
              color: #166534;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 500;
            }
            
            .nino-badge {
              background: #fef3c7;
              color: #92400e;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 500;
            }
            
            .payment-buttons {
              display: flex;
              gap: 2px;
            }
            
            .payment-button {
              flex: 1;
              padding: 4px 6px;
              border-radius: 4px;
              font-size: 10px;
              text-align: center;
              font-weight: 500;
              border: none;
            }
            
            .total-payment {
              background: #3b82f6;
              color: white;
            }
            
            .pagos-payment {
              background: #10b981;
              color: white;
            }
            
            .saldo-payment {
              background: #f97316;
              color: white;
            }
            
            .field-input {
              background: white;
              border: 1px solid #d1d5db;
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 12px;
              text-align: center;
              font-weight: 500;
            }
            
            
            .dash {
              color: #9ca3af;
              font-weight: 500;
              font-size: 12px;
            }
            
            .acompanante-indent {
              padding-left: 32px;
            }
            
            @media print {
              body { 
                padding: 10px; 
                background: white;
              }
              .container {
                box-shadow: none;
              }
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              INFORMAZIONI SUI PASSEGGERI
            </div>
            
            <div class="stats-section">
              <div class="stats-column">
                <h3>Estadísticas Generales</h3>
                <div class="stat-item">Totale posti: ${tour?.cantidadAsientos}</div>
                <div class="stat-item">Posti occupati: ${asientosVendidos}</div>
                <div class="stat-item">Posti disponibili: ${asientosDisponibles}</div>
              </div>
              
              <div class="stats-column">
                <h3>Por Fermata</h3>
                ${Object.entries(fermateStats).map(([fermata, count]) => 
                  `<div class="stat-item">${fermata}: ${count}</div>`
                ).join('')}
              </div>
              
              <div class="stats-column">
                <h3>Tipos de Pasajero</h3>
                <div class="stat-item">Total Pax Pets: ${totalPets}</div>
                <div class="stat-item">Total Infantes: ${totalInfantes}</div>
                <div class="stat-item">Totale Adulti: ${totalAdultos}</div>
                <div class="stat-item">Totale Bambini: ${totalNinos}</div>
              </div>
              
              <div class="stats-column">
                <h3>Totales Monetarios</h3>
                <div class="stat-item">Total General: €${totalGeneral.toFixed(2)}</div>
                <div class="stat-item">Total Pagos: €${totalPagos.toFixed(2)}</div>
                <div class="stat-item">Total Saldo: €${totalSaldo.toFixed(2)}</div>
                <button class="print-button" onclick="window.print()">📄 Imprimir Lista</button>
              </div>
            </div>
            
            <div class="table-container">
              <table>
                <thead class="table-header">
                  <tr>
                    <th>Asiento</th>
                    <th>Pasajero</th>
                    <th>Tipo</th>
                    <th>Pagos</th>
                    <th>Fermata</th>
                    <th>Agente</th>
                    <th>Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  ${tour?.ventasTourBus.map(venta => {
                    const totalAdultos = 1 + venta.acompanantes.filter(a => a.esAdulto).length;
                    const totalNinos = venta.acompanantes.filter(a => !a.esAdulto).length;
                    const userName = venta.creator?.firstName 
                      ? `${venta.creator.firstName}${venta.creator.lastName ? ` ${venta.creator.lastName}` : ''}`.trim()
                      : venta.creator?.email || 'Usuario';
                    
                    return `
                      <!-- Capo Gruppo -->
                      <tr class="capo-gruppo-row">
                        <td>
                          <button class="seat-button">${venta.numeroAsiento}</button>
                        </td>
                        <td>
                          <div class="capo-gruppo-name">${venta.clienteNombre}</div>
                          <div class="group-info">Adultos: ${totalAdultos} | Niños: ${totalNinos}</div>
                        </td>
                        <td>
                          <span class="capo-gruppo-badge">Capo Gruppo</span>
                        </td>
                        <td>
                          <div class="payment-buttons">
                            <div class="payment-button total-payment">Total: €${venta.totalAPagar.toFixed(0)}</div>
                            <div class="payment-button pagos-payment">Pagos: €${venta.acconto.toFixed(0)}</div>
                            <div class="payment-button saldo-payment">Saldo: €${venta.daPagare.toFixed(0)}</div>
                          </div>
                        </td>
                        <td>
                          <div class="field-input">${venta.fermata}</div>
                        </td>
                        <td>
                          <div class="field-input">${userName}</div>
                        </td>
                        <td>
                          <div class="field-input">${venta.numeroTelefono}</div>
                        </td>
                      </tr>
                      
                      <!-- Acompañantes -->
                      ${venta.acompanantes.map(acomp => `
                        <tr class="acompanante-row">
                          <td class="acompanante-indent">
                            <button class="seat-button">${acomp.numeroAsiento}</button>
                          </td>
                          <td>
                            <div class="acompanante-name">${acomp.nombreCompleto}</div>
                          </td>
                          <td>
                            <span class="${acomp.esAdulto ? 'adulto-badge' : 'nino-badge'}">${acomp.esAdulto ? 'Adulto' : 'Niño'}</span>
                          </td>
                          <td>
                            <span class="dash">-</span>
                          </td>
                          <td>
                            <div class="field-input">${acomp.fermata}</div>
                          </td>
                          <td>
                            <span class="dash">-</span>
                          </td>
                          <td>
                            <div class="field-input">${acomp.telefono || 'N/A'}</div>
                          </td>
                        </tr>
                      `).join('')}
                    `;
                  }).join('') || ''}
                </tbody>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintBusLayout = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalAdultos = tour?.ventasTourBus.reduce((sum, v) => sum + 1 + v.acompanantes.filter(a => a.esAdulto).length, 0) || 0;
    const totalNinos = tour?.ventasTourBus.reduce((sum, v) => sum + v.acompanantes.filter(a => !a.esAdulto).length, 0) || 0;
    const totalPets = tour?.ventasTourBus.reduce((sum, v) => sum + (v.numeroMascotas || 0), 0) || 0;
    const totalInfantes = tour?.ventasTourBus.reduce((sum, v) => sum + (v.numeroInfantes || 0), 0) || 0;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Layout del Bus - ${tour?.titulo}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f9fafb;
              color: #111827;
            }
            
            .container {
              max-width: 100%;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            
            .header {
              background: #4F46E5;
              color: white;
              padding: 16px;
              text-align: center;
              font-size: 18px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            
            .stats-section {
              background: #f3f4f6;
              padding: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 30px;
            }
            
            .stats-column {
              flex: 1;
            }
            
            .stats-column h3 {
              margin: 0 0 10px 0;
              font-size: 14px;
              font-weight: 600;
              color: #374151;
            }
            
            .stat-item {
              font-size: 12px;
              margin-bottom: 4px;
              color: #111827;
              font-weight: 500;
            }
            
            .bus-layout {
              padding: 20px;
              display: flex;
              gap: 20px;
              justify-content: center;
            }
            
            .seat-list {
              width: 200px;
              background: #4b5563;
              color: white;
              padding: 16px;
              border-radius: 8px;
            }
            
            .seat-item {
              padding: 4px 0;
              font-size: 12px;
              border-bottom: 1px solid #6b7280;
            }
            
            .seat-item:last-child {
              border-bottom: none;
            }
            
            .seat-number {
              font-weight: 600;
            }
            
            .seat-name {
              color: #d1d5db;
            }
            
            
            .bus-center {
              background: #dbeafe;
              padding: 16px;
              border-radius: 8px;
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 8px;
              align-items: center;
            }
            
            .seat-button {
              width: 40px;
              height: 40px;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              font-size: 12px;
              border: 1px solid #3b82f6;
            }
            
            .seat-libero { background: #e1e1e1; color: #111827; }
            .seat-acconto { background: #f8ee7d; color: #111827; }
            .seat-pagato { background: #76df76; color: #111827; }
            .seat-prenotato { background: #ffa350; color: #111827; }
            
            .aisle {
              width: 40px;
              height: 40px;
            }
            
            .legend {
              padding: 20px;
              display: flex;
              justify-content: center;
              gap: 20px;
              background: #f9fafb;
            }
            
            .legend-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 12px;
            }
            
            .legend-color {
              width: 16px;
              height: 16px;
              border-radius: 2px;
            }
            
            @media print {
              @page {
                size: A4 portrait;
                margin: 0.5cm;
              }
              
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              body { 
                padding: 0; 
                margin: 0;
                background: white;
                font-size: 10px;
              }
              
              .container {
                box-shadow: none;
                max-width: 100%;
                margin: 0;
                padding: 0;
                border-radius: 0;
              }
              
              .header {
                padding: 6px;
                font-size: 13px;
                background: transparent !important;
                color: #000 !important;
              }
              
              .stats-section {
                padding: 6px;
                gap: 12px;
                flex-wrap: wrap;
                background: transparent !important;
              }
              
              .stats-column {
                flex: 1 1 auto;
                min-width: 100px;
              }
              
              .stats-column h3 {
                font-size: 10px;
                margin-bottom: 3px;
              }
              
              .stat-item {
                font-size: 8px;
                margin-bottom: 1px;
              }
              
              .bus-layout {
                padding: 6px;
                gap: 6px;
                flex-wrap: nowrap;
              }
              
              .seat-list {
                width: 130px;
                padding: 6px;
                font-size: 8px;
                background: transparent !important;
                color: #000 !important;
              }
              
              .seat-item {
                padding: 1px 0;
                font-size: 8px;
              }
              
              .seat-number {
                font-size: 8px;
              }
              
              .seat-name {
                font-size: 7px;
                color: #000 !important;
              }
              
              .bus-center {
                padding: 6px;
                gap: 3px;
                background: transparent !important;
              }
              
              .seat-button {
                width: 26px;
                height: 26px;
                font-size: 9px;
              }
              
              .aisle {
                width: 26px;
                height: 26px;
              }
              
              .legend {
                padding: 4px 8px;
                gap: 8px;
                font-size: 8px;
                margin-top: -4px;
              }
              
              .legend-item {
                font-size: 8px;
                gap: 3px;
              }
              
              .legend-color {
                width: 10px;
                height: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              LAYOUT DEL BUS - ${tour?.titulo}
            </div>
            
            <div class="stats-section">
              <div class="stats-column">
                <h3>Estadísticas Generales</h3>
                <div class="stat-item">Totale posti: ${tour?.cantidadAsientos}</div>
                <div class="stat-item">Posti occupati: ${asientosVendidos}</div>
                <div class="stat-item">Posti disponibili: ${asientosDisponibles}</div>
              </div>
              
              <div class="stats-column">
                <h3>Tipos de Pasajero</h3>
                <div class="stat-item">Totale Adulti: ${totalAdultos}</div>
                <div class="stat-item">Totale Bambini: ${totalNinos}</div>
                <div class="stat-item">Total Pax Pets: ${totalPets}</div>
                <div class="stat-item">Total Infantes: ${totalInfantes}</div>
              </div>
              
              <div class="stats-column">
                <h3>Información del Tour</h3>
                <div class="stat-item">Precio Adulto: €${tour?.precioAdulto}</div>
                <div class="stat-item">Precio Niño: €${tour?.precioNino}</div>
                ${tour?.fechaViaje ? `<div class="stat-item">Fecha Viaje: ${new Date(tour.fechaViaje).toLocaleDateString()}</div>` : ''}
              </div>
            </div>
            
            <div class="bus-layout">
              <!-- Lista izquierda -->
              <div class="seat-list">
                ${tour?.asientos.filter((_, index) => index % 4 < 2).map((asiento, index) => {
                  const isDivider = index > 0 && index % 2 === 0;
                  const fermata = getFermataAsiento(asiento.numeroAsiento);
                  return `
                    ${isDivider ? '<div style="border-top: 1px solid #6b7280; margin: 4px 0;"></div>' : ''}
                    <div class="seat-item">
                      <div class="seat-number">${asiento.numeroAsiento}</div>
                      <div class="seat-name">${asiento.isVendido ? asiento.clienteNombre : 'Posto Libero'}${asiento.isVendido && fermata ? ` (${fermata})` : ''}</div>
                    </div>
                  `;
                }).join('')}
              </div>
              
              <!-- Centro del bus -->
              <div class="bus-center">
                ${Array.from({ length: Math.ceil((tour?.asientos.length || 0) / 4) }, (_, rowIndex) => {
                  const startIndex = rowIndex * 4;
                  const rowAsientos = tour?.asientos.slice(startIndex, startIndex + 4) || [];
                  
                  return `
                    ${rowAsientos[0] ? `<div class="seat-button seat-${rowAsientos[0].isVendido ? rowAsientos[0].stato.toLowerCase() : 'libero'}">${rowAsientos[0].numeroAsiento}</div>` : '<div class="aisle"></div>'}
                    ${rowAsientos[1] ? `<div class="seat-button seat-${rowAsientos[1].isVendido ? rowAsientos[1].stato.toLowerCase() : 'libero'}">${rowAsientos[1].numeroAsiento}</div>` : '<div class="aisle"></div>'}
                    <div class="aisle"></div>
                    ${rowAsientos[2] ? `<div class="seat-button seat-${rowAsientos[2].isVendido ? rowAsientos[2].stato.toLowerCase() : 'libero'}">${rowAsientos[2].numeroAsiento}</div>` : '<div class="aisle"></div>'}
                    ${rowAsientos[3] ? `<div class="seat-button seat-${rowAsientos[3].isVendido ? rowAsientos[3].stato.toLowerCase() : 'libero'}">${rowAsientos[3].numeroAsiento}</div>` : '<div class="aisle"></div>'}
                  `;
                }).join('')}
              </div>
              
              <!-- Lista derecha -->
              <div class="seat-list">
                ${tour?.asientos.filter((_, index) => index % 4 >= 2).map((asiento, index) => {
                  const isDivider = index > 0 && index % 2 === 0;
                  const fermata = getFermataAsiento(asiento.numeroAsiento);
                  return `
                    ${isDivider ? '<div style="border-top: 1px solid #6b7280; margin: 4px 0;"></div>' : ''}
                    <div class="seat-item">
                      <div class="seat-number">${asiento.numeroAsiento}</div>
                      <div class="seat-name">${asiento.isVendido ? asiento.clienteNombre : 'Posto Libero'}${asiento.isVendido && fermata ? ` (${fermata})` : ''}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
            
            <div class="legend">
              <div class="legend-item">
                <div class="legend-color" style="background: #e1e1e1;"></div>
                <span>Libero</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #f8ee7d;"></div>
                <span>Acconto</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #76df76;"></div>
                <span>Pagato</span>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background: #ffa350;"></div>
                <span>Prenotato</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const getSeatColor = (asiento: AsientoBus) => {
    // Si no está vendido, siempre es "Libero" (gris claro)
    if (!asiento.isVendido) {
      return 'text-gray-900';
    }
    
    // Si está vendido, el color depende del estado (stato)
    switch (asiento.stato) {
      case 'Acconto':
        return 'text-gray-900'; // Amarillo claro
      case 'Libero':
        return 'text-gray-900'; // Gris claro
      case 'Pagato':
        return 'text-gray-900'; // Verde claro
      case 'Prenotato':
        return 'text-gray-900'; // Naranja
      default:
        return 'text-gray-900'; // Por defecto gris claro
    }
  };

  const getSeatBackgroundColor = (asiento: AsientoBus) => {
    // Si no está vendido, siempre es "Libero" (gris claro)
    if (!asiento.isVendido) {
      return '#e1e1e1';
    }
    
    // Si está vendido, el color depende del estado (stato)
    switch (asiento.stato) {
      case 'Acconto':
        return '#f8ee7d'; // Amarillo claro
      case 'Libero':
        return '#e1e1e1'; // Gris claro
      case 'Pagato':
        return '#76df76'; // Verde claro
      case 'Prenotato':
        return '#ffa350'; // Naranja
      default:
        return '#e1e1e1'; // Por defecto gris claro
    }
  };

  const getSeatTitle = (asiento: AsientoBus) => {
    if (asiento.isVendido) {
      return `Posto ${asiento.numeroAsiento} - ${asiento.stato} - ${asiento.clienteNombre}`;
    }
    
    switch (asiento.tipo) {
      case 'CONDUCTOR':
        return `Posto ${asiento.numeroAsiento} - Conducente`;
      case 'PREMIUM':
        return `Posto ${asiento.numeroAsiento} - Premium - Libero (€${tour?.precioAdulto})`;
      case 'DISCAPACITADO':
        return `Posto ${asiento.numeroAsiento} - Disabili - Libero (€${tour?.precioAdulto})`;
      default:
        return `Posto ${asiento.numeroAsiento} - Libero (€${tour?.precioAdulto})`;
    }
  };

  // Funciones para editar notas
  const startEditingNotas = useCallback((type: 'tour' | 'coordinador') => {
    setEditingNotas(prev => ({ ...prev, [type]: true }));
    const currentValue = type === 'tour' ? tour?.notas : tour?.notasCoordinador;
    setTempNotas(prev => ({
      ...prev,
      [type]: sanitizeEditorHtml(currentValue)
    }));
  }, [tour]);

  const saveNotas = useCallback(async (type: 'tour' | 'coordinador') => {
    if (!tour) return;
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('titulo', tour.titulo || '');
      formDataToSend.append('precioAdulto', tour.precioAdulto.toString() || '0');
      formDataToSend.append('precioNino', tour.precioNino.toString() || '0');
      formDataToSend.append('cantidadAsientos', tour.cantidadAsientos.toString() || '53');
      formDataToSend.append('fechaViaje', tour.fechaViaje ? new Date(tour.fechaViaje).toISOString().split('T')[0] : '');
      formDataToSend.append('fechaFin', '');
      formDataToSend.append('acc', tour.acc || '');
      formDataToSend.append('bus', tour.bus?.toString() || '');
      formDataToSend.append('pasti', tour.pasti?.toString() || '');
      formDataToSend.append('parking', tour.parking?.toString() || '');
      formDataToSend.append('coordinatore1', tour.coordinatore1?.toString() || '');
      formDataToSend.append('coordinatore2', tour.coordinatore2?.toString() || '');
      formDataToSend.append('ztl', tour.ztl?.toString() || '');
      formDataToSend.append('hotel', tour.hotel?.toString() || '');
      formDataToSend.append('polizza', tour.polizza?.toString() || '');
      formDataToSend.append('tkt', tour.tkt?.toString() || '');
      formDataToSend.append('autoservicio', tour.autoservicio || '');
      formDataToSend.append('descripcion', tour.descripcion || '');
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

      const response = await fetch(`/api/tour-bus/${tour.id}`, {
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
  }, [tour, tempNotas]);

  const cancelEditingNotas = useCallback((type: 'tour' | 'coordinador') => {
    setEditingNotas(prev => ({ ...prev, [type]: false }));
    setTempNotas(prev => ({
      ...prev,
      [type]: ''
    }));
  }, []);

  // Funciones para manejo de Documento Viaggio
  const handleDocumentoViaggioUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !tour) {
      event.target.value = '';
      return;
    }

    // Obtener archivos existentes
    const existingFiles = Array.isArray(tour.documentoViaggio) ? tour.documentoViaggio : [];
    const currentCount = existingFiles.length;
    const newFilesCount = files.length;
    const totalCount = currentCount + newFilesCount;

    // Validar máximo de 5 archivos
    if (totalCount > 5) {
      setMessage({
        type: 'error',
        text: `Massimo 5 file consentiti. Hai ${currentCount} file esistenti e stai cercando di aggiungere ${newFilesCount}.`
      });
      setTimeout(() => setMessage(null), 4000);
      event.target.value = '';
      return;
    }

    setIsUploadingDocumentoViaggio(true);

    try {
      const formDataToSend = new FormData();
      const formatDate = (value?: string | null) =>
        value ? new Date(value).toISOString().split('T')[0] : '';

      formDataToSend.append('titulo', tour.titulo || '');
      formDataToSend.append('precioAdulto', tour.precioAdulto != null ? tour.precioAdulto.toString() : '0');
      formDataToSend.append('precioNino', tour.precioNino != null ? tour.precioNino.toString() : '0');
      formDataToSend.append('fechaViaje', formatDate(tour.fechaViaje));
      formDataToSend.append('acc', tour.acc || '');
      formDataToSend.append('bus', tour.bus != null ? tour.bus.toString() : '0');
      formDataToSend.append('pasti', tour.pasti != null ? tour.pasti.toString() : '0');
      formDataToSend.append('parking', tour.parking != null ? tour.parking.toString() : '0');
      formDataToSend.append('coordinatore1', tour.coordinatore1 != null ? tour.coordinatore1.toString() : '0');
      formDataToSend.append('coordinatore2', tour.coordinatore2 != null ? tour.coordinatore2.toString() : '0');
      formDataToSend.append('ztl', tour.ztl != null ? tour.ztl.toString() : '0');
      formDataToSend.append('hotel', tour.hotel != null ? tour.hotel.toString() : '0');
      formDataToSend.append('polizza', tour.polizza != null ? tour.polizza.toString() : '0');
      formDataToSend.append('tkt', tour.tkt != null ? tour.tkt.toString() : '0');
      formDataToSend.append('autoservicio', tour.autoservicio || '');
      formDataToSend.append('notas', sanitizeEditorHtml(tour.notas));
      formDataToSend.append('notasCoordinador', sanitizeEditorHtml(tour.notasCoordinador));
      formDataToSend.append('descripcion', tour.descripcion || '');

      // Agregar archivos existentes (para preservarlos)
      if (existingFiles.length > 0) {
        formDataToSend.append('documentoViaggioExisting', JSON.stringify(existingFiles));
      }

      // Agregar nuevos archivos
      Array.from(files).forEach((file) => {
        formDataToSend.append('documentoViaggio', file);
      });

      const response = await fetch(`/api/tour-bus/${tour.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setTour(data.tour);
        setMessage({
          type: 'success',
          text: `${newFilesCount} file ${newFilesCount === 1 ? 'caricato' : 'caricati'} correttamente`
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        let errorText = 'Errore durante il caricamento del documento di viaggio';
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorText = errorData.error;
          }
        } catch (err) {
          // Error parsing response, usar mensaje por defecto
        }
        setMessage({ type: 'error', text: errorText });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Errore di connessione'
      });
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setIsUploadingDocumentoViaggio(false);
      event.target.value = '';
    }
  }, [tour]);

  // Función para eliminar un archivo del documento viaggio
  const handleDeleteDocumentoViaggio = useCallback(async (indexToDelete: number) => {
    if (!tour) return;

    const updatedFiles = tour.documentoViaggio?.filter((_, i) => i !== indexToDelete) || [];
    try {
      const formDataToSend = new FormData();
      const formatDate = (value?: string | null) =>
        value ? new Date(value).toISOString().split('T')[0] : '';

      formDataToSend.append('titulo', tour.titulo || '');
      formDataToSend.append('precioAdulto', tour.precioAdulto != null ? tour.precioAdulto.toString() : '0');
      formDataToSend.append('precioNino', tour.precioNino != null ? tour.precioNino.toString() : '0');
      formDataToSend.append('fechaViaje', formatDate(tour.fechaViaje));
      formDataToSend.append('acc', tour.acc || '');
      formDataToSend.append('bus', tour.bus != null ? tour.bus.toString() : '0');
      formDataToSend.append('pasti', tour.pasti != null ? tour.pasti.toString() : '0');
      formDataToSend.append('parking', tour.parking != null ? tour.parking.toString() : '0');
      formDataToSend.append('coordinatore1', tour.coordinatore1 != null ? tour.coordinatore1.toString() : '0');
      formDataToSend.append('coordinatore2', tour.coordinatore2 != null ? tour.coordinatore2.toString() : '0');
      formDataToSend.append('ztl', tour.ztl != null ? tour.ztl.toString() : '0');
      formDataToSend.append('hotel', tour.hotel != null ? tour.hotel.toString() : '0');
      formDataToSend.append('polizza', tour.polizza != null ? tour.polizza.toString() : '0');
      formDataToSend.append('tkt', tour.tkt != null ? tour.tkt.toString() : '0');
      formDataToSend.append('autoservicio', tour.autoservicio || '');
      formDataToSend.append('notas', sanitizeEditorHtml(tour.notas));
      formDataToSend.append('notasCoordinador', sanitizeEditorHtml(tour.notasCoordinador));
      formDataToSend.append('descripcion', tour.descripcion || '');
      formDataToSend.append('documentoViaggioExisting', JSON.stringify(updatedFiles));

      const response = await fetch(`/api/tour-bus/${tour.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (response.ok) {
        const data = await response.json();
        setTour(data.tour);
        setMessage({
          type: 'success',
          text: 'File eliminato correttamente'
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: 'Errore durante l\'eliminazione del file'
        });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Errore durante l\'eliminazione del file'
      });
      setTimeout(() => setMessage(null), 4000);
    }
  }, [tour]);

  // Función para obtener la fermata de un asiento
  const getFermataAsiento = (numeroAsiento: number) => {
    if (!tour || !tour.ventasTourBus) return '';
    
    // Buscar en ventas principales
    const ventaPrincipal = tour.ventasTourBus.find(v => v.numeroAsiento === numeroAsiento);
    if (ventaPrincipal) return ventaPrincipal.fermata;
    
    // Buscar en acompañantes
    for (const venta of tour.ventasTourBus) {
      const acomp = venta.acompanantes.find(a => a.numeroAsiento === numeroAsiento);
      if (acomp) return acomp.fermata;
    }
    
    return '';
  };
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }
  
  // Carga progresiva: Mostrar skeleton del layout de asientos mientras cargan los datos
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
        
        {/* Layout de bus skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-13 gap-2 max-w-4xl mx-auto">
            {Array.from({ length: 53 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ animationDelay: `${i * 10}ms` }}></div>
            ))}
          </div>
        </div>
        
        {/* Lista de ventas skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Verificar permisos de acceso
  if (!userRole || !['ADMIN', 'TI', 'USER'].includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Accesso Negato
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Solo gli utenti autorizzati possono accedere a questa sezione.
          </p>
          <button
            onClick={() => router.back()}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error || 'Tour no encontrado'}
          </h1>
          <button
            onClick={() => router.back()}
            className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botones de navegación flotantes */}
        <div className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
          <button
            onClick={() => scrollToSection(busLayoutRef)}
            className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-md shadow-md transition-all duration-200 hover:shadow-lg hover:scale-110 flex items-center justify-center"
            title="Ir a Bus"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
          
          <button
            onClick={() => scrollToSection(ventasListRef)}
            className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-md shadow-md transition-all duration-200 hover:shadow-lg hover:scale-110 flex items-center justify-center"
            title="Ir a Ventas"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          
          <button
            onClick={() => scrollToSection(pasajeroTableRef)}
            className="bg-purple-500 hover:bg-purple-600 text-white w-8 h-8 rounded-md shadow-md transition-all duration-200 hover:shadow-lg hover:scale-110 flex items-center justify-center"
            title="Ir a Polizza"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        </div>

        {/* Visualización del Bus */}
        <div ref={busLayoutRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          
          {/* Título del tour centrado */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {tour.titulo}
            </h1>
          </div>

          {/* Información del Tour - Estilo similar a TOUR AEREO */}
          <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="mdi:cash-multiple" width="22" height="22" style={{ color: '#2563eb' }} />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Prezzo adulto</span>
                </div>
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  €{tour.precioAdulto}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="mdi:cash-euro" width="22" height="22" style={{ color: '#047857' }} />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Prezzo bambino</span>
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  €{tour.precioNino}
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="mdi:account-group" width="20" height="20" style={{ color: '#4f46e5' }} />
                  <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Asientos</span>
                </div>
                <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                  {tour.cantidadAsientos}
                </div>
              </div>

              {tour.fechaViaje && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="mdi:calendar" width="20" height="20" style={{ color: '#ea580c' }} />
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Data Inizio</span>
                  </div>
                  <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                    {new Date(tour.fechaViaje).toLocaleDateString('it-IT')}
                  </div>
                </div>
              )}

              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="mdi:seat-passenger" width="20" height="20" style={{ color: '#047857' }} />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Disponibili</span>
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  {asientosDisponibles}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="mdi:seatbelt" width="20" height="20" style={{ color: '#dc2626' }} />
                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Venduti</span>
                </div>
                <div className="text-lg font-bold text-red-900 dark:text-red-100">
                  {asientosVendidos}
                </div>
              </div>

              {tour.acc && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="mdi:account-tie" width="20" height="20" style={{ color: '#4f46e5' }} />
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Coordinatore (ACC)</span>
                  </div>
                  <div className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                    {tour.acc}
                  </div>
                </div>
              )}

              {tour.hotel && (
                <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="mdi:hotel" width="20" height="20" style={{ color: '#db2777' }} />
                    <span className="text-xs font-medium text-pink-700 dark:text-pink-300">Hotel</span>
                  </div>
                  <div className="text-lg font-bold text-pink-900 dark:text-pink-100">
                    €{((tour?.hotel ?? 0)).toFixed(2)}
                  </div>
                </div>
              )}

              {tour.bus && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="mdi:bus-side" width="24" height="24" style={{ color: '#ca8a04' }} />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Bus</span>
                  </div>
                  <div className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                    €{((tour?.bus ?? 0)).toFixed(2)}
                  </div>
                </div>
              )}

              {tour.coordinatore1 && (
                <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="mdi:cash-sync" width="22" height="22" style={{ color: '#0891b2' }} />
                    <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Coordinatore 1</span>
                  </div>
                  <div className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                    €{((tour?.coordinatore1 ?? 0)).toFixed(2)}
                  </div>
                </div>
              )}

              {tour.coordinatore2 && (
                <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon icon="mdi:cash-sync" width="22" height="22" style={{ color: '#0891b2' }} />
                    <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Coordinatore 2</span>
                  </div>
                  <div className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                    €{((tour?.coordinatore2 ?? 0)).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Tarjeta de Documento Viaggio */}
              <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => setIsDocumentoViaggioModalOpen(true)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <Icon icon="mdi:file-document" width="20" height="20" style={{ color: '#0284c7' }} />
                      <span className="text-xs font-medium text-sky-700 dark:text-sky-300">Documento Viaggio</span>
                      {Array.isArray(tour.documentoViaggio) && tour.documentoViaggio.length > 0 && (
                        <span className="text-xs font-semibold text-white bg-sky-600 px-1.5 py-0.5 rounded">
                          {tour.documentoViaggio.length}/5
                        </span>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => documentoViaggioInputRef.current?.click()}
                    disabled={isUploadingDocumentoViaggio || (Array.isArray(tour.documentoViaggio) && tour.documentoViaggio.length >= 5)}
                    className="px-2 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isUploadingDocumentoViaggio ? 'Caricando...' : 'Aggiungi'}
                  </button>
                </div>
                <input
                  ref={documentoViaggioInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  multiple
                  className="hidden"
                  onChange={handleDocumentoViaggioUpload}
                />
              </div>
            </div>
            
            {/* Botón de Imprimir Layout del Bus */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => handlePrintBusLayout()}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                title="Imprimir layout del bus"
              >
                📄
              </button>
            </div>
          </div>

          {/* Tarjetas de Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="mdi:bus-side" width="20" height="20" style={{ color: '#475569' }} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Note del tour</span>
              </div>
              <div 
                className="text-sm text-slate-600 dark:text-slate-400 p-2 rounded transition-colors"
                onDoubleClick={() => startEditingNotas('tour')}
                title={expandedNotas.tour ? undefined : getNotePreview(tour.notas)}
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
                    if (!tour.notas) {
                      return (
                        <span className="text-sm text-slate-400 italic">
                          Doppio click per aggiungere note...
                        </span>
                      );
                    }

                    const plain = extractPlainText(tour.notas);
                    const content = expandedNotas.tour 
                      ? sanitizeEditorHtml(tour.notas) 
                      : getNotePreview(tour.notas);

                    // Solo usar dangerouslySetInnerHTML si hay HTML real
                    const hasHtml = /<[^>]+>/.test(tour.notas);

                    return (
                      <div className="leading-relaxed space-y-1">
                        {expandedNotas.tour && hasHtml ? (
                          <div 
                            key={`tour-notas-${tour.id}-${tour.notas.length}`}
                            dangerouslySetInnerHTML={{ __html: sanitizeEditorHtml(tour.notas) }} 
                            suppressHydrationWarning
                          />
                        ) : (
                          <div>{content}</div>
                        )}
                      </div>
                    );
                  })()
                )}
                {!editingNotas.tour && tour.notas && extractPlainText(tour.notas).length > 280 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedNotas(prev => ({ ...prev, tour: !prev.tour }));
                    }}
                    className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    {expandedNotas.tour ? 'Mostra meno' : 'Leggi di più'}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="mdi:bus-side" width="20" height="20" style={{ color: '#d97706' }} />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Note del coordinatore</span>
              </div>
              <div 
                className="text-sm text-amber-700 dark:text-amber-300 p-2 rounded transition-colors"
                onDoubleClick={() => startEditingNotas('coordinador')}
                title={expandedNotas.coordinador ? undefined : getNotePreview(tour.notasCoordinador)}
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
                        if (!tour.notasCoordinador) {
                          return (
                            <span className="text-sm text-amber-400 italic">
                              Doppio click per aggiungere note...
                            </span>
                          );
                        }

                        const content = expandedNotas.coordinador
                          ? sanitizeEditorHtml(tour.notasCoordinador)
                          : getNotePreview(tour.notasCoordinador);

                        // Solo usar dangerouslySetInnerHTML si hay HTML real
                        const hasHtml = /<[^>]+>/.test(tour.notasCoordinador);

                        return (
                          <div className="leading-relaxed space-y-1">
                            {expandedNotas.coordinador && hasHtml ? (
                              <div 
                                key={`coordinador-notas-${tour.id}-${tour.notasCoordinador.length}`}
                                dangerouslySetInnerHTML={{ __html: sanitizeEditorHtml(tour.notasCoordinador) }} 
                                suppressHydrationWarning
                              />
                            ) : (
                              <div>{content}</div>
                            )}
                          </div>
                        );
                      })()
                    )}
                {!editingNotas.coordinador && tour.notasCoordinador && extractPlainText(tour.notasCoordinador).length > 280 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedNotas(prev => ({ ...prev, coordinador: !prev.coordinador }));
                    }}
                    className="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    {expandedNotas.coordinador ? 'Mostra meno' : 'Leggi di più'}
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Leyenda */}
          <div className="flex justify-center mb-6">
            <div className="flex gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#e1e1e1' }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Libero</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f8ee7d' }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Acconto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#76df76' }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Pagato</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ffa350' }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Prenotato</span>
              </div>
            </div>
          </div>

          {/* Botón Generar Venta */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setIsVentaModalOpen(true)}
              className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Generar Venta
            </button>
          </div>

            {/* PIANTINA PULLMAN - Diseño Limpio y Funcional */}
            <div className="max-w-7xl mx-auto">
              <div className="bg-blue-100 p-6 rounded-xl border-2 border-blue-200">
                {/* Título del Bus */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-blue-800 uppercase tracking-wide">PIANTINA PULLMAN</h3>
                </div>
                
                {/* Layout del Bus con Listas de Pasajeros */}
                <div className="flex gap-6">
                  {/* Lista de Pasajeros Izquierda */}
                  <div className="w-80 bg-gray-800 text-white p-4 rounded-lg">
                    <h4 className="text-lg font-bold mb-4 text-center">Pasajeros - Lado Izquierdo</h4>
                    <div className="space-y-1 text-sm">
                      {tour.asientos
                        .filter(a => [1, 2, 5, 6, 9, 10, 13, 14, 17, 18, 21, 22, 25, 26, 27, 28, 31, 32, 35, 36, 39, 40, 43, 44, 49, 50, 51].includes(a.numeroAsiento))
                        .sort((a, b) => a.numeroAsiento - b.numeroAsiento)
                        .map(asiento => (
                          <div key={asiento.id} className="flex justify-between items-center py-1 border-b border-gray-600">
                            <div className="flex-1">
                              <span className="font-mono text-xs text-gray-300">
                                {asiento.numeroAsiento.toString().padStart(2, '0')}-
                              </span>
                              <span className="text-xs">
                                {asiento.isVendido ? `${asiento.clienteNombre} ${getFermataAsiento(asiento.numeroAsiento) ? `(${getFermataAsiento(asiento.numeroAsiento)})` : ''}` : 'Libre'}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Layout del Bus - Diseño Limpio */}
                  <div className="flex-1 bg-white rounded-lg p-6 shadow-inner border border-gray-200">
                    <div className="bg-blue-100 rounded-lg p-4 mx-auto" style={{ width: 'fit-content', maxWidth: '480px' }}>
                      {/* Fila Superior - Conductor, Guía y Puerta */}
                      <div className="flex justify-center items-start gap-8 mb-4">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-400 rounded border-2 border-gray-600 flex items-center justify-center text-white font-bold text-sm">
                            A
                          </div>
                          <div className="text-xs text-center mt-1 text-gray-600">Autista</div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-400 rounded border-2 border-gray-600 flex items-center justify-center text-white font-bold text-sm">
                            G
                          </div>
                          <div className="text-xs text-center mt-1 text-gray-600">Guida</div>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-500 rounded border-2 border-gray-700 flex items-center justify-center">
                            <div className="text-white text-sm">🚪</div>
                          </div>
                          <div className="text-xs text-center mt-1 text-gray-600">Puerta</div>
                        </div>
                      </div>

                      {/* Asientos 1-24 - Filas Regulares */}
                      {[1, 5, 9, 13, 17, 21].map((inicioFila) => (
                        <div key={inicioFila} className="flex justify-center items-center gap-4 mb-3">
                          {/* Asientos izquierdos */}
                          <div className="flex gap-2">
                            {tour.asientos.find(a => a.numeroAsiento === inicioFila) && (
                              <div
                                className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                                style={{ 
                                  backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === inicioFila)!),
                                  borderColor: '#3b82f6'
                                }}
                                title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === inicioFila)!)}
                              >
                                {inicioFila}
                              </div>
                            )}
                            {tour.asientos.find(a => a.numeroAsiento === inicioFila + 1) && (
                              <div
                                className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                                style={{ 
                                  backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === inicioFila + 1)!),
                                  borderColor: '#3b82f6'
                                }}
                                title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === inicioFila + 1)!)}
                              >
                                {inicioFila + 1}
                              </div>
                            )}
                          </div>
                          
                          {/* Pasillo */}
                          <div className="w-8"></div>
                          
                          {/* Asientos derechos */}
                          <div className="flex gap-2">
                            {tour.asientos.find(a => a.numeroAsiento === inicioFila + 2) && (
                              <div
                                className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                                style={{ 
                                  backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === inicioFila + 2)!),
                                  borderColor: '#3b82f6'
                                }}
                                title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === inicioFila + 2)!)}
                              >
                                {inicioFila + 2}
                              </div>
                            )}
                            {tour.asientos.find(a => a.numeroAsiento === inicioFila + 3) && (
                              <div
                                className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                                style={{ 
                                  backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === inicioFila + 3)!),
                                  borderColor: '#3b82f6'
                                }}
                                title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === inicioFila + 3)!)}
                              >
                                {inicioFila + 3}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Puerta Central */}
                      <div className="flex justify-end mb-3">
                        <div className="w-24 h-12 bg-gray-500 rounded border-2 border-gray-700 flex items-center justify-center">
                          <div className="text-white text-sm font-bold">🚪 PUERTA</div>
                        </div>
                      </div>

                      {/* Asientos 25-48 - Filas Traseras */}
                      {[25, 29, 33, 37, 41, 45].map((inicioFila) => (
                        <div key={inicioFila} className="flex justify-center items-center gap-4 mb-3">
                          {/* Asientos izquierdos */}
                          <div className="flex gap-2">
                            {tour.asientos.find(a => a.numeroAsiento === inicioFila) && (
                              <div
                                className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                                style={{ 
                                  backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === inicioFila)!),
                                  borderColor: '#3b82f6'
                                }}
                                title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === inicioFila)!)}
                              >
                                {inicioFila}
                              </div>
                            )}
                            {tour.asientos.find(a => a.numeroAsiento === inicioFila + 1) && (
                              <div
                                className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                                style={{ 
                                  backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === inicioFila + 1)!),
                                  borderColor: '#3b82f6'
                                }}
                                title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === inicioFila + 1)!)}
                              >
                                {inicioFila + 1}
                              </div>
                            )}
                          </div>
                          
                          {/* Pasillo */}
                          <div className="w-8"></div>
                          
                          {/* Asientos derechos */}
                          <div className="flex gap-2">
                            {tour.asientos.find(a => a.numeroAsiento === inicioFila + 2) && (
                              <div
                                className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                                style={{ 
                                  backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === inicioFila + 2)!),
                                  borderColor: '#3b82f6'
                                }}
                                title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === inicioFila + 2)!)}
                              >
                                {inicioFila + 2}
                              </div>
                            )}
                            {tour.asientos.find(a => a.numeroAsiento === inicioFila + 3) && (
                              <div
                                className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                                style={{ 
                                  backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === inicioFila + 3)!),
                                  borderColor: '#3b82f6'
                                }}
                                title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === inicioFila + 3)!)}
                              >
                                {inicioFila + 3}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Fila Trasera - Asientos 49-53 - Patrón correcto */}
                      <div className="flex justify-center items-center gap-4 mb-3">
                        {/* Asientos izquierdos */}
                        <div className="flex gap-2">
                          {tour.asientos.find(a => a.numeroAsiento === 49) && (
                            <div
                              className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                              style={{ 
                                backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === 49)!),
                                borderColor: '#3b82f6'
                              }}
                              title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === 49)!)}
                            >
                              49
                            </div>
                          )}
                          {tour.asientos.find(a => a.numeroAsiento === 50) && (
                            <div
                              className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                              style={{ 
                                backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === 50)!),
                                borderColor: '#3b82f6'
                              }}
                              title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === 50)!)}
                            >
                              50
                            </div>
                          )}
                        </div>
                        
                        {/* Asiento 51 (nivel del pasillo) */}
                        {tour.asientos.find(a => a.numeroAsiento === 51) && (
                          <div
                            className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                            style={{ 
                              backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === 51)!),
                              borderColor: '#3b82f6'
                            }}
                            title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === 51)!)}
                          >
                            51
                          </div>
                        )}
                        
                        {/* Asientos derechos */}
                        <div className="flex gap-2">
                          {tour.asientos.find(a => a.numeroAsiento === 52) && (
                            <div
                              className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                              style={{ 
                                backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === 52)!),
                                borderColor: '#3b82f6'
                              }}
                              title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === 52)!)}
                            >
                              52
                            </div>
                          )}
                          {tour.asientos.find(a => a.numeroAsiento === 53) && (
                            <div
                              className="w-12 h-12 rounded border-2 flex items-center justify-center font-bold text-sm cursor-pointer hover:scale-105"
                              style={{ 
                                backgroundColor: getSeatBackgroundColor(tour.asientos.find(a => a.numeroAsiento === 53)!),
                                borderColor: '#3b82f6'
                              }}
                              title={getSeatTitle(tour.asientos.find(a => a.numeroAsiento === 53)!)}
                            >
                              53
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Pasajeros Derecha */}
                  <div className="w-80 bg-gray-800 text-white p-4 rounded-lg">
                    <h4 className="text-lg font-bold mb-4 text-center">Pasajeros - Lado Derecho</h4>
                    <div className="space-y-1 text-sm">
                      {tour.asientos
                        .filter(a => [3, 4, 7, 8, 11, 12, 15, 16, 19, 20, 23, 24, 29, 30, 33, 34, 37, 38, 41, 42, 45, 46, 47, 48, 52, 53].includes(a.numeroAsiento))
                        .sort((a, b) => a.numeroAsiento - b.numeroAsiento)
                        .map(asiento => (
                          <div key={asiento.id} className="flex justify-between items-center py-1 border-b border-gray-600">
                            <div className="flex-1">
                              <span className="font-mono text-xs text-gray-300">
                                {asiento.numeroAsiento.toString().padStart(2, '0')}-
                              </span>
                              <span className="text-xs">
                                {asiento.isVendido ? `${asiento.clienteNombre} ${getFermataAsiento(asiento.numeroAsiento) ? `(${getFermataAsiento(asiento.numeroAsiento)})` : ''}` : 'Libre'}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

        {/* Tabla de Costos y Finanzas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mt-8 w-full">
          {/* Controles de búsqueda y filtros */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Controles de paginación y exportación */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300">Mostrar:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Botón de exportar */}
                <button
                  onClick={handleExportToExcel}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Exportar Excel
                </button>
              </div>

              {/* Barra de búsqueda */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar en tabla..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0366D6] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    DESTINAZIONE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    AUTOSERVIZIO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    BUS
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    PASTI
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    PARKING
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    TC.1
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    TC.2
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    ZTL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    HOTEL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    POLIZZA
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    TKT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    SPESA TOTALE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    RICAVO TOTALE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    FEE TOTALE
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    AGENTE
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {tour.titulo}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {tour.autoservicio || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{(tour.bus || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{(tour.pasti || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{(tour.parking || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{(tour.coordinatore1 || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{(tour.coordinatore2 || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{(tour.ztl || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{(tour.hotel || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{(tour.polizza || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    €{(tour.tkt || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                    €{(
                      (tour.bus || 0) + 
                      (tour.pasti || 0) + 
                      (tour.parking || 0) + 
                      (tour.coordinatore1 || 0) + 
                      (tour.coordinatore2 || 0) + 
                      (tour.ztl || 0) + 
                      (tour.hotel || 0) + 
                      (tour.polizza || 0) + 
                      (tour.tkt || 0)
                    ).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                    €{totalIngresos.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                    €{feeTotal.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {agentesTexto}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Lista de Ventas - Tabla Ampliada */}
        {tour.ventasTourBus && tour.ventasTourBus.length > 0 && (
          <div ref={ventasListRef} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mt-8 w-full">
            <div className="bg-[#0366D6] text-white px-4 py-3 rounded-t-lg mb-0">
              <h2 className="text-lg font-semibold text-center">
                INFORMAZIONI SUI PASSEGGERI
              </h2>
            </div>

            {/* Estadísticas Generales */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-between items-start">
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Totale posti: {tour.cantidadAsientos}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Posti occupati: {asientosVendidos}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Posti disponibili: {asientosDisponibles}</div>
                  </div>
                  
                  <div className="space-y-1">
                    {Object.entries(fermateStats).map(([fermata, count]) => (
                      <div key={fermata} className="text-sm font-medium text-gray-900 dark:text-white">
                        {fermata}: {count}
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Total Pets: {totalPets}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Total Infantes: {totalInfantes}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Totale Adulti: {totalAdultos}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Totale Bambini: {totalNinos}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botón de Imprimir Lista Completa */}
              <div className="ml-4">
                <button
                  onClick={() => handlePrintListaCompleta()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
                  title="Imprimir lista completa del bus"
                >
                  📄
                </button>
              </div>
            </div>

            {/* Lista de Grupos de Pasajeros - Tabla Ampliada */}
            <div className="bg-white dark:bg-gray-800 overflow-x-auto rounded-lg">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">Asiento</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-64">Pasajero</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">Tipo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-64">Pagos</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">Fermata</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">Agente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">Teléfono</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {processedVentas.map(({ venta, totalAdultos, totalNinos, agenteNombre }) => (
                    <React.Fragment key={venta.id}>
                        {/* Cliente Principal (Capo Gruppo) */}
                        <tr className="bg-blue-100 dark:bg-blue-800/40">
                          <td className="px-4 py-2">
                            <button className="bg-orange-500 text-white px-2 py-1 rounded font-semibold text-center text-xs">
                              {venta.numeroAsiento}
                            </button>
                          </td>
                          <td className="px-4 py-2">
                            <div>
                              <div className="text-blue-800 dark:text-blue-200 font-medium text-base cursor-pointer hover:underline">
                                {venta.clienteNombre}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Adultos: {totalAdultos} | Niños: {totalNinos}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100">
                              Capo Gruppo
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              <div className="bg-blue-500 text-white px-2 py-1 rounded text-[10px] text-center font-medium flex-1">
                                Total: €{venta.totalAPagar.toFixed(0)}
                              </div>
                              <div className="bg-green-500 text-white px-2 py-1 rounded text-[10px] text-center font-medium flex-1">
                                Pagos: €{venta.acconto.toFixed(0)}
                              </div>
                              <div className="bg-orange-500 text-white px-2 py-1 rounded text-[10px] text-center font-medium flex-1">
                                Saldo: €{venta.daPagare.toFixed(0)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 px-3 py-1.5 rounded text-center font-medium text-xs">
                              {venta.fermata}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 px-3 py-1.5 rounded text-center font-medium text-xs">
                              {agenteNombre}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 px-3 py-1.5 rounded text-center text-xs font-medium">
                              {venta.numeroTelefono}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleGenerateRicevuta(venta.id)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors text-xs"
                                title="Ricevuta"
                              >
                                📄
                              </button>
                              <button
                                onClick={() => handleEditVenta(venta)}
                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors text-xs"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteVenta(venta.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors text-xs"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Acompañantes */}
                        {venta.acompanantes.map((acomp) => (
                          <tr key={acomp.id} className="bg-green-50 dark:bg-green-900/20">
                            <td className="px-4 py-2 pl-8">
                              <button className="bg-orange-500 text-white px-2 py-1 rounded font-semibold text-center text-xs">
                                {acomp.numeroAsiento}
                              </button>
                            </td>
                            <td className="px-4 py-2">
                              <div>
                                <div className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                                  {acomp.nombreCompleto}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                acomp.esAdulto 
                                  ? 'bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100' 
                                  : 'bg-yellow-200 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100'
                              }`}>
                                {acomp.esAdulto ? 'Adulto' : 'Niño'}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">-</span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 px-3 py-1.5 rounded text-center font-medium text-xs">
                                {acomp.fermata}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">-</span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 px-3 py-1.5 rounded text-center text-xs font-medium">
                                {acomp.telefono || 'N/A'}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">-</span>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                  
                  {/* Fila de Totales */}
                  <tr className="bg-gray-100 dark:bg-gray-600 border-t-2 border-gray-400">
                    <td className="px-4 py-2" colSpan={2}>
                      <div className="font-bold text-gray-900 dark:text-white">
                        TOTALES
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {/* Columna TIPO vacía */}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <div className="bg-blue-500 text-white px-2 py-1 rounded text-center font-bold text-xs flex-1">
                          Total: €{totalGeneral.toFixed(2)}
                        </div>
                        <div className="bg-green-500 text-white px-2 py-1 rounded text-center font-bold text-xs flex-1">
                          Pagos: €{totalPagos.toFixed(2)}
                        </div>
                        <div className="bg-orange-500 text-white px-2 py-1 rounded text-center font-bold text-xs flex-1">
                          Saldo: €{totalSaldo.toFixed(2)}
                        </div>
                        <div className="bg-purple-500 text-white px-2 py-1 rounded text-center font-bold text-xs flex-1">
                          Costos: €{totalCostos.toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2" colSpan={3}>
                      {/* Columnas FERMATA, AGENTE, TELÉFONO, EDITAR vacías */}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sección de Lista de Pasajeros */}
        {tour && tour.ventasTourBus.length > 0 && (
          <div ref={pasajeroTableRef} className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Lista de Pasajeros
                  </h3>
                  <button
                    onClick={handleExportPassengers}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    📊 Exportar Excel
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Cognome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        DNI EXTRANJERO
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Codice Fiscale
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {passengers.map((passenger, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {passenger.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {passenger.cognome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          DNI EXTRANJERO
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {passenger.codiceFiscale || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición de Venta */}
      {isEditModalOpen && editingVenta && tour && (
        <EditVentaForm
          venta={editingVenta as any}
          tourTitulo={tour.titulo}
          precioAdulto={tour.precioAdulto}
          precioNino={tour.precioNino}
          asientosDisponibles={numerosAsientosDisponibles}
          clients={referenceData.clients}
          fermate={referenceData.fermate}
          metodosPagamento={referenceData.metodosPagamento}
          stati={referenceData.stati}
          onSubmit={handleUpdateVenta}
          onCancel={handleCloseEditModal}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Modal de Venta */}
      <Modal isOpen={isVentaModalOpen} onClose={() => setIsVentaModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Generar Venta - {tour?.titulo}
          </h2>
          
          {tour && (
            <VentaForm
              tourId={tour.id}
              tourTitulo={tour.titulo}
              precioAdulto={tour.precioAdulto}
              precioNino={tour.precioNino}
              asientosDisponibles={numerosAsientosDisponibles}
              clients={referenceData.clients}
              fermate={referenceData.fermate}
              metodosPagamento={referenceData.metodosPagamento}
              stati={referenceData.stati}
              onSubmit={handleVentaSubmit}
              onCancel={() => setIsVentaModalOpen(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </Modal>

      {/* Modal de Documento Viaggio */}
      <Modal
        isOpen={isDocumentoViaggioModalOpen}
        onClose={() => setIsDocumentoViaggioModalOpen(false)}
        className="max-w-2xl mx-4"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Documenti Viaggio
            </h2>
            <button
              onClick={() => setIsDocumentoViaggioModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          {Array.isArray(tour?.documentoViaggio) && tour.documentoViaggio.length > 0 ? (
            <div className="space-y-3">
              {tour.documentoViaggio.map((doc, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon icon="mdi:file-document" width="24" height="24" style={{ color: '#0284c7' }} />
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm font-medium text-sky-700 dark:text-sky-200 hover:text-sky-900 dark:hover:text-sky-100 underline truncate"
                      title={doc.name || `Documento ${index + 1}`}
                    >
                      {doc.name || `Documento ${index + 1}`}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDocumentoViaggio(index)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Elimina file"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center mb-3">
                <Icon icon="mdi:file-document-outline" width="48" height="48" style={{ color: '#9ca3af' }} />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                Nessun documento caricato
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Massimo 5 file consentiti
              </p>
            </div>
          )}

          {/* Botón para agregar archivos */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => documentoViaggioInputRef.current?.click()}
              disabled={isUploadingDocumentoViaggio || (Array.isArray(tour.documentoViaggio) && tour.documentoViaggio.length >= 5)}
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Icon icon="mdi:plus" width="20" height="20" />
              {isUploadingDocumentoViaggio ? 'Caricando...' : 'Aggiungi'}
            </button>
          </div>
        </div>
      </Modal>

      <CopyNotification 
        show={showNotification} 
        onHide={() => setShowNotification(false)} 
      />

      {/* Mensaje de notificación para notas */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          <p>{message.text}</p>
        </div>
      )}
      </div>
    </div>
  );
}