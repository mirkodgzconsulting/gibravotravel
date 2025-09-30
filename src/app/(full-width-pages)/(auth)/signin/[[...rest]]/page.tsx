"use client";

import { SignIn } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Già loggato
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Chiudi sessione o torna al tuo pannello.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            Torna al Dashboard
          </button>
        </div>
      </div>
    );
  }

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
            
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sistema di gestione
          </p>
        </div>

        {/* Clerk Sign In */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-brand-500 hover:bg-brand-600 text-sm normal-case",
                card: "shadow-theme-lg border border-gray-200 dark:border-gray-800",
                headerTitle: "text-gray-900 dark:text-white",
                headerSubtitle: "text-gray-600 dark:text-gray-400",
                socialButtonsBlockButton: 
                  "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
                formFieldInput: 
                  "border border-gray-200 dark:border-gray-700 focus:border-brand-500 focus:ring-brand-500",
                footerActionLink: "text-brand-500 hover:text-brand-600",
              },
              variables: {
                colorPrimary: "#0044b3",
                colorBackground: "#ffffff",
                colorInputBackground: "#ffffff",
                colorInputText: "#000000",
              },
            }}
            signUpUrl={undefined}
            forceRedirectUrl="/"
          />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>© 2024 GiBravo Travel. Tutti i diritti riservati.</p>
        </div>
      </div>
    </div>
  );
}
