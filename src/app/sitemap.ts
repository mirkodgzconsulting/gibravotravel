import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://www.gibravo.it'

    // 1. Static Routes
    const routes = [
        '',
        '/chi-siamo',
        '/destinazioni',
        '/tipi-di-viaggio',
        '/contatti',
        '/domande-frequenti',
        '/informativa-privacy',
        '/termini-e-condizioni',
        '/informativa-cookie',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Dynamic Routes (Tours)
    // Fetch active tours to include specific tour pages if beneficial, 
    // or generally rely on the destinations page.
    // For now, listing categories or specific tours:

    // Example: fetch tours and add them
    /*
    const tours = await prisma.tour.findMany({ select: { slug: true, updatedAt: true } })
    const tourRoutes = tours.map((tour) => ({
      url: `${baseUrl}/tour/${tour.slug}`,
      lastModified: tour.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    }))
    */

    // Checking `src/app/(website)/tour/[slug]/page.tsx` existence would confirm structure.
    // Assuming /tour/[slug] structure based on "tour" folder found in list_dir.

    let tourRoutes: MetadataRoute.Sitemap = []

    try {
        const [flightTours, busTours] = await Promise.all([
            prisma.tourAereo.findMany({
                where: { isPublic: true },
                select: { slug: true, updatedAt: true }
            }),
            prisma.tourBus.findMany({
                where: { isPublic: true },
                select: { slug: true, updatedAt: true }
            })
        ])

        const allTours = [...flightTours, ...busTours];

        tourRoutes = allTours.map((tour) => ({
            url: `${baseUrl}/tour/${tour.slug}`,
            lastModified: tour.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        }))

    } catch (error) {
        console.log('Sitemap generation error (database):', error)
    }

    return [...routes, ...tourRoutes]
}
