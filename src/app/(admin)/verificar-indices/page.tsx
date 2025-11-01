"use client";

import React, { useState, useEffect } from 'react';

export default function VerificarIndicesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verificar = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/verificar-indices');
        
        if (!response.ok) {
          throw new Error('Error al verificar índices');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    verificar();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando índices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 max-w-md w-full">
          <div className="text-center">
            <div className="bg-red-100 dark:bg-red-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const indicesPorTabla = data?.indicesPorTabla || {};
  const indicesCriticos = data?.indicesCriticos || [];
  const testPerformance = data?.testPerformance || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 Verificación de Índices
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Estado de los índices en la base de datos
          </p>
        </div>

        {/* Resumen */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {data?.totalIndices || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Índices Encontrados
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {data?.tablasIndexadas || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Tablas Indexadas
              </div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${testPerformance < 50 ? 'text-green-600 dark:text-green-400' : testPerformance < 200 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                {testPerformance}ms
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Query Performance
              </div>
            </div>
          </div>
        </div>

        {/* Test de Performance */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            ⚡ Test de Performance
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                Query Biglietteria: <span className="font-bold">{testPerformance}ms</span>
              </p>
            </div>
            <div>
              {testPerformance < 50 ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-sm font-semibold">
                  ✅ EXCELENTE
                </span>
              ) : testPerformance < 200 ? (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full text-sm font-semibold">
                  ⚠️ BUENO
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full text-sm font-semibold">
                  ❌ LENTO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Índices Críticos */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            🎯 Índices Críticos
          </h2>
          <div className="space-y-2">
            {indicesCriticos.map((idx: any) => (
              <div key={idx.nombre} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-mono text-sm">
                  {idx.nombre}
                </span>
                {idx.presente ? (
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded text-xs font-semibold">
                    ✅
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded text-xs font-semibold">
                    ❌ FALTANTE
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Índices por Tabla */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            📊 Índices por Tabla
          </h2>
          <div className="space-y-4">
            {Object.entries(indicesPorTabla).map(([tabla, indices]: [string, any]) => (
              <div key={tabla} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{tabla}</h3>
                <div className="space-y-1">
                  {indices.map((idx: string) => (
                    <div key={idx} className="text-sm text-gray-600 dark:text-gray-400 font-mono pl-4">
                      ✅ {idx}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado General */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 mt-6">
          <div className="text-center">
            {testPerformance < 50 && (data?.totalIndices || 0) >= 25 ? (
              <div>
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                  Sistema Optimizado
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Todos los índices están aplicados y funcionando correctamente
                </p>
              </div>
            ) : (
              <div>
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                  Optimización Incompleta
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Algunos índices pueden no estar aplicados correctamente
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

