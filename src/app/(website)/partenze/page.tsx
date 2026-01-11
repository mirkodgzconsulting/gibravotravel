import { prisma } from "@/lib/prisma"
import { DestinazioniClient } from "./client"

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

        // Transform the data to match the expected interface if necessary,
        // specifically ensuring dates are handled correctly as serializable props if this were a boundary,
        // but since we are in RSC passing to Client Component, Next.js handles date serialization nicely in modern versions,
        // however usually it's safer to pass simple objects. 
        // Let's assume the client component can handle the types as defined in its interface which matches Prisma's return mostly.
        // We might need to check the interface in client.tsx again.
        // client.tsx expects: flightTours: Tour[], busTours: Tour[]
        // Tour interface in client.tsx has: id, titulo, slug, webCoverImage, coverImage, precioAdulto, fechaViaje: Date | null, fechaFin: Date | null
        // This matches Prisma output.

        return { flightTours, busTours }
    } catch (error) {
        console.error("Error fetching all tours:", error)
        return { flightTours: [], busTours: [] }
    }
}

export default async function PartenzePage() {
    const { flightTours, busTours } = await getAllTours()

    return <DestinazioniClient flightTours={flightTours} busTours={busTours} />
}
