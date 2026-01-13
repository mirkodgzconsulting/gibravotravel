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

    const heroImages = [
        "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252166/img-hero5_sqkdwb.jpg",
        "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252165/img-hero6_kidgur.jpg",
        "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero1_ebkhxx.jpg",
        "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero3_irc053.jpg",
        "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero2_xx72si.jpg",
        "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252162/img-hero4_fcauvc.jpg"
    ]

    const [currentHeroIndex, setCurrentHeroIndex] = React.useState(0)

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section - GiBravo Design */}
            <section className="relative h-[90vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    {heroImages.map((src, index) => (
                        <Image
                            key={src}
                            src={src}
                            alt={`Hero Background ${index + 1}`}
                            fill
                            className={`object-cover transition-opacity duration-1000 ease-in-out ${index === currentHeroIndex ? "opacity-100" : "opacity-0"
                                }`}
                            priority={index === 0}
                        />
                    ))}
                    {/* Darker gradient for text contrast - Enhanced */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent z-10" />
                </div>

                {/* Content */}
                <div className="relative z-10 container flex flex-col items-center text-center px-4 mt-24">
                    <RevealOnScroll>
                        <h1 className="text-4xl md:text-[52px] font-[700] tracking-tight text-white hover:text-[#004BA5] transition-colors duration-700 leading-[1.1] mb-2 drop-shadow-2xl shadow-black">
                            Viaggia sicuro,
                        </h1>
                        <h2 className="text-3xl md:text-[52px] font-[700] tracking-tight text-white hover:text-[#004BA5] transition-colors duration-700 leading-[1.1] mb-6 drop-shadow-2xl shadow-black">
                            viaggia con GiBravo
                        </h2>

                        <p className="text-xl md:text-2xl font-medium text-white/95 hover:text-[#FE8008] transition-colors duration-300 mb-12 drop-shadow-xl tracking-wide max-w-2xl mx-auto shadow-black">
                            Scopri il mondo viaggiando in piccoli gruppi
                        </p>
                    </RevealOnScroll>
                </div>


            </section>

            <div>
                <DraggableCardsSection />
            </div>

            <RevealOnScroll delay={100}>
                <div className="pt-20">
                    <TestimonialsComponent />
                </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
                <HowItWorks />
            </RevealOnScroll>

            <Features />

            {/* Other Sections */}
            < RevealOnScroll delay={100} >
                <CollectionsGrid />
            </RevealOnScroll >
        </div >
    )
}

