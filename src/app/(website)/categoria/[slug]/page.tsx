
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { DestinazioniClient } from "@/app/(website)/partenze/client"

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const { slug } = await props.params
    const s = slug.toLowerCase()
    if (s === "aereo") {
        return {
            title: "Viaggi organizzati in aereo da Milano",
            description:
                "Tour aerei e viaggi in volo organizzati da GiBravo Travel: partenze da Milano, gruppi ristretti, destinazioni in Italia ed Europa.",
            alternates: { canonical: "https://www.gibravo.it/categoria/aereo" },
            openGraph: {
                title: "Viaggi aerei organizzati | GiBravo Travel",
                url: "https://www.gibravo.it/categoria/aereo",
                locale: "it_IT",
                type: "website",
            },
        }
    }
    if (s === "bus") {
        return {
            title: "Viaggi in pullman organizzati da Milano",
            description:
                "Tour in bus da Milano con GiBravo Travel: viaggi di gruppo in pullman verso destinazioni e capitali europee, comfort e organizzazione.",
            alternates: { canonical: "https://www.gibravo.it/categoria/bus" },
            openGraph: {
                title: "Viaggi in bus organizzati | GiBravo Travel",
                url: "https://www.gibravo.it/categoria/bus",
                locale: "it_IT",
                type: "website",
            },
        }
    }
    return {}
}

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
            description: "Esplora i cieli con GiBravo Travel: viaggi organizzati in aereo da Milano verso destinazioni in Italia ed Europa. Tour di gruppo con assistenza dedicata.",
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
            description: "Viaggi in pullman organizzati da Milano: tour di gruppo in Europa comodi e curati nei dettagli. Partenze confermate con GiBravo Travel.",
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
