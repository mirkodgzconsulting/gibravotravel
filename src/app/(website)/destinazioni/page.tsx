import { prisma } from "@/lib/prisma"
import { TravelCard } from "@/components/website/ui/travel-card"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

export const dynamic = 'force-dynamic'

async function getAllTours() {
    try {
        const [flightTours, busTours] = await Promise.all([
            prisma.tourAereo.findMany({
                where: {
                    isActive: true,
                    isPublic: true,
                    fechaViaje: { gte: new Date() }
                },
                orderBy: { fechaViaje: 'asc' }
            }),
            prisma.tourBus.findMany({
                where: {
                    isActive: true,
                    isPublic: true,
                    fechaViaje: { gte: new Date() }
                },
                orderBy: { fechaViaje: 'asc' }
            })
        ])
        return { flightTours, busTours }
    } catch (error) {
        console.error("Error fetching all tours:", error)
        return { flightTours: [], busTours: [] }
    }
}

export default async function DestinazioniPage() {
    const { flightTours, busTours } = await getAllTours()

    return (
        <main className="min-h-screen bg-slate-50 pt-32 pb-24">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <RevealOnScroll>
                    <div className="text-center mb-20">
                        <span className="text-[#FE8008] font-bold tracking-wider text-sm uppercase mb-2 block">
                            Le Nostre Mete
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#004BA5] mb-6 tracking-tight">
                            Tutte le Destinazioni
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                            Che tu preferisca volare o viaggiare su strada, abbiamo l'avventura perfetta per te.
                            Scegli la tua prossima meta.
                        </p>
                    </div>
                </RevealOnScroll>

                {/* Section 1: Flight Tours */}
                <section className="mb-24">
                    <RevealOnScroll>
                        <div className="flex items-center gap-4 mb-10 border-b border-slate-200 pb-4">
                            <h2 className="text-3xl font-extrabold text-[#323232]">
                                Viaggi in Aereo
                            </h2>
                            <div className="px-3 py-1 bg-blue-100 text-[#004BA5] text-xs font-bold rounded-full uppercase tracking-wide">
                                Vola con noi
                            </div>
                        </div>
                    </RevealOnScroll>

                    {flightTours.length === 0 ? (
                        <RevealOnScroll>
                            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-slate-100">
                                <p className="text-slate-400 font-medium">Nessun viaggio in aereo disponibile al momento.</p>
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
                                            image={tour.coverImage || tour.webCoverImage || '/images/placeholder-tour.jpg'}
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
                                Viaggi in Autobus
                            </h2>
                            <div className="px-3 py-1 bg-orange-100 text-[#FE8008] text-xs font-bold rounded-full uppercase tracking-wide">
                                On The Road
                            </div>
                        </div>
                    </RevealOnScroll>

                    {busTours.length === 0 ? (
                        <RevealOnScroll>
                            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-slate-100">
                                <p className="text-slate-400 font-medium">Nessun viaggio in autobus disponibile al momento.</p>
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
                                            image={tour.coverImage || tour.webCoverImage || '/images/placeholder-tour.jpg'}
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
