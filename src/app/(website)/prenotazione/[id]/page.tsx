
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { Button } from "@/components/website/ui/button"
import { Calendar, MapPin, Users, CheckCircle2, ShieldCheck, ArrowRight, CreditCard } from "lucide-react"
import ShoppingCart from "@/components/shadcn-studio/blocks/shopping-cart-01/shopping-cart-01"

interface BookingPageProps {
    params: Promise<{
        id: string
    }>
}
// import { BookingForm } from "@/components/booking/BookingForm" - REMOVED

export const dynamic = 'force-dynamic';

async function getTour(slugOrId: string) {
    // 1. Try TourAereo (Slug then ID)
    let tourAereo = await prisma.tourAereo.findUnique({ where: { slug: slugOrId } })
    if (!tourAereo) {
        tourAereo = await prisma.tourAereo.findUnique({ where: { id: slugOrId } })
    }
    if (tourAereo) return { ...tourAereo, type: 'aereo' }

    // 2. Try TourBus (Slug then ID)
    let tourBus = await prisma.tourBus.findUnique({ where: { slug: slugOrId } })
    if (!tourBus) {
        tourBus = await prisma.tourBus.findUnique({ where: { id: slugOrId } })
    }
    if (tourBus) return { ...tourBus, type: 'bus' }

    return null
}



export default async function BookingPage({ params }: BookingPageProps) {
    const { id } = await params
    const { userId } = await auth()
    const user = await currentUser()
    const tour = await getTour(id)

    // LAZY SYNC: Ensure User Exists in DB
    // This allows us to skip Webhooks configuration.
    // When a new user logs in for the first time, we assume they are valid and sync them.
    if (userId) {
        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } })

        if (!dbUser) {
            try {
                // Fetch details from Clerk to populate DB
                const client = await clerkClient()
                const clerkUser = await client.users.getUser(userId)

                const email = clerkUser.emailAddresses[0]?.emailAddress
                const phone = clerkUser.phoneNumbers[0]?.phoneNumber

                if (email) {
                    await prisma.user.create({
                        data: {
                            clerkId: userId,
                            email: email,
                            firstName: clerkUser.firstName,
                            lastName: clerkUser.lastName,
                            phoneNumber: phone,
                            photo: clerkUser.imageUrl,
                            role: 'CLIENT' // Explicitly mark as External Client
                        }
                    })
                    console.log(`[LAZY SYNC] Created user ${userId} in DB`)
                }
            } catch (error) {
                console.error("[LAZY SYNC] Failed to sync user:", error)
            }
        }
    }

    if (!tour) return notFound()

    return (
        <ShoppingCart
            tour={{
                id: tour.id,
                slug: tour.slug || tour.id,
                title: tour.titulo,
                price: tour.precioAdulto,
                image: tour.webCoverImage || tour.coverImage || "/placeholder.jpg",
                type: tour.type as 'bus' | 'aereo',
                date: tour.fechaViaje ? tour.fechaViaje.toISOString() : new Date().toISOString(),
                duration: tour.duracionTexto || "N/A",
                // Validar que las propiedades existan antes de pasarlas (para evitar errores si el tipo no coincide perfectamente en tiempo de ejecución)
                optionCameraSingola: 'optionCameraSingola' in tour ? !!tour.optionCameraSingola : false,
                optionFlexibleCancel: 'optionFlexibleCancel' in tour ? !!tour.optionFlexibleCancel : false,
                priceFlexibleCancel: 'priceFlexibleCancel' in tour ? Number(tour.priceFlexibleCancel) : 0,
                optionCameraPrivata: 'optionCameraPrivata' in tour ? !!tour.optionCameraPrivata : false,
                priceCameraPrivata: 'priceCameraPrivata' in tour ? Number(tour.priceCameraPrivata) : 0,
            }}
        />
    )
}
