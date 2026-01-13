
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { DestinazioniClient } from "@/app/(website)/partenze/client"

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

export const dynamic = 'force-dynamic'

async function getCategoryData(slug: string) {
    // Normalizar slug
    const type = slug.toLowerCase()

    if (type === 'aereo') {
        const flightTours = await prisma.tourAereo.findMany({
            where: {
                isActive: true,
                isPublic: true,
                fechaViaje: { gte: new Date() }
            },
            orderBy: { fechaViaje: 'asc' }
        })
        return {
            flightTours,
            busTours: [],
            title: "Viaggi Aerei",
            subtitle: "Le nostre proposte di volo",
            description: "Esplora i cieli con noi. Destinazioni esotiche e avventure indimenticabili ti aspettano con i nostri tour aerei selezionati.",
            heroImage: "https://res.cloudinary.com/dskliu1ig/image/upload/v1768264416/img-viaggi-aereo_e45yvq.jpg"
        }
    }

    if (type === 'bus') {
        const busTours = await prisma.tourBus.findMany({
            where: {
                isActive: true,
                isPublic: true,
                fechaViaje: { gte: new Date() }
            },
            orderBy: { fechaViaje: 'asc' }
        })
        return {
            flightTours: [],
            busTours,
            title: "Viaggi in Bus",
            subtitle: "Scopri l'Europa su strada",
            description: "Il comfort del viaggio su strada per scoprire le meraviglie più vicine. Viaggi di gruppo organizzati nei minimi dettagli.",
            heroImage: "https://res.cloudinary.com/dskliu1ig/image/upload/v1768264413/img-viaggi-bus_ggkkfn.jpg"
        }
    }

    return null
}

export default async function CategoryPage(props: PageProps) {
    const params = await props.params;
    const {
        slug
    } = params;
    const data = await getCategoryData(slug)

    if (!data) {
        notFound()
    }

    return (
        <DestinazioniClient
            flightTours={data.flightTours}
            busTours={data.busTours}
            title={data.title}
            subtitle={data.subtitle}
            description={data.description}
            heroImage={data.heroImage}
        />
    )
}
