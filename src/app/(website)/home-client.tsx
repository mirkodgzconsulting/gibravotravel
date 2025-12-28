"use client"

import * as React from "react"
import { Button } from "@/components/website/ui/button"
import { TravelCard } from "@/components/website/ui/travel-card"
import { Search } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/context/website/language-context"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"

import { CollectionsGrid } from "@/components/website/sections/collections-grid"
import { HowItWorks } from "@/components/website/sections/how-it-works"
import { VideoStories } from "@/components/website/sections/video-stories"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/website/ui/carousel"

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

export function HomeClient({ flightTours, busTours }: HomeClientProps) {
    const { t } = useLanguage()

    // Combine all tours for the Featured Carousel
    const allTours = [...flightTours, ...busTours]

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section - Exact WeRoad Replication */}
            <section className="relative h-[650px] w-full flex items-center justify-center">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1513581166391-887a96ddeafd?q=80&w=2070&auto=format&fit=crop"
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
                        <h1 className="text-4xl md:text-[52px] font-[900] tracking-tight text-white leading-[1.1] mb-2 drop-shadow-lg">
                            {t("heroTitle1")}
                        </h1>
                        <h2 className="text-3xl md:text-[52px] font-[900] tracking-tight text-white leading-[1.1] mb-4 drop-shadow-md">
                            {t("heroTitle2")}
                        </h2>
                        <p className="text-lg md:text-xl font-medium text-white/90 mb-12 drop-shadow-sm tracking-wide">
                            {t("heroSubtitle")}
                        </p>
                    </RevealOnScroll>
                </div>

                {/* Search Pill Component - Overlapping Bottom Edge */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4">
                    <RevealOnScroll delay={200}>
                        <div className="bg-white rounded-xl p-2 shadow-[0px_8px_30px_rgba(0,0,0,0.12)] flex flex-col md:flex-row items-center h-auto md:h-[80px] gap-2 md:gap-0">

                            {/* Section 1: Destination */}
                            <div className="w-full md:flex-1 flex flex-col justify-center items-start text-left md:border-r border-gray-100 px-6 h-full cursor-pointer hover:bg-gray-50 rounded-xl md:rounded-l-xl md:rounded-r-none group transition-colors py-3 md:py-0">
                                <span className="text-[14px] font-[800] text-gray-400 mb-0.5 group-hover:text-[#FE8008] transition-colors">{t("where")}</span>
                                <span className="text-[18px] font-[800] text-slate-900 truncate w-full">{t("anyDestination")}</span>
                            </div>

                            {/* Section 2: Date */}
                            <div className="w-full md:flex-1 flex flex-col justify-center items-start text-left md:border-r border-gray-100 px-6 h-full cursor-pointer hover:bg-gray-50 group transition-colors py-3 md:py-0">
                                <span className="text-[14px] font-[800] text-gray-400 mb-0.5 group-hover:text-[#FE8008] transition-colors">{t("when")}</span>
                                <span className="text-[18px] font-[800] text-slate-900 truncate w-full">{t("allYear")}</span>
                            </div>

                            {/* Section 3: Search Button */}
                            <div className="w-full md:w-auto p-1 md:px-2">
                                <Button className="w-full md:w-auto rounded-lg h-[60px] md:h-[64px] px-10 bg-[#004BA5] hover:bg-[#FE8008] text-white font-[800] text-[18px] shadow-lg flex items-center gap-2 transition-colors duration-300">
                                    <Search className="h-5 w-5 stroke-[3px]" />
                                    {t("searchBtn")}
                                </Button>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* Featured Section (Carousel) */}
            <section className="pt-20 pb-12 bg-slate-50">
                <div className="container px-4 max-w-7xl mx-auto">
                    <div className="flex flex-col items-center mb-[30px] text-center">
                        <RevealOnScroll>
                            <h2 className="text-3xl font-[900] tracking-tight text-[#323232] mb-2">
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
                                        <div className="w-full text-center text-gray-400 py-10">
                                            Caricamento offerte in corso...
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


            {/* NEW: Flight Trips Section (Dark Theme with Aurora Background) */}
            <section className="relative w-full">
                {/* 1. Background Image Layer (Absolute) - Acts as the "Sky" backdrop */}
                <div className="absolute top-0 left-0 w-full h-[400px] z-0">
                    <Image
                        src="https://1000sitiosquever.com/public/images/supima-373-koh-phing-kan.51O.png"
                        alt="Safari Landscape"
                        fill
                        quality={100}
                        sizes="100vw"
                        className="object-cover object-top opacity-100"
                    />
                    {/* Gradient to blend into the dark content below */}
                    <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-[#0e191a] via-[#0e191a]/60 to-transparent" />
                </div>

                {/* 2. Content Layer (Relative z-10) */}
                <div className="relative z-10 flex flex-col w-full">

                    {/* A. Title Block - Occupies the 'Sky' area (Matches Image Height) */}
                    <div className="h-[400px] w-full flex flex-col items-center justify-start pt-2 md:pt-4 px-4 text-center text-white drop-shadow-md">
                        <RevealOnScroll>
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-3xl lg:text-5xl font-[900] tracking-tight mb-4">
                                    Viaggi in aereo
                                </h2>
                                <p className="font-medium text-lg lg:text-xl opacity-90 max-w-2xl mx-auto">
                                    Scopri il mondo volando verso mete indimenticabili
                                </p>
                            </div>
                        </RevealOnScroll>
                    </div>

                    {/* B. Cards Block - Separate Element below the sky area */}
                    <div className="w-full bg-[#0e191a] pb-10 px-4 pt-4">
                        <div className="container mx-auto max-w-7xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {/* REAL DATA from Database */}
                                {flightTours.length > 0 ? (
                                    flightTours.map((trip, idx) => (
                                        <RevealOnScroll key={trip.slug} delay={idx * 50}>
                                            <TravelCard {...trip} theme="dark" size="compact" />
                                        </RevealOnScroll>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-white/50 py-10">
                                        Nessun viaggio in aereo disponibile al momento.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center mt-8">
                                <Link href="/tipi-di-viaggio/aereo">
                                    <RevealOnScroll delay={300}>
                                        <Button className="bg-[#004BA5] hover:bg-[#FE8008] text-white font-[800] px-8 py-4 rounded-lg text-lg shadow-lg hover:scale-105 transition-transform">
                                            Vedi tutti i voli
                                        </Button>
                                    </RevealOnScroll>
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </section>


            {/* NEW: Bus Trips Section (Dark Theme with Safari Background) */}
            <section className="relative w-full">
                {/* 1. Background Image Layer (Absolute) - Acts as the "Sky" backdrop */}
                <div className="absolute top-0 left-0 w-full h-[400px] z-0">
                    <Image
                        src="https://assets.voxcity.com/uploads/blog_images/What-is-the-first-place-to-visit-when-you-travel-to-Rome_original.jpg"
                        alt="Bus Travel Landscape"
                        fill
                        quality={100}
                        sizes="100vw"
                        className="object-cover object-top opacity-100"
                    />
                    {/* Gradient to blend into the dark content below */}
                    <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-[#15110E] via-[#15110E]/60 to-transparent" />
                </div>

                {/* 2. Content Layer (Relative z-10) */}
                <div className="relative z-10 flex flex-col w-full">

                    {/* A. Title Block - Occupies the 'Sky' area (Matches Image Height) */}
                    <div className="h-[400px] w-full flex flex-col items-center justify-start pt-2 md:pt-4 px-4 text-center text-white drop-shadow-md">
                        <RevealOnScroll>
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-3xl lg:text-5xl font-[900] tracking-tight mb-4">
                                    Viaggi in Autobus
                                </h2>
                                <p className="font-medium text-lg lg:text-xl opacity-90 max-w-2xl mx-auto">
                                    Il comfort della strada, la bellezza del viaggio
                                </p>
                            </div>
                        </RevealOnScroll>
                    </div>

                    {/* B. Cards Block - Separate Element below the sky area */}
                    <div className="w-full bg-[#15110E] pb-10 px-4 pt-4">
                        <div className="container mx-auto max-w-7xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {/* REAL DATA from Database */}
                                {busTours.length > 0 ? (
                                    busTours.map((trip, idx) => (
                                        <RevealOnScroll key={trip.slug} delay={idx * 50}>
                                            <TravelCard {...trip} theme="dark" size="compact" />
                                        </RevealOnScroll>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center text-white/50 py-10">
                                        Nessun viaggio in autobus disponibile al momento.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center mt-8">
                                <Link href="/tipi-di-viaggio/autobus">
                                    <RevealOnScroll delay={300}>
                                        <Button className="bg-[#004BA5] hover:bg-[#FE8008] text-white font-[800] px-8 py-4 rounded-lg text-lg shadow-lg hover:scale-105 transition-transform">
                                            Vedi tutti i viaggi in bus
                                        </Button>
                                    </RevealOnScroll>
                                </Link>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Other Sections */}
            < RevealOnScroll delay={100} >
                <CollectionsGrid />
            </RevealOnScroll >
            <RevealOnScroll delay={100}>
                <HowItWorks />
            </RevealOnScroll>
            <RevealOnScroll delay={100}>
                <VideoStories />
            </RevealOnScroll>
        </div >
    )
}
