import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"

/** Rigenera la mappa (cache CDN) senza colpire il DB ad ogni richiesta */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://www.gibravo.it"

    const routes = [
        "",
        "/chi-siamo",
        "/partenze",
        "/categoria/aereo",
        "/categoria/bus",
        "/come-funziona",
        "/contatti",
        "/domande-frequenti",
        "/offerta-summer-tour-liguria",
        "/informativa-privacy",
        "/termini-e-condizioni",
        "/informativa-cookie",
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: route === "" ? 1 : 0.8,
    }))

    let tourRoutes: MetadataRoute.Sitemap = []

    try {
        const tourWhere = {
            isPublic: true,
            isActive: true,
            slug: { not: null },
        } as const

        const [flightTours, busTours] = await Promise.all([
            prisma.tourAereo.findMany({
                where: tourWhere,
                select: { slug: true, updatedAt: true },
            }),
            prisma.tourBus.findMany({
                where: tourWhere,
                select: { slug: true, updatedAt: true },
            }),
        ])

        const bySlug = new Map<string, Date>()
        for (const t of [...flightTours, ...busTours]) {
            const slug = t.slug?.trim()
            if (!slug) continue
            const prev = bySlug.get(slug)
            if (!prev || t.updatedAt > prev) {
                bySlug.set(slug, t.updatedAt)
            }
        }

        tourRoutes = [...bySlug.entries()].map(([slug, updatedAt]) => ({
            url: `${baseUrl}/tour/${encodeURIComponent(slug)}`,
            lastModified: updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.85,
        }))
    } catch (error) {
        console.error("Sitemap: errore caricamento tour da DB:", error)
    }

    return [...routes, ...tourRoutes]
}
