"use client"

import React from "react"
import { ShieldCheck, Plane, Wallet } from "lucide-react"
import Image from "next/image"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

const features = [
    {
        title: "Viaggiare Sicuri",
        description: "Tutti i nostri tour includono un'assicurazione di base che copre spese mediche, assistenza e rientro anticipato.",
        icon: ShieldCheck,
        color: "bg-[#003ea3]"
    },
    {
        title: "Pacchetti Vacanze",
        description: "Voli in tutto il mondo, hotel selezionati e l'assistenza più completa per la migliore esperienza turistica.",
        icon: Plane,
        color: "bg-[#FF7000]" // Brand Orange for contrast
    },
    {
        title: "Prezzi Garantiti",
        description: "Nessun costo nascosto. I nostri prezzi sono trasparenti e garantiti: niente tasse a sorpresa o adeguamenti carburante.",
        icon: Wallet,
        color: "bg-[#003ea3]"
    }
]

export function Features() {
    return (
        <section className="py-16 bg-slate-100 overflow-hidden">
            <div className="container px-4 mx-auto max-w-5xl">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Content (Desktop) / Top (Mobile) */}
                    <div className="flex flex-col space-y-10 order-1 lg:order-1">
                        <RevealOnScroll>
                            <h2 className="section-title text-left mb-4">
                                Perché scegliere GiBravo?
                            </h2>
                            <p className="section-subtitle text-left max-w-lg">
                                Tutto ciò che cerchi in un unico posto per un&apos;esperienza senza pensieri.
                            </p>
                        </RevealOnScroll>

                        <div className="space-y-8">
                            {features.map((feature, index) => (
                                <RevealOnScroll key={index} delay={index * 100}>
                                    <div className="flex items-start gap-6 group">

                                        {/* Icon Bubble */}
                                        <div className={`relative flex-shrink-0 h-14 w-14 rounded-lg ${feature.color} flex items-center justify-center shadow-lg shadow-blue-900/5 group-hover:scale-110 transition-transform duration-300`}>
                                            <feature.icon className="h-7 w-7 text-white" strokeWidth={2} />
                                        </div>

                                        <div className="pt-1">
                                            <h3 className="text-xl font-bold text-[#323232] mb-2 tracking-tight group-hover:text-[#003ea3] transition-colors duration-300">
                                                {feature.title}
                                            </h3>
                                            <p className="text-slate-600 leading-relaxed text-[16px]">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </RevealOnScroll>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Inspirational Image (Desktop) / Bottom (Mobile) */}
                    <RevealOnScroll className="relative h-[400px] lg:h-[600px] w-full rounded-lg overflow-hidden shadow-2xl shadow-blue-900/10 order-2 lg:order-2">
                        <Image
                            src="/imghome.webp"
                            alt="Viaggia con GiBravo"
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                        />
                        {/* Subtle Overlay gradient for depth */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </RevealOnScroll>

                </div>
            </div>
        </section>
    )
}
