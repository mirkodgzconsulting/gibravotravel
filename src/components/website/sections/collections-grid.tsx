"use client"

import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"

const collections = [
    {
        title: "Natale e Capodanno",
        subtitle: "Gli ultimi posti last minute!",
        image: "https://gibravo.it/wp-content/uploads/2025/09/0c4dc96c8f7406a826564ce48e113a7094a56510-scaled-e1757517721747.webp",
        href: "/collection/natale-capodanno",
        className: "col-span-12 md:col-span-8 lg:col-span-6 row-span-1"
    },
    {
        title: "Ponti 2026",
        subtitle: "Scopri quali saranno",
        image: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1776&auto=format&fit=crop", // Taj Mahal vibe
        href: "/collection/ponti-2026",
        className: "col-span-12 md:col-span-4 lg:col-span-3 row-span-1 md:row-span-2"
    },
    {
        title: "Aurora boreale",
        subtitle: "Vivi la magia del Nord",
        image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop",
        href: "/collection/aurora-boreale",
        className: "col-span-12 md:col-span-6 lg:col-span-3 row-span-1"
    },
    {
        title: "Sci e snowboard",
        subtitle: "Nuove amicizie sulla neve",
        image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070&auto=format&fit=crop", // Skiing
        href: "/collection/sci-snowboard",
        className: "col-span-12 md:col-span-6 lg:col-span-3 row-span-1"
    },
    {
        title: "A meno di 1000€",
        subtitle: "Per ogni budget, mille avventure!",
        image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop", // City/Urban vibe
        href: "/collection/budget",
        className: "col-span-12 md:col-span-6 lg:col-span-3 row-span-1"
    },
    {
        title: "Estate 2026",
        subtitle: "Pianifica la tua prossima avventura",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", // Tropical beach
        href: "/collection/estate-2026",
        className: "col-span-12 md:col-span-6 lg:col-span-3 row-span-1"
    }
]

export function CollectionsGrid() {
    return (
        <section className="py-12 bg-white">
            <div className="container px-4 mx-auto max-w-7xl">
                <h2 className="text-3xl font-[900] tracking-tight text-[#323232] mb-8">
                    Le nostre collection
                </h2>

                <div className="grid grid-cols-12 gap-4 auto-rows-[240px]">
                    {collections.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={`relative group overflow-hidden rounded-xl ${item.className}`}
                        >
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="absolute bottom-0 left-0 p-6 w-full flex justify-between items-end">
                                <div className="text-white">
                                    <h3 className="text-2xl font-[900] mb-1 leading-tight">{item.title}</h3>
                                    <p className="text-sm font-medium opacity-90">{item.subtitle}</p>
                                </div>
                                <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                    <ChevronRight className="text-white h-6 w-6" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
