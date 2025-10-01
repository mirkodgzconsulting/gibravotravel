"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";

interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  photo: string | null;
  role: 'USER' | 'ADMIN' | 'TI';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Departure {
  id: string;
  title: string;
  description: string | null;
  departureDate: string;
  returnDate: string | null;
  price: number | null;
  capacity: number | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Route {
  id: string;
  name: string;
  description: string | null;
  distance: number | null;
  duration: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stop {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DatabaseAdminPage() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState<'users' | 'departures' | 'routes' | 'stops'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 'users':
          const userResponse = await fetch('/api/user/list');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUsers(userData.users || []);
          } else {
            setError('Error al cargar usuarios');
          }
          break;
        
        case 'departures':
          // Simular datos de departures por ahora
          setDepartures([]);
          break;
        
        case 'routes':
          // Simular datos de routes por ahora
          setRoutes([]);
          break;
        
        case 'stops':
          // Simular datos de stops por ahora
          setStops([]);
          break;
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'TI': return 'error';
      case 'ADMIN': return 'warning';
      case 'USER': return 'success';
      default: return 'light';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error';
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!userRole || userRole !== 'TI') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Accesso Negato
          </h1>
          <p className="text-gray-600">
            Solo gli amministratori possono accedere a questa pagina.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'users', label: 'Utenti', count: users.length },
    { id: 'departures', label: 'Partenze', count: departures.length },
    { id: 'routes', label: 'Percorsi', count: routes.length },
    { id: 'stops', label: 'Fermate', count: stops.length },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Amministrazione Database" />
      
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          <p>{error}</p>
          <Button 
            onClick={fetchData}
            size="sm"
            variant="primary"
            className="mt-2"
          >
            Riprova
          </Button>
        </div>
      )}

      <ComponentCard title="Gestione Database">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'users' | 'departures' | 'routes' | 'stops')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Utente
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Email
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Telefono
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Ruolo
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Stato
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                          Creato
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                            Nessun utente registrato
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                  {user.photo ? (
                                    <Image
                                      width={40}
                                      height={40}
                                      src={user.photo}
                                      alt={`${user.firstName} ${user.lastName}`}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                                      {user.firstName?.[0] || user.email[0].toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                    {user.firstName} {user.lastName}
                                  </span>
                                  <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                    ID: {user.clerkId.slice(0, 8)}...
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {user.email}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {user.phoneNumber || 'N/A'}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              <Badge size="sm" color={getRoleBadgeColor(user.role)}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              <Badge size="sm" color={getStatusBadgeColor(user.isActive)}>
                                {user.isActive ? 'Attivo' : 'Inattivo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {new Date(user.createdAt).toLocaleDateString('it-IT')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {activeTab === 'departures' && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Gestione Partenze - In sviluppo</p>
              </div>
            )}

            {activeTab === 'routes' && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Gestione Percorsi - In sviluppo</p>
              </div>
            )}

            {activeTab === 'stops' && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Gestione Fermate - In sviluppo</p>
              </div>
            )}
          </>
        )}
      </ComponentCard>
    </div>
  );
}
