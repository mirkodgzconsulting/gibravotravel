"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import { Facebook, Instagram, ArrowRight } from "lucide-react"

const features = [
    {
        title: "Una community",
        description: "Entra nel nostro gruppo Facebook esclusivo! Conosci i tuoi compagni di viaggio prima di partire, scambia consigli e condividi le tue esperienze.",
        image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395511/egipto-home-card_rxa21m.webp",
        socialIcon: Facebook,
        socialLink: "https://www.facebook.com/GiBravoTravelAgenzia",
        socialColor: "bg-[#1877F2] text-white"
    },
    {
        title: "Infiniti viaggi",
        description: "Seguici su Instagram per la tua dose quotidiana di ispirazione. Scopri le destinazioni più incredibili e inizia a sognare la tua prossima meta.",
        image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767368263/chi-siamo-01-section_dqhwgm.webp",
        socialIcon: Instagram,
        socialLink: "https://www.instagram.com/gibravo.travel",
        socialColor: "bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white"
    },
    {
        title: "Massima flessibilità",
        description: "Scopri il lato divertente dei nostri viaggi su TikTok! Video virali, challenge, dietro le quinte e tutto il mood GiBravo.",
        image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767444828/Foto-Destinazioni-Cover-Egitto-QA_n98kvv.webp",
        socialIcon: "tiktok",
        socialLink: "https://www.tiktok.com/@gibravotravel",
        socialColor: "bg-black text-white"
    }
]

export function HowItWorks() {
    return (
        <section className="py-16 bg-white relative overflow-hidden">
            <div className="container px-4 mx-auto max-w-5xl relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <RevealOnScroll>
                        <h2 className="section-title mb-4">Unisciti a noi</h2>
                        <p className="section-subtitle max-w-2xl mx-auto">
                            Unisciti ai nostri social e scopri tutto ciò che abbiamo da offrire
                        </p>
                    </RevealOnScroll>
                </div>

                {/* Content Grid (Stable - No Accordion) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {features.map((feature, index) => (
                        <Link
                            key={index}
                            href={feature.socialLink}
                            target="_blank"
                            className="group relative flex flex-col h-[480px] w-full rounded-lg overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-slate-100"
                        >
                            {/* 1. TOP IMAGE SECTION (55% height) */}
                            <div className="relative h-[55%] w-full overflow-hidden">
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                                />
                                {/* Gradient overlay only at the bottom of image for blending */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                
                                {/* Social Badge Floating Button */}
                                <div className={`absolute bottom-4 right-4 h-10 w-10 rounded-lg flex items-center justify-center shadow-lg text-white ${feature.socialColor} z-10 group-hover:scale-110 transition-transform duration-300`}>
                                     {feature.socialIcon === "tiktok" ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                        </svg>
                                    ) : (

                                        <feature.socialIcon className="h-6 w-6" />
                                    )}
                                </div>
                            </div>

                            {/* 2. BOTTOM CONTENT SECTION (White Background) */}
                            <div className="flex flex-col justify-between flex-1 p-8 bg-white relative">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-[#003ea3] transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600 text-[15px] leading-relaxed line-clamp-3">
                                        {feature.description}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-[#003ea3] font-semibold text-sm pt-4 group-hover:gap-3 transition-all duration-300">
                                    Unisciti ora <ArrowRight className="h-4 w-4" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
