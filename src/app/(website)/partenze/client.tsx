"use client"

import { TravelCard } from "@/components/website/ui/travel-card"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import { Plane, Bus, Calendar, Filter, SearchX } from "lucide-react"
import { Button } from "@/components/website/ui/button"

interface Tour {
    id: string
    titulo: string
    slug: string | null
    webCoverImage: string | null
    coverImage: string | null
    precioAdulto: number
    precioNino: number
    fechaViaje: Date | null
    fechaFin: Date | null
    etiquetas: string[]
    duracionTexto: string | null
    coordinadorNombre: string | null
    coordinadorFoto: string | null
    subtitulo: string | null
    type?: 'flight' | 'bus'
    travelStatus?: string // Added
}

const MONTHS = [
    { value: '0', label: 'Tutti i mesi' },
    { value: '1', label: 'Gennaio' },
    { value: '2', label: 'Febbraio' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Aprile' },
    { value: '5', label: 'Maggio' },
    { value: '6', label: 'Giugno' },
    { value: '7', label: 'Luglio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Settembre' },
    { value: '10', label: 'Ottobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Dicembre' },
]

interface DestinazioniClientProps {
    flightTours: Tour[]
    busTours: Tour[]
    title?: string
    subtitle?: string
    description?: string
    heroImage?: string
    heroImages?: string[]
}

export function DestinazioniClient(props: DestinazioniClientProps) {
    const {
        flightTours,
        busTours,
        title,
        subtitle,
        description
    } = props

    const content = {
        subtitle: subtitle || "Le Prossime Partenze",
        title: title || "Partenze",
        description: description || "Che tu preferisca volare o viaggiare su strada, abbiamo l'avventura perfecta per te. Scegli la tua prossima meta.",
        empty: "Nessun viaggio disponibile al momento."
    }

    // Filter States
    const [filterType, setFilterType] = React.useState<'all' | 'flight' | 'bus'>('all')
    const [filterMonth, setFilterMonth] = React.useState<string>('0')

    // Merge and Tag Tours
    const allTours = React.useMemo(() => {
        const flights = flightTours.map(t => ({ ...t, type: 'flight' as const }))
        const buses = busTours.map(t => ({ ...t, type: 'bus' as const }))

        return [...flights, ...buses].sort((a, b) => {
            if (!a.fechaViaje) return 1
            if (!b.fechaViaje) return -1
            return new Date(a.fechaViaje).getTime() - new Date(b.fechaViaje).getTime()
        })
    }, [flightTours, busTours])

    // Filter Logic
    const filteredTours = React.useMemo(() => {
        return allTours.filter(tour => {
            // Type Filter
            if (filterType !== 'all' && tour.type !== filterType) return false

            // Month Filter
            if (filterMonth !== '0' && tour.fechaViaje) {
                const tourMonth = (new Date(tour.fechaViaje).getMonth() + 1).toString()
                if (tourMonth !== filterMonth) return false
            }

            return true
        })
    }, [allTours, filterType, filterMonth])

    const heroImages = props.heroImages || [props.heroImage || "https://res.cloudinary.com/dskliu1ig/image/upload/v1767444828/Foto-Destinazioni-Cover-Egitto-QA_n98kvv.webp"]
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0)

    React.useEffect(() => {
        if (heroImages.length <= 1) return

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % heroImages.length)
        }, 4000)

        return () => clearInterval(interval)
    }, [heroImages.length])

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-[500px] w-full flex items-center overflow-hidden bg-black mb-0">
                <div className="absolute inset-0 z-0">
                    {heroImages.map((img, index) => (
                        <div
                            key={img}
                            className={`absolute inset-0 w-full h-full transition-opacity duration-[2500ms] ease-in-out ${index === currentImageIndex ? "opacity-80" : "opacity-0"}`}
                            style={{
                                backgroundImage: `url('${img}')`,
                                backgroundSize: "cover",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center"
                            }}
                        />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                </div>

                <div className="container mx-auto px-4 z-20 relative">
                    <RevealOnScroll>
                        <div className="max-w-3xl">
                            <h1 className="text-5xl md:text-7xl font-[700] text-white tracking-tighter leading-[1.1] mb-8">
                                {(() => {
                                    const titleStr = content.title || "";
                                    const words = titleStr.split(" ");
                                    if (words.length > 1) {
                                        const lastWord = words.pop();
                                        return (
                                            <>
                                                {words.join(" ")} <span className="text-[#FE8008]">{lastWord}</span>
                                            </>
                                        );
                                    }
                                    return titleStr;
                                })()}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed max-w-2xl">
                                {content.description}
                            </p>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            <main className="flex-grow bg-slate-50 pt-8 pb-16">
                <div className="container mx-auto px-4 max-w-6xl">
                    <section>
                        <RevealOnScroll>
                            <div className="flex flex-col items-center justify-center mb-12 border-b border-slate-200 pb-8 gap-8">
                                <div className="flex flex-col items-center gap-6 text-center w-full">
                                    <h2 className="text-4xl font-bold text-[#004BA5]">
                                        {content.subtitle}
                                    </h2>

                                    {/* Friendly Filters */}
                                    <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                                        {/* Type Toggle */}
                                        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-full shadow-sm">
                                            <Button
                                                onClick={() => setFilterType('all')}
                                                variant={filterType === 'all' ? 'default' : 'ghost'}
                                                className={`px-6 py-2 h-auto rounded-full font-bold transition-all border-0 ${filterType === 'all' ? 'shadow-md' : 'text-slate-500 hover:text-[#004BA5] hover:bg-slate-50'}`}
                                            >
                                                Tutti
                                            </Button>
                                            <Button
                                                onClick={() => setFilterType('bus')}
                                                variant={filterType === 'bus' ? 'default' : 'ghost'}
                                                className={`flex items-center gap-2 px-6 py-2 h-auto rounded-full font-bold transition-all border-0 ${filterType === 'bus' ? 'shadow-md' : 'text-slate-500 hover:text-[#FE8008] hover:bg-orange-50'}`}
                                            >
                                                <Bus className="w-4 h-4" />
                                                Bus
                                            </Button>
                                            <Button
                                                onClick={() => setFilterType('flight')}
                                                variant={filterType === 'flight' ? 'default' : 'ghost'}
                                                className={`flex items-center gap-2 px-6 py-2 h-auto rounded-full font-bold transition-all border-0 ${filterType === 'flight' ? 'shadow-md' : 'text-slate-500 hover:text-[#004BA5] hover:bg-blue-50'}`}
                                            >
                                                <Plane className="w-4 h-4" />
                                                Aereo
                                            </Button>
                                        </div>

                                        {/* Separator - Horizontal on mobile/desktop */}
                                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                                        {/* Date Filter */}
                                        <div className="relative group">
                                            <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                                                <Calendar className="w-4 h-4 text-slate-500" />
                                                <select
                                                    value={filterMonth}
                                                    onChange={(e) => setFilterMonth(e.target.value)}
                                                    className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer appearance-none pr-4"
                                                    style={{ backgroundImage: 'none' }}
                                                >
                                                    {MONTHS.map(m => (
                                                        <option key={m.value} value={m.value}>{m.label}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Count Badge - Integrated in row */}
                                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                                        <div className="flex items-center gap-2 text-slate-500 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                                            <Filter className="w-4 h-4" />
                                            <span>{filteredTours.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </RevealOnScroll>

                        {filteredTours.length === 0 ? (
                            <RevealOnScroll>
                                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <SearchX className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 text-lg font-medium">Nessun viaggio trovato con questi filtri.</p>
                                    <Button
                                        onClick={() => { setFilterType('all'); setFilterMonth('0') }}
                                        variant="link"
                                        className="mt-4 text-[#004BA5] font-bold hover:underline h-auto p-0"
                                    >
                                        Cancella filtri
                                    </Button>
                                </div>
                            </RevealOnScroll>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {filteredTours.map((tour, index) => (
                                    <RevealOnScroll key={tour.id} delay={index * 50}>
                                        <TravelRowCard tour={tour} />
                                    </RevealOnScroll>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}

function StatusIcon({ status, className }: { status: string, className?: string }) {
    switch (status) {
        case 'SOGNANDO': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
        case 'QUASI_FAMIGLIA': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        case 'CONFERMATO': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
        case 'ULTIMI_POSTI': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
        case 'COMPLETO': return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
        default: return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
    }
}


function TravelRowCard({ tour }: { tour: Tour }) {
    const startDate = tour.fechaViaje ? new Date(tour.fechaViaje) : null
    const endDate = tour.fechaFin ? new Date(tour.fechaFin) : null

    const day = startDate?.getDate()
    const month = startDate?.toLocaleString('it-IT', { month: 'short' }).toUpperCase().replace('.', '')

    const dateRange = startDate && endDate
        ? `${startDate.getDate()} ${startDate.toLocaleString('it-IT', { month: 'long' })} - ${endDate.getDate()} ${endDate.toLocaleString('it-IT', { month: 'long' })}`
        : "Fecha de viaje a confirmar"

    const duration = tour.duracionTexto || "Duración a confirmar"
    const coordinator = tour.coordinadorNombre || "Por asignar"
    const coordinatorImg = tour.coordinadorFoto || "https://res.cloudinary.com/dskliu1ig/image/upload/v1767357683/hero-homepage_obrvuk.webp"

    return (
        <Link
            href={`/tour/${tour.slug || tour.id}`}
            className="group flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 min-h-[160px]"
        >
            {/* Left: Image & Date */}
            <div className="relative w-full md:w-[240px] h-[180px] md:h-auto overflow-hidden text-center shrink-0">
                <Image
                    src={tour.webCoverImage || tour.coverImage || '/images/placeholder-tour.jpg'}
                    alt={tour.titulo}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 items-start z-10">
                    {tour.type === 'flight' ? (
                        <div className="bg-[#004BA5] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                            <Plane className="w-3 h-3" />
                            AEREO
                        </div>
                    ) : (
                        <div className="bg-[#FE8008] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                            <Bus className="w-3 h-3" />
                            BUS
                        </div>
                    )}
                </div>

                {startDate && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="text-center bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                            <span className="block text-2xl font-black text-white leading-none">{day}</span>
                            <span className="block text-[11px] font-bold text-white uppercase tracking-widest mt-0.5">{month}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Middle: Content */}
            <div className="flex-1 p-5 md:p-6 flex flex-col justify-center">
                <div className="flex flex-col mb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                        {tour.type === 'flight' && <span className="text-[10px] font-black text-[#004BA5] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">Viaggio Aereo</span>}
                        {tour.type === 'bus' && <span className="text-[10px] font-black text-[#FE8008] bg-orange-50 px-2 py-0.5 rounded uppercase tracking-wider">Tour in Bus</span>}
                    </div>

                    <h3 className="text-xl font-[800] text-[#323232] group-hover:text-[#004BA5] transition-colors mb-2 leading-tight">
                        {tour.titulo}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-[13px]">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <span className="p-1 bg-slate-100 rounded-md text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </span>
                            {dateRange}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                            <span className="p-1 bg-slate-100 rounded-md text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </span>
                            {duration}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 bg-orange-50 text-[#FE8008] text-[11px] font-bold rounded-full border border-orange-100">
                        25 - 40 anni
                    </span>
                    {tour.travelStatus && (
                        <div className={`flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider ${tour.travelStatus === 'SOGNANDO' ? 'text-purple-600' :
                            tour.travelStatus === 'QUASI_FAMIGLIA' ? 'text-blue-600' :
                                tour.travelStatus === 'CONFERMATO' ? 'text-green-600' :
                                    tour.travelStatus === 'ULTIMI_POSTI' ? 'text-orange-600' :
                                        'text-gray-500'
                            }`}>
                            {(() => {
                                // Simple bullet for list view or icon? User screenshot showed bullet.
                                // Let's keep bullet style for "Ultimi Posti" but maybe change color?
                                // Actually, let's use the Icon style but consistent with the card.
                                // User showed "Bullet + ULTIMI POSTI"
                                // If I use Icon it might look better.
                                // Let's try Icon to be consistent with Tour details.
                                // Or stick to bullet if that's what they had.
                                // Let's use the CONFIG map approach for consistency.
                                return (
                                    <>
                                        {/* Icon or Bullet? screenshot had bullet. Let's use Icon as it is better. */}
                                        {/* Actually user said "segue saliendo ultimi posti ... con icono tambien" in request 1? 
                                            No, "en la pagina de los viajes partenze sigue saliendo el estado ultimi posti... no muestra el estado real con icono"
                                            So they WANT the icon.
                                        */}
                                        {/* Map status to color/icon */}
                                        <StatusIcon status={tour.travelStatus} className="w-3 h-3" />
                                        {tour.travelStatus.replace(/_/g, ' ')}
                                    </>
                                )
                            })()}
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Right: Coordinator */}
            <div className="hidden lg:flex flex-col justify-center px-6 border-l border-slate-100 min-w-[180px]">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
                        <Image
                            src={coordinatorImg}
                            alt={coordinator}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Trip coordinator</p>
                        <p className="text-[13px] font-bold text-[#323232] leading-tight">{coordinator}</p>
                    </div>
                </div>
            </div>

            {/* Right: Price & CTA */}
            <div className="p-5 md:p-6 bg-slate-50/50 md:bg-transparent border-t md:border-t-0 md:border-l border-slate-100 flex flex-col items-end justify-center min-w-[200px]">
                <div className="flex flex-col items-end mb-3">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-slate-400 text-xs line-through font-medium">1.397 €</span>
                        <span className="text-2xl font-[900] text-[#004BA5] tracking-tight">
                            {tour.precioAdulto.toLocaleString('it-IT')} €
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">Acconto <span className="font-bold">359 €</span></p>
                </div>

                <Button className="w-full md:w-auto px-8 shadow-xl">
                    Scopri
                </Button>
            </div>
        </Link>
    )
}




