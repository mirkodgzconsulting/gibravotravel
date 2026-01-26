"use client"

import { useState, useEffect } from "react"
import { ClockIcon, Trash2Icon, Bus, Plane, Users, CheckCircle2, Minus, Plus, Bed, BedDouble } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

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
        // New options
        optionCameraSingola?: boolean
        optionFlexibleCancel?: boolean
        priceFlexibleCancel?: number
        optionCameraPrivata?: boolean
        priceCameraPrivata?: number
    }
}

// Custom Icons matching reference
const IconTwinBeds = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 8h8v12H2z" />
        <path d="M2 10h8" />
        <path d="M2 6h8" />
        <path d="M4 10v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />

        <path d="M14 8h8v12h-8z" />
        <path d="M14 10h8" />
        <path d="M14 6h8" />
        <path d="M16 10v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3" />
    </svg>
)

const IconDoubleBed = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 8h20v12H2z" />
        <path d="M2 10h20" />
        <path d="M2 6h20" />
        <path d="M5 10v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        <path d="M13 10v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </svg>
)

// Mock Stops for Bus
const BUS_STOPS = [
    { id: "cologno", name: "Cologno Nord" },
    { id: "lambrate", name: "Lambrate" },
]

export const ShoppingCart = ({ tour }: ShoppingCartProps) => {
    const router = useRouter()

    // Split Counters
    const [countDonna, setCountDonna] = useState(1)
    const [countUomo, setCountUomo] = useState(0)

    const quantity = countDonna + countUomo

    const [selectedStop, setSelectedStop] = useState<string>("")

    // New Options State - UNIFIED
    const [selectedRoom, setSelectedRoom] = useState<'shared' | 'double' | 'private' | null>(null)
    const [selectedFlexibleCancel, setSelectedFlexibleCancel] = useState(false)

    // Dynamic Passenger State
    const [passengers, setPassengers] = useState<{ firstName: string, lastName: string, cf: string }[]>([
        { firstName: "", lastName: "", cf: "" }
    ])

    // Update passengers array when total quantity changes
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

    // Pricing Logic
    const basePrice = tour.price * quantity;
    const flexibleCancelCost = selectedFlexibleCancel && tour.priceFlexibleCancel ? tour.priceFlexibleCancel * quantity : 0;

    // Private room cost only applies if 'private' is selected
    const privateRoomCost = selectedRoom === 'private' && tour.priceCameraPrivata ? tour.priceCameraPrivata * quantity : 0;

    const subtotal = basePrice + flexibleCancelCost + privateRoomCost;
    const total = subtotal;

    const handleProceed = () => {
        if (tour.type === 'bus' && !selectedStop) {
            alert("Seleziona una fermata di partenza");
            return;
        }

        if (quantity === 0) {
            alert("Seleziona almeno un passeggero");
            return;
        }

        if (!selectedRoom && tour.optionCameraSingola) {
            // Optional validation: force room selection? 
            // If implicit default is needed, handle here. For now, proceeding is allowed (defaults to standard distribution if null).
        }

        // Validate names
        for (const p of passengers) {
            if (!p.firstName || !p.lastName) {
                alert("Inserisci tutti i nomi dei passeggeri");
                return;
            }
        }

        // Serialize state
        sessionStorage.setItem("cart_booking", JSON.stringify({
            tour,
            quantity,
            countDonna,
            countUomo,
            selectedStop,
            passengers,
            total,
            options: {
                sharedRoom: selectedRoom === 'shared',
                doubleRoom: selectedRoom === 'double',
                privateRoom: selectedRoom === 'private',
                flexibleCancel: selectedFlexibleCancel,
                roomType: selectedRoom // Explicit type
            }
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
                                    <div className="space-y-6">
                                        {/* Row 1: Passengers */}
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-400 mb-3 block">Passeggeri</label>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                {/* Donna Counter */}
                                                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 flex-1">
                                                    <span className="font-medium text-slate-700">Donna</span>
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="outline" size="icon" className="h-8 w-8 rounded-full bg-white"
                                                            onClick={() => setCountDonna(Math.max(0, countDonna - 1))}
                                                            disabled={quantity <= 1 && countDonna === 1}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="font-bold w-4 text-center">{countDonna}</span>
                                                        <Button
                                                            variant="outline" size="icon" className="h-8 w-8 rounded-full bg-white"
                                                            onClick={() => setCountDonna(countDonna + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Uomo Counter */}
                                                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50 flex-1">
                                                    <span className="font-medium text-slate-700">Uomo</span>
                                                    <div className="flex items-center gap-3">
                                                        <Button
                                                            variant="outline" size="icon" className="h-8 w-8 rounded-full bg-white"
                                                            onClick={() => setCountUomo(Math.max(0, countUomo - 1))}
                                                            disabled={quantity <= 1 && countUomo === 1}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="font-bold w-4 text-center">{countUomo}</span>
                                                        <Button
                                                            variant="outline" size="icon" className="h-8 w-8 rounded-full bg-white"
                                                            onClick={() => setCountUomo(countUomo + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ROOM TYPE SELECTION - 2 BOXES */}
                                        {/* Only show if tour supports shared rooms (Camera Singola in this context) */}
                                        {tour.optionCameraSingola && (
                                            <div>
                                                <label className="text-xs font-bold uppercase text-slate-400 mb-3 block">Sistemazione</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Option 1: Camera Singola (Shared Logic) */}
                                                    <div
                                                        onClick={() => setSelectedRoom(selectedRoom === 'shared' ? null : 'shared')}
                                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRoom === 'shared' ? 'border-[#FE8008] bg-orange-50' : 'border-slate-100 hover:border-slate-200'} h-full`}
                                                    >
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className={`h-10 w-14 flex items-center justify-center rounded-lg transition-colors ${selectedRoom === 'shared' ? 'bg-[#FE8008] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                <IconTwinBeds className="w-8 h-8" />
                                                            </div>
                                                            <span className={`font-bold ${selectedRoom === 'shared' ? 'text-[#FE8008]' : 'text-slate-700'}`}>Camera Singola</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 leading-snug">
                                                            Per chi viaggia da solo.
                                                            <br /><span className="italic text-[10px]">(Condividi la camera con un altro viaggiatore)</span>
                                                        </p>
                                                    </div>

                                                    {/* Option 2: Camera Matrimoniale */}
                                                    <div
                                                        onClick={() => setSelectedRoom(selectedRoom === 'double' ? null : 'double')}
                                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedRoom === 'double' ? 'border-[#004BA5] bg-blue-50' : 'border-slate-100 hover:border-slate-200'} h-full`}
                                                    >
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className={`h-10 w-14 flex items-center justify-center rounded-lg transition-colors ${selectedRoom === 'double' ? 'bg-[#004BA5] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                <IconDoubleBed className="w-8 h-8" />
                                                            </div>
                                                            <span className={`font-bold ${selectedRoom === 'double' ? 'text-[#004BA5]' : 'text-slate-700'}`}>Camera Matrimoniale</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 leading-snug">
                                                            Ideale per coppie o amici.
                                                            <br /><span className="italic text-[10px]">(Una camera per due persone)</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Row 2: Bus Stop (if applicable) */}
                                        {tour.type === 'bus' && (
                                            <div className="space-y-2 pt-2">
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

                        {/* Additional Options Section (New) */}
                        {(tour.optionFlexibleCancel || tour.optionCameraPrivata) && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                                <h4 className="font-bold text-lg flex items-center gap-2 text-[#323232]">
                                    <CheckCircle2 className="h-5 w-5 text-[#FE8008]" />
                                    Opzioni Aggiuntive
                                </h4>

                                <div className="space-y-4">
                                    {/* Flexible Cancellation */}
                                    {tour.optionFlexibleCancel && (
                                        <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-blue-100 transition-colors cursor-pointer" onClick={() => setSelectedFlexibleCancel(!selectedFlexibleCancel)}>
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={selectedFlexibleCancel}
                                                    onCheckedChange={(c) => setSelectedFlexibleCancel(!!c)}
                                                />
                                                <div>
                                                    <p className="font-bold text-slate-700">Cancella senza pensieri</p>
                                                    <p className="text-xs text-slate-500">Rimborso garantito fino a 48h prima</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-[#323232]">
                                                + €{tour.priceFlexibleCancel} <span className="text-xs font-normal text-slate-400">/pers</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Private Room - NOW EXCLUSIVE */}
                                    {tour.optionCameraPrivata && (
                                        <div
                                            className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${selectedRoom === 'private' ? 'border-[#FE8008] bg-orange-50/50' : 'border-slate-100 hover:border-blue-100'}`}
                                            onClick={() => setSelectedRoom(selectedRoom === 'private' ? null : 'private')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={selectedRoom === 'private'}
                                                    onCheckedChange={(c) => setSelectedRoom(c ? 'private' : null)}
                                                />
                                                <div>
                                                    <p className="font-bold text-slate-700">Camera Privata</p>
                                                    <p className="text-xs text-slate-500">Goditi la tua privacy durante il viaggio</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-[#323232]">
                                                + €{tour.priceCameraPrivata} <span className="text-xs font-normal text-slate-400">/pers</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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

                                        {countDonna > 0 && (
                                            <div className="flex items-center justify-between text-xs text-slate-400 pl-2">
                                                <span>Donna</span>
                                                <span>x {countDonna}</span>
                                            </div>
                                        )}
                                        {countUomo > 0 && (
                                            <div className="flex items-center justify-between text-xs text-slate-400 pl-2">
                                                <span>Uomo</span>
                                                <span>x {countUomo}</span>
                                            </div>
                                        )}

                                        {selectedFlexibleCancel && (
                                            <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-dashed border-slate-100 mt-2">
                                                <span className="font-medium text-xs">Flexi Cancel</span>
                                                <span className="font-bold text-xs">+ €{(tour.priceFlexibleCancel || 0) * quantity}</span>
                                            </div>
                                        )}

                                        {selectedRoom === 'private' && (
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span className="font-medium text-xs">Camera Privata</span>
                                                <span className="font-bold text-xs">+ €{(tour.priceCameraPrivata || 0) * quantity}</span>
                                            </div>
                                        )}

                                        {/* Optional: Show selection type in summary if desired */}
                                        {selectedRoom === 'shared' && (
                                            <div className="flex items-center justify-between text-slate-400 italic">
                                                <span className="font-medium text-xs">Camera:</span>
                                                <span className="text-xs">Singola (Shared)</span>
                                            </div>
                                        )}
                                        {selectedRoom === 'double' && (
                                            <div className="flex items-center justify-between text-slate-400 italic">
                                                <span className="font-medium text-xs">Camera:</span>
                                                <span className="text-xs">Matrimoniale</span>
                                            </div>
                                        )}

                                        {tour.type === 'bus' && selectedStop && (
                                            <div className="flex items-center justify-between text-[#004BA5] pt-2">
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
