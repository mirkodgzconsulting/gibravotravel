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
    fechaViaje: Date | null
    fechaFin: Date | null
}

interface DestinazioniClientProps {
    flightTours: Tour[]
    busTours: Tour[]
}

export function DestinazioniClient({ flightTours, busTours }: DestinazioniClientProps) {
    const content = {
        subtitle: "Le Nostre Mete",
        title: "Tutte le Destinazioni",
        description: "Che tu preferisca volare o viaggiare su strada, abbiamo l'avventura perfetta per te. Scegli la tua prossima meta.",
        flightTitle: "Viaggi in Aereo",
        flightBadge: "Vola con noi",
        flightEmpty: "Nessun viaggio in aereo disponibile al momento.",
        busTitle: "Viaggi in Autobus",
        busBadge: "On The Road",
        busEmpty: "Nessun viaggio in autobus disponibile al momento."
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
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

            <main className="flex-grow bg-slate-50 py-24">
                <div className="container mx-auto px-4 max-w-7xl">

                    {/* Section 1: Flight Tours */}
                    <section className="mb-24">
                        <RevealOnScroll>
                            <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-4">
                                <h2 className="text-3xl font-bold text-[#323232]">
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
                                <h2 className="text-3xl font-bold text-[#323232]">
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
        </div>
    )
}
