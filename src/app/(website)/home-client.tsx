"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/website/ui/button"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

const DraggableCardsSection = dynamic(
    () =>
        import("@/components/website/sections/draggable-cards-section").then(
            (m) => ({ default: m.DraggableCardsSection }),
        ),
    { ssr: true, loading: () => null },
)

const TestimonialsComponent = dynamic(
    () =>
        import(
            "@/components/shadcn-studio/blocks/testimonials-component-06/testimonials-component-06",
        ).then((m) => ({ default: m.default })),
    { ssr: true, loading: () => null },
)

const HowItWorks = dynamic(
    () =>
        import("@/components/website/sections/how-it-works").then((m) => ({
            default: m.HowItWorks,
        })),
    { ssr: true, loading: () => null },
)

const Features = dynamic(
    () =>
        import("@/components/website/sections/features").then((m) => ({
            default: m.Features,
        })),
    { ssr: true, loading: () => null },
)

const CollectionsGrid = dynamic(
    () =>
        import("@/components/website/sections/collections-grid").then((m) => ({
            default: m.CollectionsGrid,
        })),
    { ssr: true, loading: () => null },
)

/** Compressione/formato migliori lato CDN; larghezza max coerente con hero fullscreen. */
function cloudinaryHeroFullBleed(src: string) {
    if (!src.includes("res.cloudinary.com")) return src
    const marker = "/upload/"
    const i = src.indexOf(marker)
    if (i === -1) return src
    return `${src.slice(0, i + marker.length)}f_auto,q_auto:good,w_1920,c_limit/${src.slice(i + marker.length)}`
}

export function HomeClient() {

    const heroImages = React.useMemo(
        () =>
            [
                "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252166/img-hero5_sqkdwb.jpg",
                "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252165/img-hero6_kidgur.jpg",
                "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero1_ebkhxx.jpg",
                "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero3_irc053.jpg",
                "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero2_xx72si.jpg",
                "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252162/img-hero4_fcauvc.jpg",
            ].map(cloudinaryHeroFullBleed),
        [],
    )

    const [currentHeroIndex, setCurrentHeroIndex] = React.useState(0)

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [heroImages.length])

    const heroSrc = heroImages[currentHeroIndex]
    const isFirstSlide = currentHeroIndex === 0

    return (
        <div className="flex flex-col min-h-screen">
            <section className="relative h-[60vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src={heroSrc}
                        alt="Destinazioni e viaggi di gruppo GiBravo Travel"
                        fill
                        className="object-cover transition-opacity duration-1000 ease-in-out"
                        sizes="100vw"
                        priority={isFirstSlide}
                        fetchPriority={isFirstSlide ? "high" : "low"}
                    />
                    <div
                        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/50"
                        aria-hidden
                    />
                </div>

                <div className="relative z-10 container flex flex-col items-center text-center px-4 mt-24">
                    <RevealOnScroll>
                        {/* Un solo H1: Google si aspetta un titolo principale unico; due righe solo estetiche */}
                        <h1 className="text-4xl md:text-[52px] font-[700] tracking-tight text-white leading-[1.1] mb-6 drop-shadow-2xl shadow-black">
                            <span className="block hover:text-[#004BA5] transition-colors duration-700 mb-2">
                                Viaggia sicuro,
                            </span>
                            <span className="block text-3xl md:text-[52px] hover:text-[#004BA5] transition-colors duration-700">
                                viaggia con GiBravo
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl font-medium text-white/95 hover:text-[#FE8008] transition-colors duration-300 mb-12 drop-shadow-xl tracking-wide max-w-2xl mx-auto shadow-black">
                            Viaggi organizzati da Milano in piccoli gruppi: tour in bus e aereo per Italia ed Europa. Agenzia viaggi GiBravo Travel.
                        </p>

                        <div className="flex gap-4 justify-center animate-in fade-in zoom-in duration-1000 delay-300">
                            <Link href="/partenze">
                                <Button size="lg" className="rounded-full text-lg px-8 py-6 shadow-2xl">
                                    Scopri le Partenze
                                </Button>
                            </Link>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            <div>
                <DraggableCardsSection />
            </div>

            <RevealOnScroll delay={100}>
                <TestimonialsComponent />
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
                <HowItWorks />
            </RevealOnScroll>

            <Features />

            <RevealOnScroll delay={100}>
                <CollectionsGrid />
            </RevealOnScroll>
        </div>
    )
}
