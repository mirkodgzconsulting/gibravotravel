import { Button } from "@/components/website/ui/button"
import { TravelCard } from "@/components/website/ui/travel-card"
import { Search } from "lucide-react"
import Image from "next/image"
import { prisma } from "@/lib/prisma"
import { HomeClient } from "./home-client"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    // Fetch Data
    const today = new Date()

    const flightToursData = await prisma.tourAereo.findMany({
        where: {
            isActive: true,
            isPublic: true,
            fechaViaje: { gte: today }
        },
        orderBy: { fechaViaje: 'asc' },
        take: 6
    })

    const busToursData = await prisma.tourBus.findMany({
        where: {
            isActive: true,
            isPublic: true,
            fechaViaje: { gte: today }
        },
        orderBy: { fechaViaje: 'asc' },
        take: 6
    })

    // Helper to generate mock aesthetic data
    const getMockAesthetics = (index: number) => {
        const tagsPool = [
            ["LAST MINUTE"],
            ["TOP SELLER"],
            ["OFFERTA"],
            ["ADVENTURE"],
            ["RELAX"],
            []
        ]
        return {
            rating: 4.5 + (index % 5) * 0.1, // 4.5 to 4.9
            reviews: 10 + (index * 7),
            tag: tagsPool[index % tagsPool.length]
        }
    }

    // Map to TravelCard props with enhanced mock aesthetics
    const flightTours = flightToursData.map((tour, idx) => {
        const aesthetic = getMockAesthetics(idx)
        return {
            id: tour.id,
            title: tour.titulo,
            slug: tour.slug || tour.id,
            image: tour.coverImage || tour.webCoverImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop",
            price: tour.precioAdulto,
            // Simulate original price for discount look if it's the first or third item
            originalPrice: idx % 2 === 0 ? tour.precioAdulto * 1.2 : undefined,
            days: tour.fechaViaje && tour.fechaFin
                ? Math.ceil((new Date(tour.fechaFin).getTime() - new Date(tour.fechaViaje).getTime()) / (1000 * 60 * 60 * 24))
                : 5,
            rating: aesthetic.rating,
            reviews: aesthetic.reviews,
            tags: aesthetic.tag,
            theme: 'dark'
        }
    })

    const busTours = busToursData.map((tour, idx) => {
        const aesthetic = getMockAesthetics(idx + 1) // Offset for variety
        return {
            id: tour.id,
            title: tour.titulo,
            slug: tour.slug || tour.id,
            image: tour.coverImage || tour.webCoverImage || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop",
            price: tour.precioAdulto,
            originalPrice: idx % 3 === 0 ? tour.precioAdulto * 1.15 : undefined,
            days: tour.fechaViaje && tour.fechaFin
                ? Math.ceil((new Date(tour.fechaFin).getTime() - new Date(tour.fechaViaje).getTime()) / (1000 * 60 * 60 * 24))
                : 5,
            rating: aesthetic.rating,
            reviews: aesthetic.reviews,
            tags: aesthetic.tag,
            theme: 'dark'
        }
    })

    return <HomeClient flightTours={flightTours} busTours={busTours} />
}
