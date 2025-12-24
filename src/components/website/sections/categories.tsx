"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"

const categories = [
    {
        title: "Aurora Boreale",
        image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&q=80&w=600",
        href: "/aurora-boreale"
    },
    {
        title: "Natura e Trekking",
        image: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=600",
        href: "/natura"
    },
    {
        title: "Mare e Relax",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
        href: "/mare"
    },
    {
        title: "Città d'Arte",
        image: "https://images.unsplash.com/photo-1499856871940-a09627c6dcf6?auto=format&fit=crop&q=80&w=600",
        href: "/citta"
    },
    {
        title: "Party & Nightlife",
        image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=600",
        href: "/party"
    },
    {
        title: "Viaggi di Nozze",
        image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=600",
        href: "/honeymoon"
    }
]

export function Categories() {
    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                <h2 className="mb-8 text-2xl font-[900] tracking-tight text-slate-900 md:text-3xl">
                    Lasciati ispirare
                </h2>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {categories.map((category) => (
                        <Link
                            key={category.title}
                            href={category.href}
                            className="group relative h-40 w-full overflow-hidden rounded-xl cursor-pointer"
                        >
                            <Image
                                src={category.image}
                                alt={category.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                                <span className="text-base font-[800] text-white drop-shadow-md leading-tight">
                                    {category.title}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
