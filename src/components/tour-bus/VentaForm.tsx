"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlusIcon, XIcon } from "lucide-react";

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
  clienteId: string;
  nombreCompleto: string;
  telefono: string;
  codiceFiscale: string;
  fermata: string;
  numeroAsiento: number;
  esAdulto: boolean;
}

interface Cuota {
  fechaPago: string;
  precioPagar: string;
  metodoPagamento: string;
}

interface VentaFormProps {
  tourId: string;
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

export default function VentaForm({
  tourId,
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
}: VentaFormProps) {
  
  // Estados para select de cliente con búsqueda
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearchTerm, setClientSearchTerm] = useState<string>('');
  const [showClientDropdown, setShowClientDropdown] = useState<boolean>(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    clienteNombre: '',
    codiceFiscale: '',
    indirizzo: '',
    email: '',
    numeroTelefono: '',
    fechaNacimiento: '',
    fermata: '',
    numeroAsiento: 0,
    tieneMascotas: false,
    numeroMascotas: 0,
    tieneInfantes: false,
    numeroInfantes: 0,
  });
  
  // Estados para acompañantes
  const [tieneAcompanantes, setTieneAcompanantes] = useState(false);
  const [numeroAcompanantes, setNumeroAcompanantes] = useState(0);
  const [acompanantes, setAcompanantes] = useState<Acompanante[]>([]);
  const [acompananteSearchTerms, setAcompananteSearchTerms] = useState<string[]>([]);
  const [showAcompananteDropdowns, setShowAcompananteDropdowns] = useState<boolean[]>([]);
  const acompananteDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // Estados para pagos
  const [totalAPagar, setTotalAPagar] = useState(precioAdulto);
  const [acconto, setAcconto] = useState('');
  const [daPagare, setDaPagare] = useState(precioAdulto);
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [stato, setStato] = useState('');
  
  // Estados para cuotas
  const [numeroCuotas, setNumeroCuotas] = useState(0);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);

  // Calcular total a pagar cuando cambia el número de acompañantes o sus tipos
  useEffect(() => {
    let total = precioAdulto; // Cliente principal siempre es adulto
    
    acompanantes.forEach(acomp => {
      total += acomp.esAdulto ? precioAdulto : precioNino;
    });
    
    setTotalAPagar(total);
    const accontoNum = parseFloat(acconto) || 0;
    setDaPagare(Math.max(0, total - accontoNum));
  }, [acompanantes, precioAdulto, precioNino, acconto]);

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
        codiceFiscale: selectedClient.fiscalCode || '',
        indirizzo: selectedClient.address || '',
        email: selectedClient.email || '',
        numeroTelefono: selectedClient.phoneNumber || '',
        fechaNacimiento: selectedClient.birthDate ? selectedClient.birthDate.split('T')[0] : '',
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
    const maxAcompanantes = Math.min(20, asientosDisponibles.length - 1);
    const validNum = Math.min(num, maxAcompanantes);
    
    setNumeroAcompanantes(validNum);
    const newAcompanantes: Acompanante[] = [];
    const newSearchTerms: string[] = [];
    const newDropdowns: boolean[] = [];
    
    for (let i = 0; i < validNum; i++) {
      newAcompanantes.push({
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
  };

  const handleAcompananteClientSelect = (index: number, clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      const newAcompanantes = [...acompanantes];
      newAcompanantes[index] = {
        ...newAcompanantes[index],
        clienteId: clientId,
        nombreCompleto: `${selectedClient.firstName} ${selectedClient.lastName}`,
        telefono: selectedClient.phoneNumber || '',
        codiceFiscale: selectedClient.fiscalCode || '',
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
    const newCuotas: Cuota[] = [];
    
    for (let i = 0; i < num; i++) {
      newCuotas.push({
        fechaPago: '',
        precioPagar: '',
        metodoPagamento: '',
      });
    }
    
    setCuotas(newCuotas);
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
    
    const ventaData = {
      tourBusId: tourId,
      clienteId: selectedClientId || null,
      ...formData,
      acompanantes: acompanantes.map((acomp) => ({
        ...acomp,
        telefono: acomp.telefono || '',
        codiceFiscale: acomp.codiceFiscale || '',
      })),
      totalAPagar,
      acconto: parseFloat(acconto) || 0,
      daPagare,
      metodoPagamento,
      estadoPago: stato,
      cuotas: numeroCuotas > 0 ? cuotas : [],
    };

    ventaData.codiceFiscale = formData.codiceFiscale || '';
    ventaData.indirizzo = formData.indirizzo || '';
    ventaData.email = formData.email || '';
    ventaData.numeroTelefono = formData.numeroTelefono || '';
    ventaData.fechaNacimiento = formData.fechaNacimiento || '';
    
    console.log('Datos a enviar:', ventaData);
    
    await onSubmit(ventaData);
  };

  const maxAcompanantes = Math.min(20, asientosDisponibles.length - 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
      {/* Información del Tour */}
      <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-lg">
        <h3 className="font-semibold text-brand-900 dark:text-brand-100 mb-2">Tour: {tourTitulo}</h3>
        <div className="flex gap-4 text-sm text-brand-700 dark:text-brand-300">
          <span>Adulto: €{precioAdulto}</span>
          <span>Niño: €{precioNino}</span>
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
              setFormData((prev) => ({
                ...prev,
                clienteNombre: '',
                codiceFiscale: '',
                indirizzo: '',
                email: '',
                numeroTelefono: '',
                fechaNacimiento: '',
              }));
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
              Codice Fiscale
            </label>
            <input
              type="text"
              value={formData.codiceFiscale || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
              placeholder="Dato no disponible"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="text"
              value={formData.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
              placeholder="Dato no disponible"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefono
            </label>
            <input
              type="text"
              value={formData.numeroTelefono || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
              placeholder="Dato no disponible"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data di Nascita
            </label>
            <input
              type="text"
              value={formData.fechaNacimiento || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
              placeholder="Dato no disponible"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Indirizzo
            </label>
            <input
              type="text"
              value={formData.indirizzo || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 cursor-not-allowed"
              placeholder="Dato no disponible"
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
              {asientosDisponibles.sort((a, b) => a - b).map((num) => (
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
                    numeroMascotas: e.target.checked ? 1 : 0
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
                    numeroInfantes: e.target.checked ? 1 : 0
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
                  value={acomp.telefono}
                  onChange={(e) => {
                    if (acomp.clienteId) return;
                    const newAcompanantes = [...acompanantes];
                    newAcompanantes[index].telefono = e.target.value;
                    setAcompanantes(newAcompanantes);
                  }}
                  disabled={!!acomp.clienteId}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:border-gray-600 ${acomp.clienteId ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 cursor-not-allowed' : 'border-gray-300 dark:bg-gray-700 dark:text-white'}`}
                  placeholder={acomp.clienteId ? 'Dato no disponible' : ''}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  value={acomp.codiceFiscale}
                  onChange={(e) => {
                    if (acomp.clienteId) return;
                    const newAcompanantes = [...acompanantes];
                    newAcompanantes[index].codiceFiscale = e.target.value;
                    setAcompanantes(newAcompanantes);
                  }}
                  disabled={!!acomp.clienteId}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:border-gray-600 ${acomp.clienteId ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400 cursor-not-allowed' : 'border-gray-300 dark:bg-gray-700 dark:text-white'}`}
                  placeholder={acomp.clienteId ? 'Dato no disponible' : ''}
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
                  {asientosDisponibles
                    .filter(num => num !== formData.numeroAsiento && !acompanantes.some((a, i) => i !== index && a.numeroAsiento === num))
                    .sort((a, b) => a - b)
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
              {acompanantes.filter(a => a.esAdulto).length + 1} adulto/i × €{precioAdulto} + {acompanantes.filter(a => !a.esAdulto).length} niño/i × €{precioNino}
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
          {isSubmitting ? 'Creando...' : 'Conferma Vendita'}
        </button>
      </div>
    </form>
  );
}
