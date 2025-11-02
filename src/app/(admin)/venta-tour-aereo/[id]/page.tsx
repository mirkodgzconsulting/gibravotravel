"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { CopyNotification } from "@/components/ui/notification/CopyNotification";
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

interface VentaFormData {
  clienteId: string;
  pasajero: string;
  codiceFiscale: string;
  indirizzo: string;
  email: string;
  numeroTelefono: string;
  paisOrigen: string;
  iata: string;
  pnr: string;
  hotel: string;
  transfer: string;
  venduto: string;
  acconto: string;
  metodoPagamento: string;
  metodoCompra: string;
  stato: string;
  cuotas: CuotaVenta[];
}

export default function VentaTourAereoPage() {
  const params = useParams();
  const tourId = params.id as string;
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { isOpen: isModalOpen, openModal, closeModal } = useModal();
  
  const [tour, setTour] = useState<TourAereo | null>(null);
  const [ventas, setVentas] = useState<VentaTourAereo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [iatas, setIatas] = useState<IATA[]>([]);
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamento[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [viewingFiles, setViewingFiles] = useState<VentaTourAereo | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

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
    iata: "",
    pnr: "",
    hotel: "",
    transfer: "",
    venduto: "",
    acconto: "",
    metodoPagamento: "",
    metodoCompra: "",
    stato: "",
    cuotas: []
  });

  // Estado para el tipo de pasajero (adulto/nino)
  const [tipoPasajero, setTipoPasajero] = useState<'adulto' | 'nino' | null>(null);

  // Función para manejar el cambio de tipo de pasajero
  const handleTipoPasajeroChange = (tipo: 'adulto' | 'nino') => {
    setTipoPasajero(tipo);
    
    // Actualizar el campo venduto automáticamente
    if (tipo === 'adulto' && tour?.precioAdulto) {
      setFormData(prev => ({ ...prev, venduto: tour.precioAdulto.toString() }));
    } else if (tipo === 'nino' && tour?.precioNino) {
      setFormData(prev => ({ ...prev, venduto: tour.precioNino.toString() }));
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);


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
      fetchClientes();
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

  const fetchVentas = async () => {
    try {
      const response = await fetch(`/api/tour-aereo/${tourId}/ventas`);
      if (response.ok) {
        const data = await response.json();
        setVentas(data.ventas);
      }
    } catch (error) {
      console.error('Error fetching ventas:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setClientes(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clientes:', error);
      setClientes([]);
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

  const handleClienteChange = (clienteId: string) => {
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
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validar que se haya seleccionado un tipo de pasajero
    if (!tipoPasajero) {
      setMessage({ type: 'error', text: 'Debe seleccionar el tipo de pasajero (Adulto o Niño)' });
      return;
    }

    setIsSubmitting(true);
    try {
      
      // Preparar FormData para enviar archivos
      const formDataToSend = new FormData();
      
      // Agregar todos los campos del formulario (excepto cuotas que se maneja por separado)
      Object.keys(formData).forEach(key => {
        if (key !== 'cuotas') { // Excluir cuotas del formData porque se maneja por separado
          formDataToSend.append(key, (formData as any)[key]);
        }
      });
      
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
          iata: "",
          pnr: "",
          hotel: "",
          transfer: "",
          venduto: "",
          acconto: "",
          metodoPagamento: "",
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
        setError(errorData.error || 'Error al crear venta');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVenta = async (ventaId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) return;

    try {
      const response = await fetch(`/api/tour-aereo/ventas/${ventaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVentas(prev => prev.filter(venta => venta.id !== ventaId));
        setMessage({
          type: 'success',
          text: 'Venta eliminada correctamente'
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar venta');
      }
    } catch (error) {
      setError('Error de conexión');
    }
  };

  const handleEditVenta = (venta: VentaTourAereo) => {
    setEditingVenta(venta);
    const cuotasExistentes = venta.cuotas || [];
    
    setFormData({
      clienteId: "",
      pasajero: venta.pasajero,
      codiceFiscale: venta.codiceFiscale,
      indirizzo: venta.indirizzo,
      email: venta.email,
      numeroTelefono: venta.numeroTelefono,
      paisOrigen: venta.paisOrigen,
      iata: venta.iata,
      pnr: venta.pnr || "",
      hotel: venta.hotel?.toString() || "",
      transfer: venta.transfer?.toString() || "",
      venduto: venta.venduto.toString(),
      acconto: venta.acconto.toString(),
      metodoPagamento: venta.metodoPagamento,
      metodoCompra: venta.metodoCompra || "",
      stato: venta.stato,
      cuotas: cuotasExistentes
    });
    
    // Manejar cuotas
    if (cuotasExistentes.length > 0) {
      setIsLoadingCuotas(true);
      cuotasInicializadas.current = false;
      
      setTimeout(() => {
        setNumeroCuotas(cuotasExistentes.length);
        
        const cuotasFormato = cuotasExistentes.map(cuota => ({
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
    
    setIsEditModalOpen(true);
  };

  const handleUpdateVenta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting || !editingVenta) return;

    setIsSubmitting(true);
    try {
      // Preparar FormData para enviar archivos
      const formDataToSend = new FormData();
      
      // Agregar todos los campos del formulario
      Object.keys(formData).forEach(key => {
        if (key !== 'cuotas') {
          formDataToSend.append(key, (formData as any)[key]);
        }
      });
      
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
        setVentas(prev => prev.map(v => v.id === editingVenta.id ? data.venta : v));
        setFormData({
          clienteId: "",
          pasajero: "",
          codiceFiscale: "",
          indirizzo: "",
          email: "",
          numeroTelefono: "",
          paisOrigen: "",
          iata: "",
          pnr: "",
          hotel: "",
          transfer: "",
          venduto: "",
          acconto: "",
          metodoPagamento: "",
          metodoCompra: "",
          stato: "",
          cuotas: []
        });
        setIsEditModalOpen(false);
        setEditingVenta(null);
        setAttachedFile(null);
        setNumeroCuotas(0);
        setCuotas([]);
        setMessage({
          type: 'success',
          text: 'Venta actualizada correctamente'
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar venta');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
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
      iata: "",
      pnr: "",
      hotel: "",
      transfer: "",
      venduto: "",
      acconto: "",
      metodoPagamento: "",
      metodoCompra: "",
      stato: "",
      cuotas: []
    });
  };

  // Funciones para manejar la edición inline de Método de Compra
  const startEditingMetodoCompra = (venta: VentaTourAereo) => {
    setEditingMetodoCompraId(venta.id);
    setTempMetodoCompra(venta.metodoCompra || '');
  };

  const saveMetodoCompra = async (ventaId: string) => {
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
  };

  const cancelEditingMetodoCompra = () => {
    setEditingMetodoCompraId(null);
    setTempMetodoCompra('');
  };

  // Funciones para manejar cuotas
  const addCuota = () => {
    if (cuotas.length < 3) {
      const nuevaCuota: CuotaVenta = {
        numeroCuota: cuotas.length + 1,
        fechaPago: "",
        monto: 0,
        nota: "",
        estado: "Pendiente",
        attachedFile: null
      };
      setCuotas(prev => [...prev, nuevaCuota]);
      setNumeroCuotas(prev => prev + 1);
    }
  };

  const removeCuota = (index: number) => {
    setCuotas(prev => prev.filter((_, i) => i !== index).map((cuota, i) => ({
      ...cuota,
      numeroCuota: i + 1
    })));
    setNumeroCuotas(prev => prev - 1);
  };

  const updateCuota = (index: number, field: string, value: string | number | File | null) => {
    setCuotas(prev => prev.map((cuota, i) => 
      i === index ? { ...cuota, [field]: value } : cuota
    ));
  };

  // Funciones para editar notas
  const startEditingNotas = (type: 'tour' | 'coordinador') => {
    setEditingNotas(prev => ({ ...prev, [type]: true }));
    setTempNotas(prev => ({
      ...prev,
      [type]: type === 'tour' ? (tour?.notas || '') : (tour?.notasCoordinador || '')
    }));
  };

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

  const cancelEditingNotas = (type: 'tour' | 'coordinador') => {
    setEditingNotas(prev => ({ ...prev, [type]: false }));
    setTempNotas(prev => ({
      ...prev,
      [type]: ''
    }));
  };

  // Funciones para manejar archivos
  const handleViewFiles = (venta: VentaTourAereo) => {
    setViewingFiles(venta);
    setIsFileViewerOpen(true);
  };

  const handleDownload = async (url: string, filename: string) => {
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
  };

  const countFiles = (venta: VentaTourAereo) => {
    let count = 0;
    if (venta.attachedFile) count++;
    if (venta.cuotas) {
      count += venta.cuotas.filter(c => c.attachedFile).length;
    }
    return count;
  };

  const handleClientClick = async (venta: VentaTourAereo) => {
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
  };

  // Calcular estadísticas
  const ventasRealizadas = ventas.length;
  const meta = tour?.meta || 0;
  const porcentajeVendido = meta > 0 ? Math.round((ventasRealizadas / meta) * 100) : 0;
  const ingresos = ventas.reduce((sum, venta) => sum + venta.venduto, 0);

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


      {/* Modal para crear venta */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className="max-w-2xl mx-4 max-h-[90vh] z-[99999]"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header fijo */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Generar Nueva Venta
            </h2>
          </div>
          
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pasajero *
                  </label>
                  <select
                    value={formData.clienteId}
                    onChange={(e) => handleClienteChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar pasajero...</option>
                    {clientes && clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.firstName} {cliente.lastName}
                      </option>
                    ))}
                  </select>
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
                    Codice Fiscale *
                  </label>
                  <input
                    type="text"
                    value={formData.codiceFiscale}
                    onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    País de origen *
                  </label>
                  <input
                    type="text"
                    value={formData.paisOrigen}
                    onChange={(e) => setFormData(prev => ({ ...prev, paisOrigen: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IATA *
                  </label>
                  <select
                    value={formData.iata}
                    onChange={(e) => setFormData(prev => ({ ...prev, iata: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar IATA...</option>
                    {iatas && iatas.map((iata) => (
                      <option key={iata.id} value={iata.iata}>
                        {iata.iata}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PNR
                  </label>
                  <input
                    type="text"
                    value={formData.pnr}
                    onChange={(e) => setFormData(prev => ({ ...prev, pnr: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hotel
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hotel}
                    onChange={(e) => setFormData(prev => ({ ...prev, hotel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transfer
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.transfer}
                    onChange={(e) => setFormData(prev => ({ ...prev, transfer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venduto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.venduto}
                    onChange={(e) => setFormData(prev => ({ ...prev, venduto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Acconto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.acconto}
                    onChange={(e) => setFormData(prev => ({ ...prev, acconto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Da pagare
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={(parseFloat(formData.venduto || '0') - parseFloat(formData.acconto || '0')).toFixed(2)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>

              </div>

              {/* Sección de Cuotas - Se muestra automáticamente si Da Pagare > 0 */}
              {(parseFloat(formData.venduto || '0') - parseFloat(formData.acconto || '0')) > 0 && (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pagamento *
                  </label>
                  <select
                    value={formData.metodoPagamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, metodoPagamento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar método...</option>
                    {metodosPagamento && metodosPagamento.map((metodo) => (
                      <option key={metodo.id} value={metodo.metodoPagamento}>
                        {metodo.metodoPagamento}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metodo di Acquisto
                  </label>
                  <input
                    type="text"
                    value={formData.metodoCompra}
                    onChange={(e) => setFormData(prev => ({ ...prev, metodoCompra: e.target.value }))}
                    placeholder="Ej: Online, Agencia, Directo..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stato *
                  </label>
                  <select
                    value={formData.stato}
                    onChange={(e) => setFormData(prev => ({ ...prev, stato: e.target.value }))}
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
                  {isSubmitting ? 'Guardando...' : 'Generar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* Modal para editar venta */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCancelEdit}
        className="max-w-2xl mx-4 max-h-[90vh] z-[99999]"
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header fijo */}
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Editar Venta
            </h2>
          </div>
          
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto p-4">
            <form onSubmit={handleUpdateVenta} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pasajero *
                  </label>
                  <input
                    type="text"
                    value={formData.pasajero}
                    onChange={(e) => setFormData(prev => ({ ...prev, pasajero: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Codice Fiscale *
                  </label>
                  <input
                    type="text"
                    value={formData.codiceFiscale}
                    onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    País de origen *
                  </label>
                  <input
                    type="text"
                    value={formData.paisOrigen}
                    onChange={(e) => setFormData(prev => ({ ...prev, paisOrigen: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    IATA *
                  </label>
                  <select
                    value={formData.iata}
                    onChange={(e) => setFormData(prev => ({ ...prev, iata: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar IATA...</option>
                    {iatas && iatas.map((iata) => (
                      <option key={iata.id} value={iata.iata}>
                        {iata.iata}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PNR
                  </label>
                  <input
                    type="text"
                    value={formData.pnr}
                    onChange={(e) => setFormData(prev => ({ ...prev, pnr: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hotel
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hotel}
                    onChange={(e) => setFormData(prev => ({ ...prev, hotel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transfer
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.transfer}
                    onChange={(e) => setFormData(prev => ({ ...prev, transfer: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venduto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.venduto}
                    onChange={(e) => setFormData(prev => ({ ...prev, venduto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Acconto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.acconto}
                    onChange={(e) => setFormData(prev => ({ ...prev, acconto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Da pagare
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={(parseFloat(formData.venduto || '0') - parseFloat(formData.acconto || '0')).toFixed(2)}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>

              </div>

              {/* Sección de Cuotas - Se muestra automáticamente si Da Pagare > 0 */}
              {(parseFloat(formData.venduto || '0') - parseFloat(formData.acconto || '0')) > 0 && (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pagamento *
                  </label>
                  <select
                    value={formData.metodoPagamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, metodoPagamento: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Seleccionar método...</option>
                    {metodosPagamento && metodosPagamento.map((metodo) => (
                      <option key={metodo.id} value={metodo.metodoPagamento}>
                        {metodo.metodoPagamento}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Metodo di Acquisto
                  </label>
                  <input
                    type="text"
                    value={formData.metodoCompra}
                    onChange={(e) => setFormData(prev => ({ ...prev, metodoCompra: e.target.value }))}
                    placeholder="Ej: Online, Agencia, Directo..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stato *
                  </label>
                  <select
                    value={formData.stato}
                    onChange={(e) => setFormData(prev => ({ ...prev, stato: e.target.value }))}
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
                  {editingVenta?.attachedFile && !attachedFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Archivo actual: {editingVenta.attachedFileName || 'archivo adjunto'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  onClick={handleCancelEdit}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Actualizando...' : 'Actualizar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>

      {/* Tabla de ventas */}
      <ComponentCard title="">
        {/* Botón para generar venta */}
        <div className="flex justify-center mb-6">
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            Generar Venta
          </button>
        </div>

        {ventas.length === 0 ? (
          <div className="text-center py-12">
            <PlaneIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay ventas registradas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Genera tu primera venta para comenzar
            </p>
            <Button
              onClick={openModal}
              className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-lg"
            >
              Generar Venta
            </Button>
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
                {ventas && ventas.map((venta) => (
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
                        <input
                          type="text"
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
                          placeholder="Ej: Online, Agencia..."
                        />
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
