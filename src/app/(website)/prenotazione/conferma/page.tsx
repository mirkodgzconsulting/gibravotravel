"use client"
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/website/ui/button"

function OrderConfirmationContent() {
    const searchParams = useSearchParams()
    const bookingId = searchParams.get('bookingId')
    const sessionId = searchParams.get('session_id')

    // In a real app, we might fetch booking details here using bookingId 
    // to show dynamic info (e.g. "Roma Bus").

    return (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-[#323232] mb-2">Prenotazione Confermata!</h1>
            <p className="text-slate-600 mb-6">
                Grazie per il tuo acquisto. La tua prenotazione è stata registrata con successo.
            </p>

            <div className="bg-blue-50/50 rounded-lg p-4 mb-6 text-left border border-blue-100">
                <p className="text-sm text-slate-700 font-medium mb-2">
                    📩 1. Controlla la tua Email
                </p>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Abbiamo inviato la conferma a <strong>il tuo indirizzo email</strong>.
                </p>

                <p className="text-sm text-slate-700 font-medium mb-2">
                    🔑 2. Accedi all'Area Riservata
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                    Usa la stessa email inserita nel pagamento per accedere. Riceverai un codice OTP (senza password).
                </p>

                <div className="mt-4 pt-3 border-t border-blue-200/50">
                    <p className="text-[10px] text-slate-400 font-mono">
                        ID Ordine: {bookingId || "N/A"}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <Link href="/area-riservata">
                    <Button className="w-full h-12 text-lg">
                        Vai alla tua Area Riservata <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </Link>

                <Link href="/">
                    <Button variant="outline" className="w-full border-slate-200 h-12">
                        Torna alla Home
                    </Button>
                </Link>
            </div>
        </div>
    )
}

export default function OrderConfirmationPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Suspense fallback={<div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" /> Caricamento conferma...</div>}>
                <OrderConfirmationContent />
            </Suspense>
        </div>
    )
}
