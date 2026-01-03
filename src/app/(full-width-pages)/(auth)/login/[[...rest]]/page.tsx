"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative p-4">
            {/* Back to Home Link */}
            <Link
                href="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-[#004BA5] transition-colors font-semibold text-sm"
            >
                <ChevronLeft className="h-4 w-4" />
                Torna alla Home
            </Link>

            <div className="w-full max-w-[440px] space-y-8">
                {/* Brand Header */}
                <div className="text-center space-y-4">
                    <Link href="/">
                        <Image
                            src="/Logo_gibravo.svg"
                            alt="GiBravo Travel"
                            width={200}
                            height={60}
                            className="mx-auto mb-2"
                            priority
                        />
                    </Link>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-[700] text-slate-900 tracking-tight">
                            Area Riservata Viaggiatori
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Accedi per gestire i tuoi tour e documenti
                        </p>
                    </div>
                </div>

                {/* Clerk Sign In */}
                <div className="flex justify-center shadow-2xl shadow-blue-900/10 rounded-2xl overflow-hidden bg-white border border-slate-100">
                    <SignIn
                        routing="path"
                        path="/login"
                        forceRedirectUrl="/area-riservata"
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "shadow-none border-none w-full p-8",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                formButtonPrimary:
                                    "bg-[#004BA5] hover:bg-[#003580] text-sm py-3 normal-case font-bold transition-all shadow-md",
                                socialButtonsBlockButton:
                                    "border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium transition-colors",
                                formFieldInput:
                                    "border border-slate-200 focus:border-[#004BA5] focus:ring-1 focus:ring-[#004BA5] rounded-lg transition-all",
                                footerAction: "!hidden", // Aggressively hide the "Don't have an account?" text
                                footerActionText: "!hidden",
                                footerActionLink: "!hidden",
                                dividerLine: "bg-slate-100",
                                dividerText: "text-slate-400 text-[10px] uppercase font-bold",
                                formFieldLabel: "text-slate-600 font-semibold mb-1 text-sm",
                                footer: "!hidden", // Hide footer entirely
                            },
                            variables: {
                                colorPrimary: "#004BA5",
                                borderRadius: "12px",
                            },
                        }}
                    />
                </div>

                {/* Info for Non-Customers */}
                <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4 text-center">
                    <p className="text-xs text-blue-800 leading-relaxed">
                        Non hai ancora un account? <br />
                        Riceverai i tuoi dati di accesso via email <span className="font-bold">automaticamente</span> dopo la prenotazione del tuo primo viaggio con GiBravo.
                    </p>
                </div>

                {/* Footer Links */}
                <div className="text-center !mt-12">
                    <p className="text-[11px] text-slate-400 font-medium">
                        © 2026 GiBravo Travel • Tutti i diritti riservati
                    </p>
                </div>
            </div>
        </div>
    );
}
