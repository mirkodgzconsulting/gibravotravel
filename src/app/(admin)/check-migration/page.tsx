'use client';

import { useState, useEffect } from 'react';

interface MigrationStats {
  totalClients: number;
  clientsWithEmail: number;
  clientsWithFiscalCode: number;
  clientsWithoutEmail: number;
  recentClients: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fiscalCode: string;
    createdAt: string;
  }>;
}

export default function CheckMigrationPage() {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMigrationStats();
  }, []);

  const fetchMigrationStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/migration-stats');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener estadísticas');
      }
      
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-sm border border-red-200 bg-red-50 p-6">
          <h3 className="font-medium text-red-900 mb-2">❌ Error</h3>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-sm border border-gray-200 bg-gray-50 p-6">
          <p className="text-gray-800">No se pudieron cargar las estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            📊 Estado de la Migración de Clientes
          </h3>
        </div>
        
        <div className="p-6.5">
          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalClients.toLocaleString()}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                Total Clientes
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.clientsWithEmail.toLocaleString()}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">
                Con Email Real
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.clientsWithoutEmail.toLocaleString()}
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                Con Email Temporal
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.clientsWithFiscalCode.toLocaleString()}
              </div>
              <div className="text-sm text-purple-800 dark:text-purple-200">
                Con Código Fiscal
              </div>
            </div>
          </div>

          {/* Clientes recientes */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              📋 Últimos Clientes Registrados
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">
                      Cliente
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">
                      Email
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">
                      Código Fiscal
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600 dark:text-gray-400">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentClients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 text-gray-900 dark:text-white">
                        {client.firstName} {client.lastName}
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">
                        {client.email.includes('@temp.com') ? (
                          <span className="text-yellow-600 dark:text-yellow-400">
                            {client.email}
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
                            {client.email}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-400">
                        {client.fiscalCode === 'N/A' ? (
                          <span className="text-gray-400">N/A</span>
                        ) : (
                          <span className="text-purple-600 dark:text-purple-400">
                            {client.fiscalCode}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-gray-500 dark:text-gray-500">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botón de actualización */}
          <div className="text-center">
            <button
              onClick={fetchMigrationStats}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              🔄 Actualizar Estadísticas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
