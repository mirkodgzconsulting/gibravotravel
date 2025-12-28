"use client"

import { useLanguage } from "@/context/website/language-context"
import { TravelCard } from "@/components/website/ui/travel-card"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

interface Tour {
    id: string
    titulo: string
    slug: string
    webCoverImage: string | null
    coverImage: string | null
    precioAdulto: number
    fechaViaje: Date | null
    fechaFin: Date | null
}

interface DestinazioniClientProps {
    flightTours: Tour[]
    busTours: Tour[]
}

export function DestinazioniClient({ flightTours, busTours }: DestinazioniClientProps) {
    const { language } = useLanguage()

    const t = {
        ES: {
            subtitle: "Nuestros Destinos",
            title: "Todos los Destinos",
            description: "Ya sea que prefieras volar o viajar por carretera, tenemos la aventura perfecta para ti. Elige tu próximo destino.",
            flightTitle: "Viajes en Avión",
            flightBadge: "Vuela con nosotros",
            flightEmpty: "No hay viajes en avión disponibles en este momento.",
            busTitle: "Viajes en Autobús",
            busBadge: "En Carretera",
            busEmpty: "No hay viajes en autobús disponibles en este momento."
        },
        IT: {
            subtitle: "Le Nostre Mete",
            title: "Tutte le Destinazioni",
            description: "Che tu preferisca volare o viaggiare su strada, abbiamo l'avventura perfetta per te. Scegli la tua prossima meta.",
            flightTitle: "Viaggi in Aereo",
            flightBadge: "Vola con noi",
            flightEmpty: "Nessun viaggio in aereo disponibile al momento.",
            busTitle: "Viaggi in Autobus",
            busBadge: "On The Road",
            busEmpty: "Nessun viaggio in autobus disponibile al momento."
        },
        EN: {
            subtitle: "Our Destinations",
            title: "All Destinations",
            description: "Whether you prefer to fly or travel by road, we have the perfect adventure for you. Choose your next destination.",
            flightTitle: "Flight Trips",
            flightBadge: "Fly with us",
            flightEmpty: "No flight trips available at the moment.",
            busTitle: "Bus Trips",
            busBadge: "On The Road",
            busEmpty: "No bus trips available at the moment."
        }
    }

    const content = t[language as keyof typeof t] || t.IT

    return (
        <main className="min-h-screen bg-slate-50 pt-32 pb-24">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <RevealOnScroll>
                    <div className="text-center mb-20">
                        <span className="text-[#FE8008] font-bold tracking-wider text-sm uppercase mb-2 block">
                            {content.subtitle}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#004BA5] mb-6 tracking-tight">
                            {content.title}
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                            {content.description}
                        </p>
                    </div>
                </RevealOnScroll>

                {/* Section 1: Flight Tours */}
                <section className="mb-24">
                    <RevealOnScroll>
                        <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-4">
                            <h2 className="text-3xl font-extrabold text-[#323232]">
                                {content.flightTitle}
                            </h2>
                            <div className="px-3 py-1 bg-blue-100 text-[#004BA5] text-xs font-bold rounded-full uppercase tracking-wide">
                                {content.flightBadge}
                            </div>
                        </div>
                    </RevealOnScroll>

                    {flightTours.length === 0 ? (
                        <RevealOnScroll>
                            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-slate-100">
                                <p className="text-slate-400 font-medium">{content.flightEmpty}</p>
                            </div>
                        </RevealOnScroll>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {flightTours.map((tour, index) => {
                                const days = tour.fechaViaje && tour.fechaFin
                                    ? Math.ceil((new Date(tour.fechaFin).getTime() - new Date(tour.fechaViaje).getTime()) / (1000 * 60 * 60 * 24))
                                    : 5
                                return (
                                    <RevealOnScroll key={tour.id} delay={index * 50}>
                                        <TravelCard
                                            title={tour.titulo}
                                            slug={tour.slug || tour.id}
                                            image={tour.webCoverImage || tour.coverImage || '/images/placeholder-tour.jpg'}
                                            price={tour.precioAdulto}
                                            days={days}
                                            rating={5}
                                            reviews={120}
                                            tags={[]}
                                            theme="light"
                                        />
                                    </RevealOnScroll>
                                )
                            })}
                        </div>
                    )}
                </section>

                {/* Section 2: Bus Tours */}
                <section>
                    <RevealOnScroll>
                        <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-4">
                            <h2 className="text-3xl font-extrabold text-[#323232]">
                                {content.busTitle}
                            </h2>
                            <div className="px-3 py-1 bg-orange-100 text-[#FE8008] text-xs font-bold rounded-full uppercase tracking-wide">
                                {content.busBadge}
                            </div>
                        </div>
                    </RevealOnScroll>

                    {busTours.length === 0 ? (
                        <RevealOnScroll>
                            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-slate-100">
                                <p className="text-slate-400 font-medium">{content.busEmpty}</p>
                            </div>
                        </RevealOnScroll>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {busTours.map((tour, index) => {
                                const days = tour.fechaViaje && tour.fechaFin
                                    ? Math.ceil((new Date(tour.fechaFin).getTime() - new Date(tour.fechaViaje).getTime()) / (1000 * 60 * 60 * 24))
                                    : 5
                                return (
                                    <RevealOnScroll key={tour.id} delay={index * 50}>
                                        <TravelCard
                                            title={tour.titulo}
                                            slug={tour.slug || tour.id}
                                            image={tour.webCoverImage || tour.coverImage || '/images/placeholder-tour.jpg'}
                                            price={tour.precioAdulto}
                                            days={days}
                                            rating={5}
                                            reviews={120}
                                            tags={[]}
                                            theme="light"
                                        />
                                    </RevealOnScroll>
                                )
                            })}
                        </div>
                    )}
                </section>

            </div>
        </main>
    )
}
