import { TravelCard } from "@/components/website/ui/travel-card"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import Image from "next/image"

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
}

interface DestinazioniClientProps {
    flightTours: Tour[]
    busTours: Tour[]
}

export function DestinazioniClient({ flightTours, busTours }: DestinazioniClientProps) {
    const content = {
        subtitle: "Le Prossime Partenze",
        title: "Partenze",
        description: "Che tu preferisca volare o viaggiare su strada, abbiamo l'avventura perfecta per te. Scegli la tua prossima meta.",
        empty: "Nessun viaggio disponibile al momento."
    }

    // Merge all tours and sort by date
    const allTours = [...flightTours, ...busTours].sort((a, b) => {
        if (!a.fechaViaje) return 1
        if (!b.fechaViaje) return -1
        return new Date(a.fechaViaje).getTime() - new Date(b.fechaViaje).getTime()
    })

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[60vh] min-h-[500px] w-full flex items-center overflow-hidden bg-black mb-0">
                <div className="absolute inset-0 z-0">
                    <div
                        className="absolute inset-0 w-full h-full opacity-80"
                        style={{
                            backgroundImage: "url('https://res.cloudinary.com/dskliu1ig/image/upload/v1767444828/Foto-Destinazioni-Cover-Egitto-QA_n98kvv.webp')",
                            backgroundSize: "contain",
                            backgroundRepeat: "repeat-x",
                            backgroundPosition: "center"
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                </div>

                <div className="container mx-auto px-4 z-20 relative">
                    <RevealOnScroll>
                        <div className="max-w-3xl">
                            <h1 className="text-5xl md:text-7xl font-[700] text-white tracking-tighter leading-[1.1] mb-8">
                                {content.title}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed max-w-2xl">
                                {content.description}
                            </p>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            <main className="flex-grow bg-slate-50 py-16">
                <div className="container mx-auto px-4 max-w-6xl">
                    <section>
                        <RevealOnScroll>
                            <div className="flex items-center justify-between mb-12 border-b border-slate-200 pb-6">
                                <h2 className="text-4xl font-bold text-[#323232]">
                                    {content.subtitle}
                                </h2>
                                <span className="text-slate-500 font-medium">{allTours.length} viaggi trovati</span>
                            </div>
                        </RevealOnScroll>

                        {allTours.length === 0 ? (
                            <RevealOnScroll>
                                <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
                                    <p className="text-slate-400 text-lg font-medium">{content.empty}</p>
                                </div>
                            </RevealOnScroll>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {allTours.map((tour, index) => (
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
            className="group flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 min-h-[180px]"
        >
            {/* Left: Image & Date */}
            <div className="relative w-full md:w-[280px] h-[200px] md:h-auto overflow-hidden">
                <Image
                    src={tour.webCoverImage || tour.coverImage || '/images/placeholder-tour.jpg'}
                    alt={tour.titulo}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {startDate && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="text-center bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                            <span className="block text-3xl font-black text-white leading-none">{day}</span>
                            <span className="block text-sm font-bold text-white uppercase tracking-widest mt-1">{month}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Middle: Content */}
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                <div className="flex flex-col mb-4">
                    <h3 className="text-2xl font-[800] text-[#323232] group-hover:text-[#004BA5] transition-colors mb-2">
                        {tour.titulo}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[14px]">
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                            <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            </span>
                            {dateRange}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 font-medium">
                            <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            </span>
                            {duration}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-orange-50 text-[#FE8008] text-[12px] font-bold rounded-full border border-orange-100">
                        25 - 40 anni
                    </span>
                    <div className="flex items-center gap-1.5 text-red-500 font-bold text-[12px] uppercase tracking-wider animate-pulse">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        Ultimi posti
                    </div>
                </div>
            </div>

            {/* Middle Right: Coordinator */}
            <div className="hidden lg:flex flex-col justify-center px-8 border-l border-slate-100 min-w-[200px]">
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm">
                        <Image
                            src={coordinatorImg}
                            alt={coordinator}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Trip coordinator</p>
                        <p className="text-[14px] font-bold text-[#323232]">{coordinator}</p>
                    </div>
                </div>
            </div>

            {/* Right: Price & CTA */}
            <div className="p-6 md:p-8 bg-slate-50/50 md:bg-transparent border-t md:border-t-0 md:border-l border-slate-100 flex flex-col items-end justify-center min-w-[220px]">
                <div className="flex flex-col items-end mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-400 text-sm line-through font-medium">1.397 €</span>
                        <span className="text-3xl font-[900] text-[#004BA5] tracking-tight">
                            {tour.precioAdulto.toLocaleString('it-IT')} €
                        </span>
                    </div>
                    <p className="text-[12px] text-slate-500 font-medium">Acconto <span className="font-bold">359 €</span></p>
                </div>

                <button className="w-full md:w-auto px-10 py-3 bg-gradient-to-r from-[#FE8008] to-[#FF9D42] text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300">
                    Scopri
                </button>
            </div>
        </Link>
    )
}

import Link from "next/link"
