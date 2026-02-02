"use client"

import { useState, useEffect } from "react"
import { ClockIcon, Trash2Icon, Bus, Plane, Users, CheckCircle2, Minus, Plus, Bed, BedDouble, User, Info } from "lucide-react"

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
    const [countDonna, setCountDonna] = useState(0)
    const [countUomo, setCountUomo] = useState(0)

    const quantity = countDonna + countUomo

    const [selectedStop, setSelectedStop] = useState<string>("")

    // New Options State - UNIFIED
    const [selectedRoom, setSelectedRoom] = useState<'shared' | 'double' | 'private' | 'twin' | 'triple' | 'triple_request' | null>(null)
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
                twinRoom: selectedRoom === 'twin',
                tripleRoom: selectedRoom === 'triple',
                flexibleCancel: selectedFlexibleCancel,
                roomType: selectedRoom // Explicit type
            }
        }));

        router.push(`/prenotazione/${tour.slug}/checkout`);
    }

    return (
        <section className="bg-slate-50 min-h-screen pb-12 pt-24 sm:pt-32 lg:pt-36">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - Product & Configuration */}
                    <div className="space-y-6 px-0 lg:px-6 lg:col-span-2">
                        <div className="flex w-full items-center justify-between">
                            <div className="text-2xl font-bold text-[#323232]">Il tuo Carrello</div>
                            <div className="text-slate-500">1 Tour selezionato</div>
                        </div>

                        {/* Tour Card */}
                        {/* Unified Tour & Configuration Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 space-y-6 sm:space-y-8">

                            {/* Header: Image, Title, Price */}
                            <div className="flex gap-4 sm:gap-6 max-sm:flex-col sm:items-start">
                                <div className="relative aspect-video w-full md:w-48 rounded-xl overflow-hidden shrink-0">
                                    <img src={tour.image} alt={tour.title} className="object-cover h-full w-full" />
                                </div>

                                <div className="space-y-2 flex-grow">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-2xl text-[#323232] uppercase">{tour.title}</h3>
                                        <p className="text-2xl font-black text-[#004BA5]">€{tour.price}</p>
                                    </div>
                                    <p className="text-slate-500 flex items-center gap-2 text-sm">
                                        <ClockIcon className="h-4 w-4" /> {tour.duration} • {new Date(tour.date).toLocaleDateString('it-IT')}
                                    </p>
                                </div>
                            </div>

                            {/* Passengers Section - Pill Design */}
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-4 block">Passeggeri</label>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    {/* Donna Pill */}
                                    <div className="flex items-center justify-between p-2 pl-6 pr-2 bg-slate-50 rounded-full border border-slate-100 flex-1">
                                        <span className="font-medium text-slate-700">Donna</span>
                                        <div className="flex items-center gap-4">
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200"
                                                onClick={() => setCountDonna(Math.max(0, countDonna - 1))}
                                                disabled={countDonna <= 0}
                                            >
                                                <Minus className="h-4 w-4 text-slate-400" />
                                            </Button>
                                            <span className="font-bold text-lg w-4 text-center">{countDonna}</span>
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                                                onClick={() => setCountDonna(countDonna + 1)}
                                            >
                                                <Plus className="h-4 w-4 text-[#323232]" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Uomo Pill */}
                                    <div className="flex items-center justify-between p-2 pl-6 pr-2 bg-slate-50 rounded-full border border-slate-100 flex-1">
                                        <span className="font-medium text-slate-700">Uomo</span>
                                        <div className="flex items-center gap-4">
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200"
                                                onClick={() => setCountUomo(Math.max(0, countUomo - 1))}
                                                disabled={countUomo <= 0}
                                            >
                                                <Minus className="h-4 w-4 text-slate-400" />
                                            </Button>
                                            <span className="font-bold text-lg w-4 text-center">{countUomo}</span>
                                            <Button
                                                variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white hover:shadow-sm"
                                                onClick={() => setCountUomo(countUomo + 1)}
                                            >
                                                <Plus className="h-4 w-4 text-[#323232]" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SISTEMAZIONE - 6 Card Grid */}
                            {/* SISTEMAZIONE - 5 Card Grid (Unified) */}
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-4 block">Sistemazione</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

                                    {/* 1. Camera Singola */}
                                    <div
                                        onClick={() => setSelectedRoom(selectedRoom === 'private' ? null : 'private')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 h-full relative group ${selectedRoom === 'private' ? 'border-[#004BA5] bg-blue-50/30 ring-1 ring-[#004BA5] shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${selectedRoom === 'private' ? 'bg-[#004BA5] text-white' : 'bg-slate-100 text-slate-500 group-hover:text-[#004BA5]'}`}>
                                                <User className="w-5 h-5" />
                                            </div>
                                            <span className={`font-bold text-sm ${selectedRoom === 'private' ? 'text-[#004BA5]' : 'text-[#323232]'}`}>Camera Singola</span>
                                            {selectedRoom === 'private' && <CheckCircle2 className="w-5 h-5 text-[#004BA5] ml-auto animate-in fade-in zoom-in duration-200" />}
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-xs text-slate-500 leading-snug">
                                                Per chi viaggia da solo e desidera una camera privata.
                                            </p>
                                            {selectedRoom === 'private' && (
                                                <div className="pt-2 border-t border-blue-100 animate-in fade-in slide-in-from-top-1">
                                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Supplemento</p>
                                                    <p className="text-sm font-black text-[#004BA5]">+ €{tour.priceCameraPrivata || 0}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Camera Matrimoniale */}
                                    <div
                                        onClick={() => setSelectedRoom(selectedRoom === 'double' ? null : 'double')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 h-full relative group ${selectedRoom === 'double' ? 'border-[#004BA5] bg-blue-50/30 ring-1 ring-[#004BA5] shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${selectedRoom === 'double' ? 'bg-[#004BA5] text-white' : 'bg-slate-100 text-slate-500 group-hover:text-[#004BA5]'}`}>
                                                <BedDouble className="w-5 h-5" />
                                            </div>
                                            <span className={`font-bold text-sm ${selectedRoom === 'double' ? 'text-[#004BA5]' : 'text-[#323232]'}`}>Matrimoniale</span>
                                            {selectedRoom === 'double' && <CheckCircle2 className="w-5 h-5 text-[#004BA5] ml-auto animate-in fade-in zoom-in duration-200" />}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-snug">
                                            Ideale per coppie. Una camera con letto matrimoniale.
                                        </p>
                                    </div>

                                    {/* 3. Camera Doppia */}
                                    <div
                                        onClick={() => setSelectedRoom(selectedRoom === 'twin' ? null : 'twin')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 h-full relative group ${selectedRoom === 'twin' ? 'border-[#004BA5] bg-blue-50/30 ring-1 ring-[#004BA5] shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${selectedRoom === 'twin' ? 'bg-[#004BA5] text-white' : 'bg-slate-100 text-slate-500 group-hover:text-[#004BA5]'}`}>
                                                <Bed className="w-5 h-5" />
                                            </div>
                                            <span className={`font-bold text-sm ${selectedRoom === 'twin' ? 'text-[#004BA5]' : 'text-[#323232]'}`}>Camera Doppia</span>
                                            {selectedRoom === 'twin' && <CheckCircle2 className="w-5 h-5 text-[#004BA5] ml-auto animate-in fade-in zoom-in duration-200" />}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-snug">
                                            Per amici o familiari. Preferiscono letti separati.
                                        </p>
                                    </div>

                                    {/* 4. Camera Condivisa */}
                                    <div
                                        onClick={() => setSelectedRoom(selectedRoom === 'shared' ? null : 'shared')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 h-full relative group ${selectedRoom === 'shared' ? 'border-[#004BA5] bg-blue-50/30 ring-1 ring-[#004BA5] shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${selectedRoom === 'shared' ? 'bg-[#004BA5] text-white' : 'bg-slate-100 text-slate-500 group-hover:text-[#004BA5]'}`}>
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className={`font-bold text-sm ${selectedRoom === 'shared' ? 'text-[#004BA5]' : 'text-[#323232]'}`}>Condivisa</span>
                                            {selectedRoom === 'shared' && <CheckCircle2 className="w-5 h-5 text-[#004BA5] ml-auto animate-in fade-in zoom-in duration-200" />}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-snug">
                                            Viaggi da solo ma vuoi condividere la camera (stesso sesso).
                                        </p>
                                    </div>

                                    {/* 5. Camera Tripla */}
                                    <div
                                        onClick={() => setSelectedRoom(selectedRoom === 'triple' ? null : 'triple')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 h-full relative group ${selectedRoom === 'triple' ? 'border-[#004BA5] bg-blue-50/30 ring-1 ring-[#004BA5] shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${selectedRoom === 'triple' ? 'bg-[#004BA5] text-white' : 'bg-slate-100 text-slate-500 group-hover:text-[#004BA5]'}`}>
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className={`font-bold text-sm ${selectedRoom === 'triple' ? 'text-[#004BA5]' : 'text-[#323232]'}`}>Camera Tripla</span>
                                            {selectedRoom === 'triple' && <CheckCircle2 className="w-5 h-5 text-[#004BA5] ml-auto animate-in fade-in zoom-in duration-200" />}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-snug">
                                            Per tre persone nella stessa camera.
                                        </p>
                                    </div>

                                    {/* 6. Camera Tripla (Richiesta) */}
                                    {/* 6. Camera Tripla (Richiesta) */}
                                    <div
                                        onClick={() => setSelectedRoom(selectedRoom === 'triple_request' ? null : 'triple_request')}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 h-full relative group ${selectedRoom === 'triple_request' ? 'border-[#004BA5] bg-blue-50/30 ring-1 ring-[#004BA5] shadow-sm' : 'border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg transition-colors ${selectedRoom === 'triple_request' ? 'bg-[#004BA5] text-white' : 'bg-slate-100 text-slate-500 group-hover:text-[#004BA5]'}`}>
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className={`font-bold text-sm ${selectedRoom === 'triple_request' ? 'text-[#004BA5]' : 'text-[#323232]'}`}>
                                                Camera Tripla <span className="font-normal text-slate-500 ml-1">(su richiesta)</span>
                                            </span>
                                            {selectedRoom === 'triple_request' && <CheckCircle2 className="w-5 h-5 text-[#004BA5] ml-auto animate-in fade-in zoom-in duration-200" />}
                                        </div>
                                        <p className="text-xs text-slate-500 leading-snug">
                                            Per tre persone.
                                        </p>
                                        <div className={`mt-auto pt-1 flex items-center gap-1.5 ${selectedRoom === 'triple_request' ? 'text-[#004BA5]' : 'text-slate-400'}`}>
                                            <Info className="w-3 h-3" />
                                            <span className="text-[10px] font-medium">Soggetta a riconferma</span>
                                        </div>
                                    </div>

                                </div>
                            </div>

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

                        {tour.optionFlexibleCancel && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                                <h4 className="font-bold text-lg flex items-center gap-2 text-[#323232]">
                                    <CheckCircle2 className="h-5 w-5 text-[#FE8008]" />
                                    Opzioni Aggiuntive
                                </h4>

                                <div className="space-y-4">
                                    {/* Flexible Cancellation */}
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
                        <Card className="w-full border-0 shadow-lg lg:sticky lg:top-24 rounded-2xl overflow-hidden bg-white">
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
                                        {selectedRoom === 'twin' && (
                                            <div className="flex items-center justify-between text-slate-400 italic">
                                                <span className="font-medium text-xs">Camera:</span>
                                                <span className="text-xs">Doppia (Letti Singoli)</span>
                                            </div>
                                        )}
                                        {selectedRoom === 'triple' && (
                                            <div className="flex items-center justify-between text-slate-400 italic">
                                                <span className="font-medium text-xs">Camera:</span>
                                                <span className="text-xs">Tripla</span>
                                            </div>
                                        )}
                                        {selectedRoom === 'triple_request' && (
                                            <div className="flex items-center justify-between text-slate-400 italic">
                                                <span className="font-medium text-xs">Camera:</span>
                                                <span className="text-xs">Tripla (Su Richiesta)</span>
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
                </div >
            </div >
        </section >
    )
}

export default ShoppingCart
