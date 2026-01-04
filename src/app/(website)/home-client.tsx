"use client"

import * as React from "react"
import { Button } from "@/components/website/ui/button"
import { TravelCard } from "@/components/website/ui/travel-card"
import { Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"

import { CollectionsGrid } from "@/components/website/sections/collections-grid"
import { HowItWorks } from "@/components/website/sections/how-it-works"
import { Features } from "@/components/website/sections/features"
import { VideoStories } from "@/components/website/sections/video-stories"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/website/ui/carousel"
import { DraggableCardsSection } from "@/components/website/sections/draggable-cards-section"
import TestimonialsComponent from "@/components/shadcn-studio/blocks/testimonials-component-06/testimonials-component-06"

interface TourData {
    id: string
    title: string
    slug: string
    image: string
    price: number
    days: number
    rating: number
    reviews: number
    tags: string[]
    theme: string | any
    originalPrice?: number
}

interface HomeClientProps {
    flightTours: TourData[]
    busTours: TourData[]
}



const testimonialsData = [
    {
        name: 'Elizabeth Rodriguez',
        role: 'Viaggiatrice',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elizabeth',
        content: 'Agenzia di viaggi seria, ragazzi gentilissimi e disponibili per ogni richiesta. Io e mia figlia ci siamo trovate molto bene e ci siamo divertite, super consigliato! 😍✈️'
    },
    {
        name: 'Elida Rubio Escobar',
        role: 'Viaggiatrice',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elida',
        content: 'Si, sono stati molto bravi!!! Bella giornata a Firenze!!! Consigliatissimo!! 👏🇮🇹'
    },
    {
        name: 'Penny Jordan',
        role: 'Frequent Traveler',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Penny',
        content: 'Ottima esperienza. Precisione, cortesia e puntualità sono le parole chiave di questa agenzia. Molto consigliata per chi cerca serietà.'
    },
    {
        name: 'Aleida Padilla',
        role: 'Viaggiatrice',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aleida',
        content: 'Puntualità e responsabilità. Le ragazze dello staff sono simpatiche e amichevoli. È stato un viaggio meraviglioso, brave guide!'
    },
    {
        name: 'Blerina Kola',
        role: 'Viaggiatrice',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blerina',
        content: 'È stato un viaggio meraviglioso! Grazie GiBravo per l\'organizzazione impeccabile! ❤️✨'
    },
    {
        name: 'Andrea Zoccali',
        role: 'Viaggiatore',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Andrea',
        content: 'Bellissimo giro, guide in gamba e sempre molto disponibili. Un\'esperienza che rifarei sicuramente. Consigliatissimo. 🙌🌍'
    },
    {
        name: 'Anna Tarricone',
        role: 'Viaggiatrice',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
        content: 'Organizzazione perfetta e precisa. I ragazzi sono veramente gentili e molto informati sui luoghi da visitare... Super consigliato!'
    },
    {
        name: 'Jennifer Garini',
        role: 'Viaggiatrice Seriale',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer',
        content: 'Agenzia organizzata molto bene. È il secondo viaggio che faccio con loro e non ci sono mai stati problemi di nessun tipo. Staff cordiale e simpatico. 😊'
    },
    {
        name: 'Rossana Pelizzari',
        role: 'Viaggiatrice',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rossana',
        content: 'Bellissima giornata organizzata con lo staff di GiBravo Travel. Ragazzi simpaticissimi e sempre disponibili a dare ottimi consigli. Alla prossima! 😀✌️💪'
    },
    {
        name: 'Fer Quispe Lazarte',
        role: 'Viaggiatore Premium',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fer',
        content: 'Una volta ancora confido in questa agenzia perché mi trovo molto bene con lo staff di GiBravo. Amo ogni luogo che ho conosciuto grazie a voi.'
    }
]

export function HomeClient({ flightTours, busTours }: HomeClientProps) {
    // Combine both Flight and Bus tours for the Featured Carousel
    const allTours = [...flightTours, ...busTours]

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section - GiBravo Design */}
            <section className="relative h-[650px] w-full flex items-center justify-center">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://res.cloudinary.com/dskliu1ig/image/upload/v1767357683/hero-homepage_obrvuk.webp"
                        alt="Hero Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Darker gradient for text contrast */}
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 container flex flex-col items-center text-center px-4 mt-0 md:mt-[-60px]">
                    <RevealOnScroll>
                        <h1 className="text-4xl md:text-[52px] font-[700] tracking-tight text-white leading-[1.1] mb-2 drop-shadow-lg">
                            Viaggia sicuro,
                        </h1>
                        <h2 className="text-3xl md:text-[52px] font-[700] tracking-tight text-white leading-[1.1] mb-4 drop-shadow-md">
                            viaggia con GiBravo
                        </h2>

                        <p className="text-xl md:text-2xl font-medium text-white/90 mb-12 drop-shadow-sm tracking-wide">
                            Scopri il mondo viaggiando in piccoli gruppi
                        </p>
                    </RevealOnScroll>
                </div>


            </section>

            {/* Featured Section (Carousel) */}
            <section className="pt-20 pb-12 bg-slate-50">
                <div className="container px-4 max-w-7xl mx-auto">
                    <div className="flex flex-col items-center mb-[30px] text-center">
                        <RevealOnScroll>
                            <h2 className="section-title mb-2">
                                Scelti per te
                            </h2>
                        </RevealOnScroll>
                    </div>

                    <div className="w-full">
                        <RevealOnScroll delay={200}>
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                plugins={[
                                    Autoplay({
                                        delay: 3000,
                                    }),
                                ]}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-2 md:-ml-4">
                                    {allTours.length > 0 ? (
                                        allTours.map((trip) => (
                                            <CarouselItem key={trip.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                                                <div className="p-1 h-full">
                                                    <TravelCard {...trip} size="compact" theme="light" />
                                                </div>
                                            </CarouselItem>
                                        ))
                                    ) : (
                                        // Use Mock Data if no real tours are available, just for visual check
                                        <div className="w-full text-center text-gray-500 py-10 italic">
                                            Al momento non ci sono offerte disponibili.
                                        </div>
                                    )}
                                </CarouselContent>
                                <CarouselPrevious className="hidden md:flex -left-4 md:-left-12 bg-white/80 hover:bg-white text-[#004BA5] border-[#004BA5]/20 hover:border-[#004BA5]" />
                                <CarouselNext className="hidden md:flex -right-4 md:-right-12 bg-white/80 hover:bg-white text-[#004BA5] border-[#004BA5]/20 hover:border-[#004BA5]" />
                            </Carousel>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            <Features />

            <div className="hidden md:block">
                <DraggableCardsSection />
            </div>

            <RevealOnScroll delay={100}>
                <TestimonialsComponent testimonials={testimonialsData} />
            </RevealOnScroll>

            {/* Other Sections */}
            < RevealOnScroll delay={100} >
                <CollectionsGrid />
            </RevealOnScroll >
            <RevealOnScroll delay={100}>
                <HowItWorks />
            </RevealOnScroll>
        </div >
    )
}

