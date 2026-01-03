"use client"

import React from "react"
import Image from "next/image"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

const features = [
    {
        title: "VIAGGIARE SICURI",
        description: "Tutti i nostri tour includono un'assicurazione di base (che copre le spese mediche in caso di infortunio, assistenza e rientro anticipato).",
        image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767378526/viaggi-sicuro-icon01_b73tcy.png"
    },
    {
        title: "PACCHETTI VACANZE",
        description: "Voli in tutto il mondo, molteplici opzioni di pacchetti volo + hotel, l'assistenza di viaggio più completa e la migliore esperienza turistica.",
        image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767378528/paccheti-vacanze-icon02_wqklhc.png"
    },
    {
        title: "PREZZI",
        description: "I prezzi sono molto importanti e i nostri sono garantiti. Non ci saranno supplementi imprevisti (niente tasse, niente carburante, ecc.).",
        image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767378527/prezzi-icon03_carumf.png"
    }
]

export function Features() {
    return (
        <section className="py-20 bg-slate-50/50">
            <div className="container px-4 mx-auto max-w-7xl">
                <div className="text-center mb-16">
                    <RevealOnScroll>
                        <h2 className="section-title mb-2">
                            Perché scegliere GiBravo?
                        </h2>
                        <p className="section-subtitle">
                            Tutto ciò che cerchi in un unico posto
                        </p>
                    </RevealOnScroll>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <RevealOnScroll key={index} delay={index * 100}>
                            <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 h-full flex flex-col items-center text-center group">
                                <div className="relative h-24 w-24 mb-8 transition-transform duration-500 group-hover:scale-110">
                                    <Image
                                        src={feature.image}
                                        alt={feature.title}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <h3 className="text-xl font-[700] text-[#004BA5] mb-4 tracking-wider uppercase">
                                    {feature.title}
                                </h3>
                                <p className="body-text">
                                    {feature.description}
                                </p>
                            </div>
                        </RevealOnScroll>
                    ))}
                </div>
            </div>
        </section>
    )
}
