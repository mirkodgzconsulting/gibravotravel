
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { auth, currentUser } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/nextjs/server"
import { Button } from "@/components/website/ui/button"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import { Calendar, MapPin, Users, CheckCircle2, ShieldCheck, ArrowRight, CreditCard } from "lucide-react"

interface BookingPageProps {
    params: Promise<{
        id: string
    }>
}
import { BookingForm } from "@/components/booking/BookingForm"

export const dynamic = 'force-dynamic';

async function getTourById(id: string) {
    // 1. Unification Strategy: Search both tables
    let tourAereo = await prisma.tourAereo.findUnique({ where: { id } })
    if (tourAereo) return { ...tourAereo, type: 'aereo' }

    let tourBus = await prisma.tourBus.findUnique({ where: { id } })
    if (tourBus) return { ...tourBus, type: 'bus' }

    return null
}



export default async function BookingPage({ params }: BookingPageProps) {
    const { id } = await params
    const { userId } = await auth()
    const user = await currentUser()
    const tour = await getTourById(id)

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
                // Continue anyway, maybe they exist or temporary error. 
                // We don't want to block the booking page if possible, 
                // but the BookingForm might fail if it depends on DB relations.
            }
        }
    }

    if (!tour) return notFound()

    // Date Formatting
    const formatDate = (d: Date | null) => {
        if (!d) return 'Data da definire'
        return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    // Image Setup
    const heroImage = tour.webCoverImage || tour.coverImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"

    return (
        <div className="min-h-screen bg-slate-50 pt-[100px] pb-20">
            <div className="container mx-auto px-4 max-w-6xl">

                <RevealOnScroll>
                    <div className="mb-8">
                        <Link href={`/tour/${tour.slug || tour.id}`} className="text-sm font-bold text-slate-500 hover:text-[#004BA5] flex items-center gap-1 mb-4">
                            ← Torna al viaggio
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-[900] text-[#323232]">Riepilogo Prenotazione</h1>
                        <p className="text-slate-600">Controlla i dettagli prima di procedere al pagamento.</p>
                    </div>
                </RevealOnScroll>

                {/* CONDITIONAL AUTH GATE */}
                {!userId ? (
                    <RevealOnScroll delay={100}>
                        <div className="bg-white rounded-2xl p-8 lg:p-12 shadow-xl border border-[#004BA5]/20 text-center max-w-2xl mx-auto">
                            <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="h-10 w-10 text-[#004BA5]" />
                            </div>
                            <h2 className="text-3xl font-[900] text-[#323232] mb-4">
                                Per continuare, accedi o registrati
                            </h2>
                            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                                Per garantirti la massima sicurezza e darti accesso alla tua <strong>Area Riservata</strong> (dove troverai voucher e dettagli), abbiamo bisogno di sapere chi sei.
                            </p>

                            <div className="grid gap-4 max-w-sm mx-auto">
                                <Link href={`/sign-up?redirect_url=/prenotazione/${tour.id}`}>
                                    <Button className="w-full h-[56px] text-lg bg-[#FE8008] hover:bg-[#FE8008]/90 text-white font-[800] rounded-xl shadow-lg shadow-orange-500/20">
                                        Crea un account (Gratis)
                                    </Button>
                                </Link>
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-slate-400 font-bold">oppure</span>
                                    </div>
                                </div>
                                <Link href={`/sign-in?redirect_url=/prenotazione/${tour.id}`}>
                                    <Button variant="outline" className="w-full h-[56px] text-lg border-2 border-slate-200 text-slate-700 hover:border-[#004BA5] hover:text-[#004BA5] font-[800] rounded-xl">
                                        Accedi al tuo account
                                    </Button>
                                </Link>
                            </div>

                            <p className="mt-6 text-sm text-slate-400">
                                Ci metti meno di 1 minuto. Promesso.
                            </p>
                        </div>
                    </RevealOnScroll>
                ) : (
                    <BookingForm
                        tourId={tour.id}
                        tourType={tour.type}
                        price={tour.precioAdulto}
                        initialUserData={{
                            firstName: user?.firstName || "",
                            lastName: user?.lastName || "",
                            email: user?.emailAddresses[0]?.emailAddress || "",
                            phone: user?.phoneNumbers[0]?.phoneNumber || ""
                        }}
                    />
                )}
            </div>
        </div>
    )
}
