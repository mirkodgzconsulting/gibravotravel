"use client";

import React, { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

interface AuditoriaRegistro {
  id: string;
  tipoVenta: string;
  registroId: string;
  nombreCliente: string;
  datosRegistro: any;
  usuarioId: string;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
  fechaEliminacion: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export default function AuditoriaPage() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<AuditoriaRegistro[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("");

  useEffect(() => {
    if (!roleLoading) {
      fetchRegistros();
    }
  }, [roleLoading, filtroTipo]);

  const fetchRegistros = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filtroTipo) {
        params.append('tipoVenta', filtroTipo);
      }
      
      const response = await fetch(`/api/auditoria?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar registros de auditoría');
      }
      
      const data = await response.json();
      setRegistros(data.registros || []);
    } catch (err) {
      setError('Error al cargar los registros de auditoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTipoVentaBadge = (tipo: string) => {
    const colors: Record<string, { color: string; label: string }> = {
      biglietteria: { color: 'info', label: 'Biglietteria' },
      tour_aereo: { color: 'success', label: 'Tour Aereo' },
      tour_bus: { color: 'warning', label: 'Tour Bus' },
    };
    
    const config = colors[tipo] || { color: 'default', label: tipo };
    return (
      <Badge variant="light" color={config.color as any} size="sm">
        {config.label}
      </Badge>
    );
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!['ADMIN', 'TI'].includes(userRole || '')) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Auditoría" />
        <ComponentCard title="Acceso Denegado">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">
              No tienes permisos para acceder a esta sección.
            </p>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Auditoría de Eliminaciones" />
      
      <ComponentCard title="Registros de Auditoría">
        {/* Filtros */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por tipo de venta:
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              <option value="biglietteria">Biglietteria</option>
              <option value="tour_aereo">Tour Aereo</option>
              <option value="tour_bus">Tour Bus</option>
            </select>
          </div>
          <div className="mt-6">
            <button
              onClick={fetchRegistros}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : registros.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No hay registros de auditoría disponibles.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Fecha y Hora
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Tipo de Venta
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Cliente
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Usuario que Eliminó
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Email Usuario
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    ID Registro
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    IP Address
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {formatFecha(registro.fechaEliminacion)}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      {getTipoVentaBadge(registro.tipoVenta)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-100 font-medium">
                      {registro.nombreCliente}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {registro.usuarioNombre || 'N/A'}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {registro.usuarioEmail || 'N/A'}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {registro.registroId.substring(0, 12)}...
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-600 dark:text-gray-400 font-mono text-xs">
                      {registro.ipAddress || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {registros.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Total de registros: {registros.length}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}

