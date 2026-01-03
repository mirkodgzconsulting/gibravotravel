import { prisma } from "@/lib/prisma"
import { TravelCard } from "@/components/website/ui/travel-card"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

export const dynamic = 'force-dynamic'

async function getBusTours() {
    try {
        const tours = await prisma.tourBus.findMany({
            where: {
                isActive: true,
                isPublic: true,
                fechaViaje: { gte: new Date() }
            },
            orderBy: {
                fechaViaje: 'asc'
            }
        })
        return tours
    } catch (error) {
        console.error("Error fetching bus tours:", error)
        return []
    }
}

export default async function BusTypesPage() {
    const tours = await getBusTours()

    return (
        <main className="min-h-screen bg-slate-50 pt-32 pb-24">
            <div className="container mx-auto px-4 max-w-7xl">
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <span className="text-[#FE8008] font-bold tracking-wider text-sm uppercase mb-2 block">
                            On The Road
                        </span>
                        <h1 className="text-4xl md:text-5xl font-bold text-[#004BA5] mb-6 tracking-tight">
                            Viaggi in Autobus
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                            Il comfort della strada, la bellezza del viaggio. Scopri le nostre destinazioni raggiungibili in bus.
                        </p>
                    </div>
                </RevealOnScroll>

                {tours.length === 0 ? (
                    <RevealOnScroll>
                        <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100 max-w-3xl mx-auto">
                            <h3 className="text-2xl font-bold text-slate-400 mb-2">Nessun viaggio disponibile al momento</h3>
                            <p className="text-slate-500 text-lg">Stiamo lavorando a nuove avventure. Torna a trovarci presto!</p>
                        </div>
                    </RevealOnScroll>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {tours.map((tour, index) => {
                            // Calculate days duration
                            const days = tour.fechaViaje && tour.fechaFin
                                ? Math.ceil((new Date(tour.fechaFin).getTime() - new Date(tour.fechaViaje).getTime()) / (1000 * 60 * 60 * 24))
                                : 0

                            return (
                                <RevealOnScroll key={tour.id} delay={index * 50}>
                                    <TravelCard
                                        title={tour.titulo}
                                        slug={tour.slug || tour.id} // Fallback to ID if slug is missing
                                        image={tour.coverImage || tour.webCoverImage || '/images/placeholder-tour.jpg'}
                                        price={tour.precioAdulto}
                                        days={days || 5}
                                        rating={5} // Placeholder
                                        reviews={120} // Placeholder
                                        tags={[]}
                                        theme="light"
                                    />
                                </RevealOnScroll>
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    )
}
