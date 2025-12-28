"use client"

import { useState } from "react"
import { Button } from "@/components/website/ui/button"
import { CreditCard, Users, ShieldCheck, Loader2 } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"

// You should put this in env public variable, but for now we put a placeholder or expect it to be there
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface BookingFormProps {
    tourId: string
    tourType: string
    price: number
    initialUserData?: {
        firstName: string
        lastName: string
        email: string
        phone: string
    }
}

export function BookingForm({ tourId, tourType, price, initialUserData }: BookingFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        firstName: initialUserData?.firstName || "",
        lastName: initialUserData?.lastName || "",
        email: initialUserData?.email || "",
        phone: initialUserData?.phone || ""
    })

    const handlePayment = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tourId,
                    tourType,
                    guestData: formData
                })
            })

            const data = await response.json()

            if (data.error) {
                alert("Errore: " + data.error)
                setIsLoading(false)
                return
            }

            // Redirect to Stripe
            if (data.url) {
                window.location.href = data.url
            }

        } catch (error) {
            console.error("Checkout Request Failed", error)
            alert("Errore di connessione. Riprova.")
            setIsLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: User Details Form */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-[900] text-[#323232] mb-6 flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#004BA5]" />
                        I tuoi dati
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#004BA5]/20"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Cognome</label>
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#004BA5]/20"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#004BA5]/20"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Telefono</label>
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#004BA5]/20"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-xl flex gap-3 items-start">
                        <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800 font-medium leading-relaxed">
                            I tuoi dati sono al sicuro. Usiamo crittografia SSL avanzata per proteggere le tue informazioni.
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Payment Action */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-24 p-6 space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Quota Base (1 Adulto)</span>
                            <span className="font-bold">€{price}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Tasse e gestione</span>
                            <span className="font-bold">Incluso</span>
                        </div>
                        <div className="flex justify-between items-center text-[#323232] text-xl font-[900] pt-4 border-t border-slate-100 mt-2">
                            <span>Totale</span>
                            <span>€{price}</span>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <Button
                            onClick={handlePayment}
                            disabled={isLoading}
                            className="w-full h-[60px] text-lg bg-[#FE8008] hover:bg-[#FE8008]/90 text-white font-[800] rounded-xl shadow-lg hover:shadow-xl transition-all shadow-orange-500/20"
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Elaborazione...</>
                            ) : (
                                <>Procedi al Pagamento <CreditCard className="ml-2 h-5 w-5" /></>
                            )}
                        </Button>
                        <p className="text-center text-xs text-slate-400 font-medium">
                            Con Stripe, il pagamento è 100% sicuro.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
