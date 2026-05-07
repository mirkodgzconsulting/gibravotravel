import type { Metadata } from "next";

import { prisma } from "@/lib/prisma"
import { DestinazioniClient } from "./client"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Partenze viaggi organizzati da Milano",
    description:
        "Calendario partenze GiBravo Travel: viaggi organizzati in aereo e in pullman da Milano. Filtra per mese e tipo di tour verso Italia ed Europa.",
    alternates: {
        canonical: "https://www.gibravo.it/partenze",
    },
    openGraph: {
        title: "Partenze | GiBravo Travel — Viaggi organizzati Milano",
        description:
            "Prossime partenze confermate: tour in bus e aereo con gruppi ristretti e assistenza dedicata.",
        url: "https://www.gibravo.it/partenze",
        locale: "it_IT",
        type: "website",
    },
};

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

    const heroImages = [
        "https://res.cloudinary.com/dskliu1ig/image/upload/v1768264416/img-viaggi-aereo_e45yvq.jpg",
        "https://res.cloudinary.com/dskliu1ig/image/upload/v1768264413/img-viaggi-bus_ggkkfn.jpg"
    ]

    return (
        <DestinazioniClient
            flightTours={flightTours}
            busTours={busTours}
            heroImages={heroImages}
            description="Da Milano partono i nostri viaggi organizzati in gruppo: tour in pullman o in aereo verso le migliori destinazioni in Italia e Europa. Date confermate e assistenza GiBravo Travel."
        />
    )
}
