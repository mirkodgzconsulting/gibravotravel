"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Edit2Icon, CheckIcon, X as XCloseIcon } from "lucide-react";

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

interface Acompanante {
  id: string;
  clienteId?: string;
  nombreCompleto: string;
  telefono: string | null;
  codiceFiscale: string | null;
  fermata: string;
  numeroAsiento: number;
  esAdulto: boolean;
  ventaTourBusId?: string;
}

interface Cuota {
  id?: string;
  fechaPago: string;
  precioPagar: string;
  metodoPagamento: string;
  ventaTourBusId?: string;
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
  notaEsternaRicevuta?: string | null;
  notaInterna?: string | null;
  attachedFile?: string | null;
  attachedFileName?: string | null;
  numeroAcompanantes?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  acompanantes: Acompanante[];
  cuotas: Cuota[];
}

interface EditVentaFormProps {
  venta: VentaTourBus;
  tourTitulo: string;
  precioAdulto: number;
  precioNino: number;
  asientosDisponibles: number[];
  clients: Client[];
  fermate: string[];
  metodosPagamento: string[];
  stati: string[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function EditVentaForm({
  venta,
  tourTitulo,
  precioAdulto,
  precioNino,
  asientosDisponibles,
  clients,
  fermate,
  metodosPagamento,
  stati,
  onSubmit,
  onCancel,
  isSubmitting
}: EditVentaFormProps) {
  
  // Estados para select de cliente con búsqueda
  const [selectedClientId, setSelectedClientId] = useState<string>(venta.clienteId || '');
  const [clientSearchTerm, setClientSearchTerm] = useState<string>(venta.clienteNombre);
  const [showClientDropdown, setShowClientDropdown] = useState<boolean>(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  
  // Estados del formulario - Inicializar con datos de venta existente
  const [formData, setFormData] = useState({
    clienteNombre: venta.clienteNombre,
    codiceFiscale: venta.codiceFiscale,
    indirizzo: venta.indirizzo,
    email: venta.email,
    numeroTelefono: venta.numeroTelefono,
    fechaNacimiento: venta.fechaNacimiento ? venta.fechaNacimiento.split('T')[0] : '',
    fermata: venta.fermata,
    numeroAsiento: venta.numeroAsiento,
    tieneMascotas: venta.tieneMascotas,
    numeroMascotas: venta.numeroMascotas ?? 0,
    tieneInfantes: venta.tieneInfantes,
    numeroInfantes: venta.numeroInfantes ?? 0,
  });
  
  // Estados para acompañantes - Inicializar con datos existentes
  const [tieneAcompanantes, setTieneAcompanantes] = useState(venta.acompanantes.length > 0);
  const [numeroAcompanantes, setNumeroAcompanantes] = useState(venta.acompanantes.length);
  const [acompanantes, setAcompanantes] = useState<Acompanante[]>(
    venta.acompanantes.map(acomp => ({
      id: acomp.id,
      clienteId: acomp.clienteId,
      nombreCompleto: acomp.nombreCompleto,
      telefono: acomp.telefono || '',
      codiceFiscale: acomp.codiceFiscale || '',
      fermata: acomp.fermata,
      numeroAsiento: acomp.numeroAsiento,
      esAdulto: acomp.esAdulto,
    }))
  );
  const [acompananteSearchTerms, setAcompananteSearchTerms] = useState<string[]>(
    venta.acompanantes.map(acomp => acomp.nombreCompleto)
  );
  const [showAcompananteDropdowns, setShowAcompananteDropdowns] = useState<boolean[]>(
    venta.acompanantes.map(() => false)
  );
  const acompananteDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Estados para precios personalizados
  // Calcular precios personalizados basándose en el totalAPagar existente
  const calcularPreciosPersonalizados = () => {
    const numAdultos = 1 + venta.acompanantes.filter(a => a.esAdulto).length;
    const numNinos = venta.acompanantes.filter(a => !a.esAdulto).length;
    const totalEsperado = (numAdultos * precioAdulto) + (numNinos * precioNino);
    
    // Si el totalAPagar es diferente al esperado, hay precios personalizados
    if (Math.abs(venta.totalAPagar - totalEsperado) > 0.01) {
      // Calcular precios personalizados aproximados
      if (numAdultos > 0 && numNinos > 0) {
        // Si hay ambos, usar proporción
        const ratio = venta.totalAPagar / totalEsperado;
        return {
          precioAdulto: precioAdulto * ratio,
          precioNino: precioNino * ratio
        };
      } else if (numAdultos > 0) {
        return {
          precioAdulto: venta.totalAPagar / numAdultos,
          precioNino: precioNino
        };
      } else {
        return {
          precioAdulto: precioAdulto,
          precioNino: venta.totalAPagar / numNinos
        };
      }
    }
    return null;
  };
  
  const preciosCalculados = calcularPreciosPersonalizados();
  const [precioAdultoPersonalizado, setPrecioAdultoPersonalizado] = useState<number | null>(
    preciosCalculados ? preciosCalculados.precioAdulto : null
  );
  const [precioNinoPersonalizado, setPrecioNinoPersonalizado] = useState<number | null>(
    preciosCalculados ? preciosCalculados.precioNino : null
  );
  const [editandoPrecioAdulto, setEditandoPrecioAdulto] = useState(false);
  const [editandoPrecioNino, setEditandoPrecioNino] = useState(false);
  const [tempPrecioAdulto, setTempPrecioAdulto] = useState(
    (precioAdultoPersonalizado ?? precioAdulto).toString()
  );
  const [tempPrecioNino, setTempPrecioNino] = useState(
    (precioNinoPersonalizado ?? precioNino).toString()
  );
  
  // Precios efectivos (personalizados si existen, sino los del tour)
  const precioAdultoEfectivo = precioAdultoPersonalizado ?? precioAdulto;
  const precioNinoEfectivo = precioNinoPersonalizado ?? precioNino;
  
  // Estados para pagos - Inicializar con datos existentes
  const [totalAPagar, setTotalAPagar] = useState(venta.totalAPagar);
  const [acconto, setAcconto] = useState(venta.acconto.toString());
  const [daPagare, setDaPagare] = useState(venta.daPagare);
  const [metodoPagamento, setMetodoPagamento] = useState(venta.metodoPagamento);
  const [stato, setStato] = useState(venta.estadoPago);
  const [notaEsternaRicevuta, setNotaEsternaRicevuta] = useState(venta.notaEsternaRicevuta || '');
  const [notaInterna, setNotaInterna] = useState(venta.notaInterna || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(venta.attachedFile || null);
  const [existingFileName, setExistingFileName] = useState<string | null>(venta.attachedFileName || null);
  
  // Estados para cuotas - Inicializar con datos existentes
  const [numeroCuotas, setNumeroCuotas] = useState(venta.cuotas.length);
  const [cuotas, setCuotas] = useState<Cuota[]>(
    venta.cuotas.map(cuota => ({
      id: cuota.id,
      fechaPago: cuota.fechaPago.split('T')[0],
      precioPagar: cuota.precioPagar.toString(),
      metodoPagamento: cuota.metodoPagamento,
    }))
  );

  // Incluir asiento actual de la venta en disponibles
  const asientosDisponiblesConActual = [
    venta.numeroAsiento,
    ...venta.acompanantes.map(a => a.numeroAsiento),
    ...asientosDisponibles
  ].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

  // Actualizar tempPrecios cuando cambian los precios efectivos
  useEffect(() => {
    if (!editandoPrecioAdulto) {
      setTempPrecioAdulto(precioAdultoEfectivo.toString());
    }
  }, [precioAdultoEfectivo, editandoPrecioAdulto]);
  
  useEffect(() => {
    if (!editandoPrecioNino) {
      setTempPrecioNino(precioNinoEfectivo.toString());
    }
  }, [precioNinoEfectivo, editandoPrecioNino]);
  
  // Calcular total a pagar cuando cambia el número de acompañantes, sus tipos, o los precios
  useEffect(() => {
    let total = precioAdultoEfectivo; // Cliente principal siempre es adulto
    
    acompanantes.forEach(acomp => {
      total += acomp.esAdulto ? precioAdultoEfectivo : precioNinoEfectivo;
    });
    
    setTotalAPagar(total);
    const accontoNum = parseFloat(acconto) || 0;
    setDaPagare(Math.max(0, total - accontoNum));
  }, [acompanantes, precioAdultoEfectivo, precioNinoEfectivo, acconto]);

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Cerrar dropdown principal
      if (showClientDropdown && clientDropdownRef.current && !clientDropdownRef.current.contains(target)) {
        setShowClientDropdown(false);
      }
      
      // Cerrar dropdowns de acompañantes
      showAcompananteDropdowns.forEach((isOpen, index) => {
        if (isOpen && acompananteDropdownRefs.current[index] && !acompananteDropdownRefs.current[index]?.contains(target)) {
          const newDropdowns = [...showAcompananteDropdowns];
          newDropdowns[index] = false;
          setShowAcompananteDropdowns(newDropdowns);
        }
      });
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showClientDropdown, showAcompananteDropdowns]);

  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setSelectedClientId(clientId);
      setClientSearchTerm(`${selectedClient.firstName} ${selectedClient.lastName}`);
      setShowClientDropdown(false);
      
      setFormData({
        clienteNombre: `${selectedClient.firstName} ${selectedClient.lastName}`,
        codiceFiscale: selectedClient.fiscalCode,
        indirizzo: selectedClient.address,
        email: selectedClient.email,
        numeroTelefono: selectedClient.phoneNumber,
        fechaNacimiento: selectedClient.birthDate.split('T')[0],
        fermata: formData.fermata,
        numeroAsiento: formData.numeroAsiento,
        tieneMascotas: formData.tieneMascotas,
        numeroMascotas: formData.numeroMascotas,
        tieneInfantes: formData.tieneInfantes,
        numeroInfantes: formData.numeroInfantes,
      });
    }
  };

