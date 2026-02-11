"use client"

import Link from "next/link"
import Image from "next/image"
import { ChevronRight } from "lucide-react"

const WHATSAPP_NUMBER = "393519788531"

const collections = [
    {
        title: "Biglietteria Etnica",
        subtitle: "Voli speciali per il Sud America",
        image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767365109/MachuPicchuFoto2da-min_vx4lgx.jpg",
        message: "Ciao GiBravo! Vorrei maggiori informazioni sui voli speciali per il Sud America.",
        className: "col-span-12 md:col-span-8 lg:col-span-6 row-span-1"
    },
    {
        title: "Ponti 2026",
        subtitle: "Scopri quali saranno",
        image: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1776&auto=format&fit=crop",
        message: "Ciao! Ho visto la collection dei Ponti 2026, mi invieresti qualche proposta?",
        className: "col-span-12 md:col-span-4 lg:col-span-3 row-span-1 md:row-span-2"
    },
    {
        title: "Aurora boreale",
        subtitle: "Vivi la magia del Nord",
        image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop",
        message: "Ciao! Sono interessato a vivere la magia del Nord. Info per l'Aurora Boreale?",
        className: "col-span-12 md:col-span-6 lg:col-span-3 row-span-1"
    },
    {
        title: "Sci e snowboard",
        subtitle: "Nuove amicizie sulla neve",
        image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070&auto=format&fit=crop",
        message: "Ciao GiBravo! Vorrei informazioni sulle settimane bianche sci e snowboard.",
        className: "col-span-12 md:col-span-6 lg:col-span-3 row-span-1"
    },
    {
        title: "A meno di 1000€",
        subtitle: "Per ogni budget, mille avventure!",
        image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop",
        message: "Ciao! Vorrei scoprire i viaggi avventura con budget sotto i 1000€.",
        className: "col-span-12 md:col-span-6 lg:col-span-3 row-span-1"
    },
    {
        title: "Estate 2026",
        subtitle: "Pianifica la tua prossima avventura",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop",
        message: "Ciao! Vorrei iniziare a pianificare la mia avventura per l'Estate 2026.",
        className: "col-span-12 md:col-span-6 lg:col-span-3 row-span-1"
    }
]

export function CollectionsGrid() {
    return (
        <section className="py-16 bg-white">
            <div className="container px-4 mx-auto max-w-6xl">
                <h2 className="section-title mb-8">
                    Abbiamo di tutto per te viaggiatore
                </h2>

                <div className="grid grid-cols-12 gap-4 auto-rows-[240px]">
                    {collections.map((item, index) => {
                        const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(item.message)}`

                        return (
                            <Link
                                key={index}
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`relative group overflow-hidden rounded-xl ${item.className}`}
                            >
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                <div className="absolute bottom-0 left-0 p-6 w-full flex justify-between items-end">
                                    <div className="text-white">
                                        <h3 className="text-2xl font-[700] mb-1 leading-tight">{item.title}</h3>
                                        <p className="text-sm font-medium opacity-90">{item.subtitle}</p>
                                    </div>
                                    <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-[#FE8008] group-hover:scale-110 transition-all duration-300">
                                        <ChevronRight className="text-white h-6 w-6" />
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
