"use client"

import { useState, useEffect } from "react"
import { ClockIcon, Trash2Icon, Bus, Plane, Users, CheckCircle2 } from "lucide-react"
import { Link } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSearchParams, useRouter } from "next/navigation"

interface ShoppingCartProps {
    tour: {
        id: string
        slug: string
        title: string
        price: number
        priceChild?: number
        image: string
        type: 'bus' | 'aereo'
        date: string
        duration: string
    }
}

// Mock Stops for Bus
const BUS_STOPS = [
    { id: "cologno", name: "Cologno Nord" },
    { id: "lambrate", name: "Lambrate" },
]

export const ShoppingCart = ({ tour }: ShoppingCartProps) => {
    const router = useRouter()
    const [quantity, setQuantity] = useState(1)
    const [selectedStop, setSelectedStop] = useState<string>("")

    // Dynamic Passenger State
    const [passengers, setPassengers] = useState<{ firstName: string, lastName: string, cf: string }[]>([
        { firstName: "", lastName: "", cf: "" }
    ])

    // Update passengers array when quantity changes
    useEffect(() => {
        setPassengers(prev => {
            const newPassengers = [...prev];
            if (quantity > prev.length) {
                // Add new empty passengers
                for (let i = prev.length; i < quantity; i++) {
                    newPassengers.push({ firstName: "", lastName: "", cf: "" });
                }
            } else if (quantity < prev.length) {
                // Remove excess
                return newPassengers.slice(0, quantity);
            }
            return newPassengers;
        });
    }, [quantity]);

    const handlePassengerChange = (index: number, field: string, value: string) => {
        const newPassengers = [...passengers];
        // @ts-ignore
        newPassengers[index][field] = value;
        setPassengers(newPassengers);
    }

    const subtotal = tour.price * quantity;
    const tax = 0; // Included
    const total = subtotal;

    const handleProceed = () => {
        if (tour.type === 'bus' && !selectedStop) {
            alert("Seleziona una fermata di partenza");
            return;
        }

        // Validate names
        for (const p of passengers) {
            if (!p.firstName || !p.lastName) {
                alert("Inserisci tutti i nomi dei passeggeri");
                return;
            }
        }

        // Serialize state to pass to Checkout (using URL params for simplicity now, or LocalStorage)
        // For security/cleanliness, URL params with JSON might be ugly but functional for now. 
        // Better: Checkout page uses this same component structure or we persist to a store. 
        // Let's use Session Storage + Router
        sessionStorage.setItem("cart_booking", JSON.stringify({
            tour,
            quantity,
            selectedStop,
            passengers,
            total
        }));

        router.push(`/prenotazione/${tour.slug}/checkout`);
    }

    return (
        <section className="bg-slate-50 pb-8 pt-40 sm:py-16 lg:py-24 min-h-screen md:pt-40">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - Product & Configuration */}
                    <div className="space-y-6 px-0 lg:px-6 lg:col-span-2">
                        <div className="flex w-full items-center justify-between">
                            <div className="text-2xl font-bold text-[#323232]">Il tuo Carrello</div>
                            <div className="text-slate-500">1 Tour selezionato</div>
                        </div>

                        {/* Tour Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex gap-6 max-sm:flex-col sm:items-start">
                                <div className="relative aspect-video w-full md:w-48 rounded-xl overflow-hidden shrink-0">
                                    <img src={tour.image} alt={tour.title} className="object-cover h-full w-full" />
                                </div>

                                <div className="space-y-4 flex-grow">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-xl text-[#323232]">{tour.title}</h3>
                                            <p className="text-xl font-black text-[#004BA5]">€{tour.price}</p>
                                        </div>
                                        <p className="text-slate-500 flex items-center gap-2 text-sm">
                                            <ClockIcon className="h-4 w-4" /> {tour.duration} • {new Date(tour.date).toLocaleDateString('it-IT')}
                                        </p>
                                    </div>

                                    <Separator />

                                    {/* Configuration */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-400">Passeggeri</label>
                                            <Select
                                                value={quantity.toString()}
                                                onValueChange={(v) => setQuantity(parseInt(v))}
                                            >
                                                <SelectTrigger className="w-full bg-white text-black border-slate-200 h-10">
                                                    <SelectValue placeholder="Seleziona" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white text-black border-slate-200">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                        <SelectItem key={n} value={n.toString()} className="hover:bg-slate-100">{n} Persona{n > 1 ? 'e' : ''}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {tour.type === 'bus' && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-400">Fermata Partenza</label>
                                                <Select value={selectedStop} onValueChange={setSelectedStop}>
                                                    <SelectTrigger className="w-full bg-white text-black border-slate-200 h-10">
                                                        <SelectValue placeholder="Seleziona Fermata" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white text-black border-slate-200">
                                                        {BUS_STOPS.map(stop => (
                                                            <SelectItem key={stop.id} value={stop.name} className="hover:bg-slate-100">{stop.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Passenger Details Form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                            <h4 className="font-bold text-lg flex items-center gap-2 text-[#323232]">
                                <Users className="h-5 w-5 text-[#004BA5]" />
                                Dati Passeggeri
                            </h4>
                            <p className="text-sm text-slate-500 mb-4">Inserisci i dati di chi parteciperà al viaggio.</p>

                            <div className="space-y-6">
                                {passengers.map((p, i) => (
                                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 pb-6">
                                        <div className="mb-3 text-xs font-bold uppercase text-[#004BA5] tracking-wider">
                                            Passeggero {i + 1}
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-500">Nome *</Label>
                                                <Input
                                                    value={p.firstName}
                                                    onChange={(e) => handlePassengerChange(i, 'firstName', e.target.value)}
                                                    className="bg-white text-black border-slate-200"
                                                    placeholder="Mario"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-500">Cognome *</Label>
                                                <Input
                                                    value={p.lastName}
                                                    onChange={(e) => handlePassengerChange(i, 'lastName', e.target.value)}
                                                    className="bg-white text-black border-slate-200"
                                                    placeholder="Rossi"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-500">Codice Fiscale</Label>
                                                <Input
                                                    value={p.cf}
                                                    onChange={(e) => handlePassengerChange(i, 'cf', e.target.value)}
                                                    className="bg-white text-black border-slate-200"
                                                    placeholder="RSSMRA..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Summary */}
                    <div className="space-y-6">
                        <Card className="w-full border-0 shadow-lg sticky top-24 rounded-2xl overflow-hidden bg-white">
                            <div className="bg-white p-6 border-b border-slate-100">
                                <CardTitle className="text-lg text-[#323232] font-bold">Riepilogo</CardTitle>
                            </div>
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-700 font-medium">Prezzo per persona</span>
                                            <span className="font-bold text-[#323232]">€{tour.price}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-700 font-medium">Passeggeri</span>
                                            <span className="font-bold text-[#323232]">x {quantity}</span>
                                        </div>
                                        {tour.type === 'bus' && selectedStop && (
                                            <div className="flex items-center justify-between text-[#004BA5]">
                                                <span className="font-medium">Fermata Bus</span>
                                                <span className="font-bold text-right">{selectedStop}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-[#323232]">Totale</span>
                                        <span className="text-2xl font-black text-[#004BA5]">€{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex-col items-start gap-4 bg-slate-50 border-t border-slate-100 p-6">
                                <Button
                                    onClick={handleProceed}
                                    className="w-full h-12 text-lg bg-[#FE8008] hover:bg-[#FE8008]/90 font-bold shadow-orange-500/20 shadow-lg text-white"
                                >
                                    Procedi al Checkout
                                </Button>
                                <div className="w-full flex justify-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
                                    <img src="https://cdn.shadcnstudio.com/ss-assets/brand-logo/visa.png" alt="Visa" className="h-4" />
                                    <img src="https://cdn.shadcnstudio.com/ss-assets/brand-logo/master.png" alt="Mastercard" className="h-4" />
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ShoppingCart
