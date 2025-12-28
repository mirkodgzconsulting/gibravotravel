"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/website/ui/button"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import {
    User,
    MapPin,
    Calendar,
    FileText,
    LogOut,
    Settings,
    CreditCard,
    ChevronRight,
    Download,
    CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/website/utils"
import { useSearchParams } from "next/navigation"
import { useClerk, useUser } from "@clerk/nextjs"

// Pre-defined Avatars
const AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Callie",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Dante",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Easton",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=George",
]

interface DashboardClientProps {
    userData: {
        firstName: string | null
        lastName: string | null
        email: string
        imageUrl: string
    }
    bookings: any[] // We will type this better if possible or leave as any for speed
}

export function DashboardClient({ userData, bookings }: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState<"TRIPS" | "PROFILE">("TRIPS")
    const searchParams = useSearchParams()
    const { signOut } = useClerk()
    const { user, isLoaded } = useUser()
    const isSuccess = searchParams?.get("success") === "true"

    // Profile State
    const [isUpdating, setIsUpdating] = useState(false)
    const [formData, setFormData] = useState({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
    })
    const [passData, setPassData] = useState({
        current: "",
        new: "",
        confirm: ""
    })

    const handleUpdateProfile = async () => {
        if (!user) return
        setIsUpdating(true)
        try {
            await user.update({
                firstName: formData.firstName,
                lastName: formData.lastName,
            })
            alert("Profilo aggiornato con successo!")
        } catch (error: any) {
            console.error(error)
            alert("Errore aggiornamento profilo: " + (error.errors?.[0]?.message || error.message))
        } finally {
            setIsUpdating(false)
        }
    }

    const handleAvatarSelect = async (avatarUrl: string) => {
        if (!user) return
        setIsUpdating(true)
        try {
            // 1. Fetch the image as blob
            const response = await fetch(avatarUrl)
            const blob = await response.blob()
            const file = new File([blob], "avatar.svg", { type: "image/svg+xml" })

            // 2. Upload to Clerk
            await user.setProfileImage({ file })
            alert("Avatar aggiornato!")
        } catch (error) {
            console.error(error)
            alert("Errore salvataggio avatar")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleChangePassword = async () => {
        if (!user) return
        if (passData.new !== passData.confirm) {
            alert("Le password non coincidono")
            return
        }
        setIsUpdating(true)
        try {
            await user.updatePassword({
                currentPassword: passData.current,
                newPassword: passData.new
            })
            alert("Password modificata con successo!")
            setPassData({ current: "", new: "", confirm: "" })
        } catch (error: any) {
            console.error(error)
            alert("Errore password: " + (error.errors?.[0]?.message || "Controlla la password attuale"))
        } finally {
            setIsUpdating(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 pt-[100px] pb-20">
                <div className="container mx-auto px-4 max-w-xl text-center">
                    <RevealOnScroll>
                        <div className="bg-white rounded-3xl p-12 shadow-xl border border-green-100 mb-8">
                            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="h-12 w-12 text-green-600" />
                            </div>
                            <h1 className="text-4xl font-[900] text-[#323232] mb-4">Pagamento Riuscito! 🎉</h1>
                            <p className="text-lg text-slate-600 mb-8">
                                La tua prenotazione è confermata. Un nostro agente ti contatterà a breve al tuo numero di telefono per finalizzare i dettagli.
                            </p>
                            <div className="space-y-3">
                                <Link href="/dashboard">
                                    <Button className="w-full h-[50px] bg-[#004BA5] text-white hover:bg-[#004BA5]/90 font-bold rounded-xl">
                                        Vai ai miei viaggi
                                    </Button>
                                </Link>
                                <Link href="/">
                                    <Button variant="ghost" className="w-full text-slate-500 font-bold">
                                        Torna alla Home
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm">Hai ricevuto una email di conferma con il riepilogo.</p>
                    </RevealOnScroll>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-[100px] pb-20">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header Section */}
                <RevealOnScroll>
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md border-2 border-[#004BA5]/10 overflow-hidden relative">
                                <Image
                                    src={user?.imageUrl || userData.imageUrl}
                                    alt="User Avatar"
                                    fill
                                    className="object-cover rounded-full"
                                />
                            </div>
                            <div>
                                <h1 className="text-3xl font-[900] text-[#323232]">Ciao, {user?.firstName || userData.firstName || "Viaggiatore"}! 👋</h1>
                                <p className="text-slate-500 font-medium">Viaggiatore Gibravo • {bookings.length} Viaggi in programma</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="border-slate-200 text-slate-600 hover:text-[#004BA5] hover:bg-white" onClick={() => setActiveTab("PROFILE")}>
                                <Settings className="h-4 w-4 mr-2" />
                                Impostazioni
                            </Button>
                            <Button variant="ghost" onClick={() => signOut()} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                <LogOut className="h-4 w-4 mr-2" />
                                Esci
                            </Button>
                        </div>
                    </div>
                </RevealOnScroll>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Sidebar / Tabs */}
                    <div className="lg:col-span-3">
                        <RevealOnScroll delay={100}>
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 overflow-hidden sticky top-24">
                                <button
                                    onClick={() => setActiveTab("TRIPS")}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-[800] transition-colors mb-1 text-left",
                                        activeTab === "TRIPS"
                                            ? "bg-[#004BA5] text-white shadow-md"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    )}
                                >
                                    <Calendar className="h-5 w-5" />
                                    I miei viaggi
                                </button>
                                <button
                                    onClick={() => setActiveTab("PROFILE")}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-[800] transition-colors text-left",
                                        activeTab === "PROFILE"
                                            ? "bg-[#004BA5] text-white shadow-md"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    )}
                                >
                                    <User className="h-5 w-5" />
                                    Dati Personali
                                </button>
                            </div>
                        </RevealOnScroll>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <RevealOnScroll delay={200}>
                            {activeTab === "TRIPS" && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-2xl font-[900] text-[#323232]">I tuoi prossimi viaggi</h2>
                                    </div>

                                    {/* Trip Cards */}
                                    {bookings.length === 0 ? (
                                        <div className="bg-[#E6F0FA] rounded-2xl p-8 border border-dashed border-[#004BA5]/30 text-center mt-8">
                                            <h3 className="text-lg font-[800] text-[#004BA5] mb-2">Non hai ancora viaggi prenotati</h3>
                                            <p className="text-slate-600 mb-6 max-w-md mx-auto">
                                                Abbiamo centinaia di nuove avventure che ti aspettano.
                                            </p>
                                            <Link href="/destinazioni">
                                                <Button className="bg-[#004BA5] hover:bg-[#FE8008] text-white font-[800]">
                                                    Cerca un viaggio
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        bookings.map((booking) => (
                                            <div key={booking.id} className="group bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                {/* Image */}
                                                <div className="relative h-48 w-full md:w-64 md:h-40 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                                    {/* Use a default image or try to fetch tour image if available. For now generic or type based */}
                                                    <Image
                                                        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
                                                        alt={booking.tourTitle}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-[800] text-[#004BA5] uppercase tracking-wider">
                                                        {booking.tourType}
                                                    </div>
                                                </div>

                                                {/* Details */}
                                                <div className="flex-grow space-y-3 py-2">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="text-xl font-[800] text-[#323232] leading-tight group-hover:text-[#FE8008] transition-colors cursor-pointer">
                                                            {booking.tourTitle}
                                                        </h3>
                                                        <span className={cn(
                                                            "text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap",
                                                            booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                                        )}>
                                                            {booking.status === "CONFIRMED" ? "Confermato" : "In Lavorazione"}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-4 w-4 text-[#004BA5]" />
                                                            {new Date(booking.createdAt).toLocaleDateString()} {/* Booking Date for now */}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-4 w-4 text-[#004BA5]" />
                                                            Tour {booking.tourType}
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 flex flex-wrap gap-2">
                                                        {booking.status === "CONFIRMED" ? (
                                                            <Button variant="outline" size="sm" className="h-9 border-slate-200 text-slate-600 hover:text-[#004BA5] hover:bg-slate-50">
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Voucher
                                                            </Button>
                                                        ) : (
                                                            <div className="text-sm text-slate-400 italic">
                                                                Un agente ti contatterà a breve.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                </div>
                            )}

                            {activeTab === "PROFILE" && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                                        <div className="items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                                            <h2 className="text-xl font-[900] text-[#323232]">Profilo e Avatar</h2>
                                            <p className="text-slate-500 text-sm mb-4">Scegli un avatar che ti rappresenta</p>

                                            <div className="flex flex-wrap gap-4 mt-6">
                                                {AVATARS.map((avatar, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleAvatarSelect(avatar)}
                                                        disabled={isUpdating}
                                                        className="h-14 w-14 rounded-full border-2 border-transparent hover:border-[#004BA5] hover:scale-110 transition-all p-1 bg-slate-50 overflow-hidden"
                                                    >
                                                        <img src={avatar} alt="Avatar option" className="h-full w-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-bold text-[#323232]">I tuoi dati</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-400 uppercase">Nome</label>
                                                    <input
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#004BA5]/20"
                                                        value={formData.firstName}
                                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-400 uppercase">Cognome</label>
                                                    <input
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#004BA5]/20"
                                                        value={formData.lastName}
                                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                    />
                                                </div>

                                                <div className="md:col-span-2 flex justify-end">
                                                    <Button
                                                        onClick={handleUpdateProfile}
                                                        disabled={isUpdating}
                                                        className="bg-[#004BA5] hover:bg-[#FE8008] text-white font-bold"
                                                    >
                                                        {isUpdating ? "Salvataggio..." : "Salva Modifiche"}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                                        <h3 className="text-lg font-bold text-[#323232] mb-4">Sicurezza</h3>
                                        <p className="text-slate-500 text-sm mb-6">Modifica la tua password di accesso</p>

                                        <div className="space-y-4 max-w-md">
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase">Password Attuale</label>
                                                <input
                                                    type="password"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#004BA5]/20"
                                                    value={passData.current}
                                                    onChange={(e) => setPassData({ ...passData, current: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase">Nuova Password</label>
                                                <input
                                                    type="password"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#004BA5]/20"
                                                    value={passData.new}
                                                    onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase">Conferma Nuova Password</label>
                                                <input
                                                    type="password"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-[#004BA5]/20"
                                                    value={passData.confirm}
                                                    onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                                                />
                                            </div>

                                            <div className="flex justify-end pt-2">
                                                <Button
                                                    onClick={handleChangePassword}
                                                    disabled={isUpdating}
                                                    variant="outline"
                                                    className="border-[#004BA5] text-[#004BA5] hover:bg-[#004BA5] hover:text-white font-bold"
                                                >
                                                    {isUpdating ? "Attendere..." : "Aggiorna Password"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </RevealOnScroll>
                    </div>
                </div>
            </div>
        </div>
    )
}