  const filteredClients = clients.filter(client => 
    `${client.firstName} ${client.lastName}`.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const handleNumeroAcompanantesChange = (num: number) => {
    const maxAcompanantes = Math.min(20, asientosDisponiblesConActual.length - 1);
    const validNum = Math.min(num, maxAcompanantes);
    
    setNumeroAcompanantes(validNum);
    
    // Si aumentamos el número, agregamos nuevos (preservando los existentes)
    if (validNum > acompanantes.length) {
      const newAcompanantes = [...acompanantes];
      const newSearchTerms = [...acompananteSearchTerms];
      const newDropdowns = [...showAcompananteDropdowns];
      
      for (let i = acompanantes.length; i < validNum; i++) {
        newAcompanantes.push({
          id: `temp-${Math.random()}`,
          clienteId: '',
          nombreCompleto: '',
          telefono: '',
          codiceFiscale: '',
          fermata: '',
          numeroAsiento: 0,
          esAdulto: true,
        });
        newSearchTerms.push('');
        newDropdowns.push(false);
      }
      
      setAcompanantes(newAcompanantes);
      setAcompananteSearchTerms(newSearchTerms);
      setShowAcompananteDropdowns(newDropdowns);
    } else if (validNum < acompanantes.length) {
      // Si reducimos, solo cortamos los últimos (preservando los primeros)
      setAcompanantes(acompanantes.slice(0, validNum));
      setAcompananteSearchTerms(acompananteSearchTerms.slice(0, validNum));
      setShowAcompananteDropdowns(showAcompananteDropdowns.slice(0, validNum));
    }
    // Si validNum === acompanantes.length, no hacemos nada (no cambió)
  };

  const handleAcompananteClientSelect = (index: number, clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      const newAcompanantes = [...acompanantes];
      newAcompanantes[index] = {
        ...newAcompanantes[index],
        clienteId: clientId,
        nombreCompleto: `${selectedClient.firstName} ${selectedClient.lastName}`,
        telefono: selectedClient.phoneNumber,
        codiceFiscale: selectedClient.fiscalCode,
      };
      setAcompanantes(newAcompanantes);
      
      const newSearchTerms = [...acompananteSearchTerms];
      newSearchTerms[index] = `${selectedClient.firstName} ${selectedClient.lastName}`;
      setAcompananteSearchTerms(newSearchTerms);
      
      const newDropdowns = [...showAcompananteDropdowns];
      newDropdowns[index] = false;
      setShowAcompananteDropdowns(newDropdowns);
    }
  };

