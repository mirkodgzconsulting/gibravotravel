'use client';

import { useState } from 'react';

export default function MigrateClientsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/migrate-clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la migración');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            Migración de Clientes desde WordPress
          </h3>
        </div>
        
        <div className="p-6.5">
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Esta herramienta migrará todos los clientes desde el archivo Excel de WordPress 
              a la nueva base de datos. Se procesarán <strong>4,156 registros</strong>.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                ⚠️ Información importante:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Se validarán solo registros con Nome y Cognome</li>
                <li>• Se generarán emails temporales para registros sin email</li>
                <li>• Se manejarán códigos fiscales cuando estén disponibles</li>
                <li>• El proceso puede tomar varios minutos</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleMigration}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Migrando clientes...
              </div>
            ) : (
              '🚀 Iniciar Migración'
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                ❌ Error:
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">
                ✅ Migración Completada
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-800 dark:text-green-200">Total procesados:</span>
                  <span className="font-medium">{result.summary.totalProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800 dark:text-green-200">✅ Insertados:</span>
                  <span className="font-medium text-green-600">{result.summary.successCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800 dark:text-green-200">⚠️ Saltados:</span>
                  <span className="font-medium text-yellow-600">{result.summary.skippedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800 dark:text-green-200">❌ Errores:</span>
                  <span className="font-medium text-red-600">{result.summary.errorCount}</span>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">
                    Errores encontrados:
                  </h5>
                  <div className="max-h-32 overflow-y-auto">
                    {result.errors.map((err: any, index: number) => (
                      <div key={index} className="text-xs text-red-700 dark:text-red-300">
                        Fila {err.row}: {err.error}
                      </div>
                    ))}
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
