"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function LimpiarConexionesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const limpiarConexiones = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/clean-connections", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✅ Conexiones limpiadas exitosamente");
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        setError(`❌ Error: ${data.error || "Error desconocido"}`);
      }
    } catch (err) {
      setError("❌ Error al limpiar conexiones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Limpiar Conexiones BD" />
      
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Limpiar Conexiones de Base de Datos</h2>
          
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Esta herramienta cierra todas las conexiones activas a la base de datos y las reconecta.
              Úsala si experimentas errores como "Error al cargar tours" o "Too many connections".
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Aviso:</strong> Esta acción cerrará temporalmente todas las conexiones activas.
                Los usuarios podrían experimentar una breve interrupción (1-2 segundos).
              </p>
            </div>
          </div>

          {message && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <p className="text-green-800 dark:text-green-200">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <button
            onClick={limpiarConexiones}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Limpiando..." : "Limpiar Conexiones"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
}