  const handleNumeroCuotasChange = (num: number) => {
    setNumeroCuotas(num);
    
    // Si aumentamos, agregamos nuevas cuotas
    if (num > cuotas.length) {
      const newCuotas = [...cuotas];
      for (let i = cuotas.length; i < num; i++) {
        newCuotas.push({
          fechaPago: '',
          precioPagar: '',
          metodoPagamento: '',
        });
      }
      setCuotas(newCuotas);
    } else {
      // Si reducimos, cortamos el array
      setCuotas(cuotas.slice(0, num));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación 1: Asientos únicos
    const asientosSeleccionados = [formData.numeroAsiento, ...acompanantes.map(a => a.numeroAsiento)];
    const asientosUnicos = new Set(asientosSeleccionados);
    
    if (asientosUnicos.size !== asientosSeleccionados.length) {
      alert('Hay asientos duplicados. Por favor, verifica las selecciones.');
      return;
    }
    
    if (asientosSeleccionados.some(a => a === 0)) {
      alert('Todos los asientos deben ser seleccionados.');
      return;
    }
    
    // Validación de mascotas
    if (formData.tieneMascotas && (!formData.numeroMascotas || formData.numeroMascotas < 1)) {
      alert('Debe indicar el número de mascotas.');
      return;
    }
    
    // Validación de infantes
    if (formData.tieneInfantes && (!formData.numeroInfantes || formData.numeroInfantes < 1)) {
      alert('Debe indicar el número de infantes.');
      return;
    }
    
    // Validación 2: Suma de cuotas = daPagare
    if (numeroCuotas > 0) {
      const sumaCuotas = cuotas.reduce((sum, c) => sum + parseFloat(c.precioPagar || '0'), 0);
      const diferencia = Math.abs(sumaCuotas - daPagare);
      
      if (diferencia > 0.01) {
        alert(`La suma de las cuotas (€${sumaCuotas.toFixed(2)}) no coincide con el saldo pendiente (€${daPagare.toFixed(2)})`);
        return;
      }
      
      // Validar que todas las cuotas tengan método de pago
      if (cuotas.some(c => !c.metodoPagamento || !c.precioPagar)) {
        alert('Todas las cuotas deben tener un método de pago e importe.');
        return;
      }
    }
    
    // Crear FormData para enviar archivos
    const formDataToSend = new FormData();
    
    // Datos básicos
    formDataToSend.append('id', venta.id);
    if (selectedClientId) {
      formDataToSend.append('clienteId', selectedClientId);
    }
    formDataToSend.append('clienteNombre', formData.clienteNombre);
    formDataToSend.append('codiceFiscale', formData.codiceFiscale || '');
    formDataToSend.append('indirizzo', formData.indirizzo || '');
    formDataToSend.append('email', formData.email || '');
    formDataToSend.append('numeroTelefono', formData.numeroTelefono || '');
    formDataToSend.append('fechaNacimiento', formData.fechaNacimiento || '');
    formDataToSend.append('fermata', formData.fermata);
    formDataToSend.append('numeroAsiento', formData.numeroAsiento.toString());
    formDataToSend.append('tieneMascotas', formData.tieneMascotas.toString());
    formDataToSend.append('numeroMascotas', (formData.numeroMascotas || 0).toString());
    formDataToSend.append('tieneInfantes', formData.tieneInfantes.toString());
    formDataToSend.append('numeroInfantes', (formData.numeroInfantes || 0).toString());
    formDataToSend.append('totalAPagar', totalAPagar.toString());
    formDataToSend.append('acconto', (parseFloat(acconto) || 0).toString());
    formDataToSend.append('daPagare', daPagare.toString());
    formDataToSend.append('metodoPagamento', metodoPagamento);
    formDataToSend.append('estadoPago', stato);
    formDataToSend.append('notaEsternaRicevuta', notaEsternaRicevuta || '');
    formDataToSend.append('notaInterna', notaInterna || '');
    
    // Acompañantes
    formDataToSend.append('acompanantes', JSON.stringify(acompanantes.map((acomp) => ({
      ...acomp,
      telefono: acomp.telefono || '',
      codiceFiscale: acomp.codiceFiscale || '',
    }))));
    
    // Cuotas
    formDataToSend.append('cuotas', JSON.stringify(numeroCuotas > 0 ? cuotas : []));
    
    // Archivo adjunto - solo si se seleccionó uno nuevo
    if (selectedFile) {
      formDataToSend.append('file', selectedFile);
    } else if (!existingFileUrl) {
      // Si no hay archivo existente y no se seleccionó uno nuevo, enviar señal para eliminar
      formDataToSend.append('removeFile', 'true');
    }
    
    await onSubmit(formDataToSend);
  };

  const maxAcompanantes = Math.min(20, asientosDisponiblesConActual.length - 1);

  return (
    <Modal isOpen={true} onClose={onCancel}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Modificar Venta - {tourTitulo}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
          {/* Información del Tour */}
          <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-brand-900 dark:text-brand-100 mb-2">Tour: {tourTitulo}</h3>
            <div className="flex gap-4 text-sm text-brand-700 dark:text-brand-300">
              {/* Precio Adulto */}
              <div className="flex items-center gap-2">
                <span>Adulto:</span>
                {editandoPrecioAdulto ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tempPrecioAdulto}
                      onChange={(e) => setTempPrecioAdulto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const nuevoPrecio = parseFloat(tempPrecioAdulto);
                          if (!isNaN(nuevoPrecio) && nuevoPrecio >= 0) {
                            setPrecioAdultoPersonalizado(nuevoPrecio);
                            setEditandoPrecioAdulto(false);
                          }
                        } else if (e.key === 'Escape') {
                          setTempPrecioAdulto(precioAdultoEfectivo.toString());
                          setEditandoPrecioAdulto(false);
                        }
                      }}
                      className="w-20 px-2 py-1 border border-brand-300 rounded text-sm focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nuevoPrecio = parseFloat(tempPrecioAdulto);
                        if (!isNaN(nuevoPrecio) && nuevoPrecio >= 0) {
                          setPrecioAdultoPersonalizado(nuevoPrecio);
                          setEditandoPrecioAdulto(false);
                        }
                      }}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                      title="Confirmar"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPrecioAdulto(precioAdultoEfectivo.toString());
                        setEditandoPrecioAdulto(false);
                      }}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Cancelar"
                    >
                      <XCloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      €{precioAdultoEfectivo.toFixed(2)}
                      {precioAdultoPersonalizado !== null && precioAdultoPersonalizado !== precioAdulto && (
                        <span className="text-xs text-orange-600 ml-1">(personalizado)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPrecioAdulto(precioAdultoEfectivo.toString());
                        setEditandoPrecioAdulto(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-800 rounded transition-colors flex items-center justify-center border border-transparent hover:border-brand-300"
                      title="Editar precio adulto"
                    >
                      <Edit2Icon className="w-4 h-4" strokeWidth={2} />
                    </button>
                    {precioAdultoPersonalizado !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setPrecioAdultoPersonalizado(null);
                          setTempPrecioAdulto(precioAdulto.toString());
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center"
                        title="Restaurar precio original"
                      >
                        <XCloseIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Precio Niño */}
              <div className="flex items-center gap-2">
                <span>Niño:</span>
                {editandoPrecioNino ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tempPrecioNino}
                      onChange={(e) => setTempPrecioNino(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const nuevoPrecio = parseFloat(tempPrecioNino);
                          if (!isNaN(nuevoPrecio) && nuevoPrecio >= 0) {
                            setPrecioNinoPersonalizado(nuevoPrecio);
                            setEditandoPrecioNino(false);
                          }
                        } else if (e.key === 'Escape') {
                          setTempPrecioNino(precioNinoEfectivo.toString());
                          setEditandoPrecioNino(false);
                        }
                      }}
                      className="w-20 px-2 py-1 border border-brand-300 rounded text-sm focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const nuevoPrecio = parseFloat(tempPrecioNino);
                        if (!isNaN(nuevoPrecio) && nuevoPrecio >= 0) {
                          setPrecioNinoPersonalizado(nuevoPrecio);
                          setEditandoPrecioNino(false);
                        }
                      }}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                      title="Confirmar"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPrecioNino(precioNinoEfectivo.toString());
                        setEditandoPrecioNino(false);
                      }}
                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                      title="Cancelar"
                    >
                      <XCloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      €{precioNinoEfectivo.toFixed(2)}
                      {precioNinoPersonalizado !== null && precioNinoPersonalizado !== precioNino && (
                        <span className="text-xs text-orange-600 ml-1">(personalizado)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPrecioNino(precioNinoEfectivo.toString());
                        setEditandoPrecioNino(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-800 rounded transition-colors flex items-center justify-center border border-transparent hover:border-brand-300"
                      title="Editar precio niño"
                    >
                      <Edit2Icon className="w-4 h-4" strokeWidth={2} />
                    </button>
                    {precioNinoPersonalizado !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setPrecioNinoPersonalizado(null);
                          setTempPrecioNino(precioNino.toString());
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center"
                        title="Restaurar precio original"
                      >
                        <XCloseIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Datos del Cliente Principal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
              Datos del Cliente Principal
            </h3>
            
            {/* Select de Cliente con búsqueda */}
            <div className="relative" ref={clientDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente *
              </label>
              <input
                type="text"
                value={clientSearchTerm}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value);
                  setShowClientDropdown(true);
                  setSelectedClientId('');
                }}
                onFocus={() => setShowClientDropdown(true)}
                placeholder="Cerca cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                required
              />
              
              {/* Dropdown de clientes */}
              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => handleClientSelect(client.id)}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                    >
                      {client.firstName} {client.lastName}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Campos automáticos del cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Codice Fiscale *
                </label>
                <input
                  type="text"
                  value={formData.codiceFiscale}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  placeholder={formData.codiceFiscale ? undefined : 'Dato no disponible'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="text"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  placeholder={formData.email ? undefined : 'Dato no disponible'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefono *
                </label>
                <input
                  type="text"
                  value={formData.numeroTelefono}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  placeholder={formData.numeroTelefono ? undefined : 'Dato no disponible'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data di Nascita *
                </label>
                <input
                  type="text"
                  value={formData.fechaNacimiento}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  placeholder={formData.fechaNacimiento ? undefined : 'Dato no disponible'}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Indirizzo *
                </label>
                <input
                  type="text"
                  value={formData.indirizzo}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  placeholder={formData.indirizzo ? undefined : 'Dato no disponible'}
                />
              </div>
            </div>

            {/* Fermata y Asiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fermata *
                </label>
                <select
                  value={formData.fermata}
                  onChange={(e) => setFormData({ ...formData, fermata: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleziona fermata...</option>
                  {fermate.map((fermata, index) => (
                    <option key={index} value={fermata}>{fermata}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numero Posto *
                </label>
                <select
                  value={formData.numeroAsiento}
                  onChange={(e) => setFormData({ ...formData, numeroAsiento: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value={0}>Seleziona posto...</option>
                  {asientosDisponiblesConActual.map((num) => (
                    <option key={num} value={num}>Posto {num}</option>
                  ))}
                </select>
              </div>
              
              {/* Checkbox Pets */}
              <div className="md:col-span-2 space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.tieneMascotas}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        tieneMascotas: e.target.checked,
                        numeroMascotas: e.target.checked ? (formData.numeroMascotas || 1) : 0
                      });
                    }}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pets (Mascotas)
                  </span>
                </label>
                
                {formData.tieneMascotas && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Mascotas *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.numeroMascotas || 1}
                      onChange={(e) => setFormData({ ...formData, numeroMascotas: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                )}
                
                {/* Checkbox Infantes */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.tieneInfantes}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        tieneInfantes: e.target.checked,
                        numeroInfantes: e.target.checked ? (formData.numeroInfantes || 1) : 0
                      });
                    }}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Infantes
                  </span>
                </label>
                
                {formData.tieneInfantes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Número de Infantes *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.numeroInfantes || 1}
                      onChange={(e) => setFormData({ ...formData, numeroInfantes: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Acompañantes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
              Acompañantes
            </h3>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={tieneAcompanantes}
                  onChange={(e) => {
                    setTieneAcompanantes(e.target.checked);
                    if (!e.target.checked) {
                      setNumeroAcompanantes(0);
                      setAcompanantes([]);
                    }
                  }}
                  className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Il cliente ha accompagnanti
                </span>
              </label>
              
              {tieneAcompanantes && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Numero:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxAcompanantes}
                    value={numeroAcompanantes}
                    onChange={(e) => handleNumeroAcompanantesChange(parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <span className="text-xs text-gray-500">
                    (max: {maxAcompanantes})
                  </span>
                </div>
              )}
            </div>

            {/* Formularios de acompañantes */}
            {acompanantes.map((acomp, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Accompagnante {index + 1}
                  </h4>
                  
                  {/* Checkboxes Adulto/Niño */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`tipo-${index}`}
                        checked={acomp.esAdulto}
                        onChange={() => {
                          const newAcompanantes = [...acompanantes];
                          newAcompanantes[index].esAdulto = true;
                          setAcompanantes(newAcompanantes);
                        }}
                        className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Adulto</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`tipo-${index}`}
                        checked={!acomp.esAdulto}
                        onChange={() => {
                          const newAcompanantes = [...acompanantes];
                          newAcompanantes[index].esAdulto = false;
                          setAcompanantes(newAcompanantes);
                        }}
                        className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Niño</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Select de cliente para acompañante */}
                  <div className="relative md:col-span-2" ref={el => { acompananteDropdownRefs.current[index] = el; }}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={acompananteSearchTerms[index] || ''}
                      onChange={(e) => {
                        const newTerms = [...acompananteSearchTerms];
                        newTerms[index] = e.target.value;
                        setAcompananteSearchTerms(newTerms);
                        
                        const newDropdowns = [...showAcompananteDropdowns];
                        newDropdowns[index] = true;
                        setShowAcompananteDropdowns(newDropdowns);
                      }}
                      onFocus={() => {
                        const newDropdowns = [...showAcompananteDropdowns];
                        newDropdowns[index] = true;
                        setShowAcompananteDropdowns(newDropdowns);
                      }}
                      placeholder="Cerca cliente..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                    
                    {showAcompananteDropdowns[index] && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {clients
                          .filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes((acompananteSearchTerms[index] || '').toLowerCase()))
                          .map((client) => (
                            <div
                              key={client.id}
                              onClick={() => handleAcompananteClientSelect(index, client.id)}
                              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                            >
                              {client.firstName} {client.lastName}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={acomp.telefono || ''}
                      onChange={(e) => {
                        if (acomp.clienteId) return;
                        const newAcompanantes = [...acompanantes];
                        newAcompanantes[index].telefono = e.target.value;
                        setAcompanantes(newAcompanantes);
                      }}
                      disabled={!!acomp.clienteId}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:border-gray-600 ${acomp.clienteId ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'border-gray-300 dark:bg-gray-700 dark:text-white'}`}
                      placeholder={acomp.clienteId && !acomp.telefono ? 'Dato no disponible' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Codice Fiscale
                    </label>
                    <input
                      type="text"
                      value={acomp.codiceFiscale || ''}
                      onChange={(e) => {
                        if (acomp.clienteId) return;
                        const newAcompanantes = [...acompanantes];
                        newAcompanantes[index].codiceFiscale = e.target.value;
                        setAcompanantes(newAcompanantes);
                      }}
                      disabled={!!acomp.clienteId}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:border-gray-600 ${acomp.clienteId ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'border-gray-300 dark:bg-gray-700 dark:text-white'}`}
                      placeholder={acomp.clienteId && !acomp.codiceFiscale ? 'Dato no disponible' : ''}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fermata *
                    </label>
                    <select
                      value={acomp.fermata}
                      onChange={(e) => {
                        const newAcompanantes = [...acompanantes];
                        newAcompanantes[index].fermata = e.target.value;
                        setAcompanantes(newAcompanantes);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Seleziona fermata...</option>
                      {fermate.map((fermata, idx) => (
                        <option key={idx} value={fermata}>{fermata}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Numero Posto *
                    </label>
                    <select
                      value={acomp.numeroAsiento}
                      onChange={(e) => {
                        const newAcompanantes = [...acompanantes];
                        newAcompanantes[index].numeroAsiento = parseInt(e.target.value);
                        setAcompanantes(newAcompanantes);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value={0}>Seleziona posto...</option>
                      {asientosDisponiblesConActual
                        .filter(num => num !== formData.numeroAsiento && !acompanantes.some((a, i) => i !== index && a.numeroAsiento === num))
                        .map((num) => (
                          <option key={num} value={num}>Posto {num}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
              Pagamento
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Totale da Pagare
                </label>
                <input
                  type="text"
                  value={`€${totalAPagar.toFixed(2)}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {acompanantes.filter(a => a.esAdulto).length + 1} adulto/i × €{precioAdultoEfectivo.toFixed(2)} + {acompanantes.filter(a => !a.esAdulto).length} niño/i × €{precioNinoEfectivo.toFixed(2)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Acconto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalAPagar}
                  value={acconto}
                  onChange={(e) => setAcconto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Da Pagare
                </label>
                <input
                  type="text"
                  value={`€${daPagare.toFixed(2)}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-semibold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Metodo di Pagamento *
                </label>
                <select
                  value={metodoPagamento}
                  onChange={(e) => setMetodoPagamento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleziona...</option>
                  {metodosPagamento.map((metodo, index) => (
                    <option key={index} value={metodo}>{metodo}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stato *
                </label>
                <select
                  value={stato}
                  onChange={(e) => setStato(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Seleziona...</option>
                  {stati.map((st, index) => (
                    <option key={index} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Sección: Archivo Adjunto */}
              <div className="md:col-span-2">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Archivo Adjunto (opcional)</h3>
                  
                  {/* Mostrar archivo existente si hay */}
                  {existingFileUrl && !selectedFile && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Archivo actual:</span>
                          <a
                            href={existingFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {existingFileName || 'Ver archivo'}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setExistingFileUrl(null);
                            setExistingFileName(null);
                          }}
                          className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  
                  {selectedFile && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Nuevo archivo seleccionado: {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nota esterna ricevuta
                </label>
                <textarea
                  value={notaEsternaRicevuta}
                  onChange={(e) => setNotaEsternaRicevuta(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Inserisci nota esterna ricevuta..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nota interna
                </label>
                <textarea
                  value={notaInterna}
                  onChange={(e) => setNotaInterna(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Inserisci nota interna..."
                />
              </div>
            </div>

            {/* Cuotas */}
            {daPagare > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Numero di Rate:
                  </label>
                  <select
                    value={numeroCuotas}
                    onChange={(e) => handleNumeroCuotasChange(parseInt(e.target.value))}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    <option value={0}>Nessuna</option>
                    <option value={1}>1 Rata</option>
                    <option value={2}>2 Rate</option>
                  </select>
                </div>

                {cuotas.map((cuota, index) => {
                  const sumaCuotas = cuotas.reduce((sum, c) => sum + parseFloat(c.precioPagar || '0'), 0);
                  const diferencia = daPagare - sumaCuotas;
                  
                  return (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Rata {index + 1}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Data Pagamento
                          </label>
                          <input
                            type="date"
                            value={cuota.fechaPago}
                            onChange={(e) => {
                              const newCuotas = [...cuotas];
                              newCuotas[index].fechaPago = e.target.value;
                              setCuotas(newCuotas);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Importo *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={cuota.precioPagar}
                            onChange={(e) => {
                              const newCuotas = [...cuotas];
                              newCuotas[index].precioPagar = e.target.value;
                              setCuotas(newCuotas);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Metodo *
                          </label>
                          <select
                            value={cuota.metodoPagamento}
                            onChange={(e) => {
                              const newCuotas = [...cuotas];
                              newCuotas[index].metodoPagamento = e.target.value;
                              setCuotas(newCuotas);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                          >
                            <option value="">Seleziona...</option>
                            {metodosPagamento.map((metodo, idx) => (
                              <option key={idx} value={metodo}>{metodo}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {index === cuotas.length - 1 && diferencia !== 0 && (
                        <p className={`text-xs mt-2 ${diferencia > 0 ? 'text-orange-600' : 'text-red-600'}`}>
                          {diferencia > 0 
                            ? `Falta €${diferencia.toFixed(2)} por asignar` 
                            : `Excede €${Math.abs(diferencia).toFixed(2)}`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

