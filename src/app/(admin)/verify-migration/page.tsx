'use client';

import { useState } from 'react';

interface DbCheckResult {
  success: boolean;
  summary: {
    totalClients: number;
    clientsWithTempEmail: number;
    clientsWithRealEmail: number;
    clientsWithFiscalCode: number;
    yourClients: number;
    migrationCompleted: boolean;
    dateRange: {
      oldest: string | null;
      newest: string | null;
    };
  };
  recentClients: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fiscalCode: string;
    createdAt: string;
    createdBy: string;
  }>;
  oldestClients: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fiscalCode: string;
    createdAt: string;
    createdBy: string;
  }>;
  message: string;
}

export default function VerifyMigrationPage() {
  const [result, setResult] = useState<DbCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/check-db-clients');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar la base de datos');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            🔍 Verificación de Base de Datos
          </h3>
        </div>
        
        <div className="p-6.5">
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Esta herramienta verifica directamente el estado de la base de datos para determinar 
              si la migración de clientes se completó exitosamente.
            </p>
            
            <button
              onClick={checkDatabase}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verificando base de datos...
                </div>
              ) : (
                '🔍 Verificar Estado de la Migración'
              )}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                ❌ Error:
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Mensaje principal */}
              <div className={`p-4 rounded-lg border ${
                result.summary.migrationCompleted 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : result.summary.totalClients > 0
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  result.summary.migrationCompleted
                    ? 'text-green-900 dark:text-green-100'
                    : result.summary.totalClients > 0
                      ? 'text-yellow-900 dark:text-yellow-100'
                      : 'text-red-900 dark:text-red-100'
                }`}>
                  {result.summary.migrationCompleted ? '✅ MIGRACIÓN COMPLETADA' : 
                   result.summary.totalClients > 0 ? '⚠️ MIGRACIÓN PARCIAL' : '❌ SIN DATOS'}
                </h4>
                <p className={`text-sm ${
                  result.summary.migrationCompleted
                    ? 'text-green-800 dark:text-green-200'
                    : result.summary.totalClients > 0
                      ? 'text-yellow-800 dark:text-yellow-200'
                      : 'text-red-800 dark:text-red-200'
                }`}>
                  {result.message}
                </p>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.summary.totalClients.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Total Clientes
                  </div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.summary.clientsWithRealEmail.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-800 dark:text-green-200">
                    Con Email Real
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {result.summary.clientsWithFiscalCode.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-200">
                    Con Código Fiscal
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                  📋 Información Adicional:
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Clientes creados por ti:</span>
                    <span className="ml-2 text-blue-600 dark:text-blue-400">{result.summary.yourClients}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Clientes con email temporal:</span>
                    <span className="ml-2 text-yellow-600 dark:text-yellow-400">{result.summary.clientsWithTempEmail}</span>
                  </div>
                  {result.summary.dateRange.oldest && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Fecha más antigua:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {new Date(result.summary.dateRange.oldest).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {result.summary.dateRange.newest && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Fecha más reciente:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {new Date(result.summary.dateRange.newest).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Clientes recientes */}
              {result.recentClients.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    📋 Últimos Clientes Registrados:
                  </h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                            Cliente
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                            Email
                          </th>
                          <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                            Fecha
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.recentClients.map((client) => (
                          <tr key={client.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="py-2 px-3 text-gray-900 dark:text-white">
                              {client.firstName} {client.lastName}
                            </td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                              {client.email.includes('@temp.com') ? (
                                <span className="text-yellow-600 dark:text-yellow-400 text-xs">
                                  {client.email}
                                </span>
                              ) : (
                                <span className="text-green-600 dark:text-green-400">
                                  {client.email}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-500 dark:text-gray-500">
                              {new Date(client.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
