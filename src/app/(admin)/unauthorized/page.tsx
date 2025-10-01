"use client";

import React from "react";
import { useUser as useClerkUser } from "@clerk/nextjs";
import Image from "next/image";

export default function UnauthorizedPage() {
  const { user } = useClerkUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Logo */}
        <div className="text-center">
          <Image
            src="/images/logo/Logo_gibravo.svg"
            alt="GiBravo Travel"
            width={200}
            height={60}
            className="mx-auto mb-6"
          />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Accesso Non Autorizzato
          </h2>
        </div>

        {/* Contenido */}
        <div className="text-center space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Account Non Configurato
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm">
              Il tuo account non è stato configurato nel sistema de gestione.
            </p>
          </div>

          {user && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Informazioni Account:
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Nome:</strong> {user.firstName} {user.lastName}
              </p>
            </div>
          )}

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              Prossimi Passi:
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 text-left">
              <li>• Contatta l&apos;amministratore TI</li>
              <li>• Richiedi la creazione del tuo account</li>
              <li>• Specifica il ruolo richiesto (USER, ADMIN, TI)</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.href = '/signin'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          >
            Torna al Login
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>© 2024 GiBravo Travel. Sistema de Gestione.</p>
        </div>
      </div>
    </div>
  );
}
