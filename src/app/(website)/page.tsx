
import { Button } from "@/components/website/ui/button"
import { TravelCard } from "@/components/website/ui/travel-card"
import { Search } from "lucide-react"
import Image from "next/image"
// Remove hook usage for translations in async server component if possible, 
// OR strictly separate Client Components. 
// However, the current page uses `useLanguage` hook which requires "use client".
// PROBLEM: We cannot make the default export async (Server Component) if it has "use client".
// SOLUTION: We must keep "use client" for the interactive parts (language, search pill?) 
// BUT we need server data. 
// Pattern: Pass data as props? No, page.tsx is the entry.
// Pattern: Make page.tsx a Server Component, and fetch data there. 
// Move the interactive parts (Search Pill, Language context usage for Hero text) to Client Components.
// OR: Since we need to move fast and "useLanguage" is used everywhere for translations...
// We can fetch data in a separate Server Component and pass it?
// Actually, `useLanguage` is context. 
// 
// Let's look at the current `page.tsx`. It has "use client" at the top.
// If I change it to `async function Home()`, Next.js will error because async components are Server Components, and Server Components cannot use context/hooks.
//
// Refactoring strategy:
// 1. Rename current `Home` to `HomeClient` and keep it "use client".
// 2. Create a new `page.tsx` that is a Server Component.
// 3. In `page.tsx`, fetch the data.
// 4. Pass the data as props to `HomeClient`.
//
// This is the cleanest way.

import { prisma } from "@/lib/prisma"
import { HomeClient } from "./home-client"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
    // Fetch Data
    const today = new Date()

    const flightToursData = await prisma.tourAereo.findMany({
        where: {
            isActive: true,
            isPublic: true, // Added by Agent
            fechaViaje: { gte: today }
        },
        orderBy: { fechaViaje: 'asc' },
        take: 6
    })

    const busToursData = await prisma.tourBus.findMany({
        where: {
            isActive: true,
            isPublic: true, // Added by Agent
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
            slug: tour.id,
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
            slug: tour.id,
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
