"use client"

import React from "react"
import Image from "next/image"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import Link from "next/link"
import { MapPin, MousePointerClick, Plane } from "lucide-react"

export default function ComeFunzionaPage() {
    return (
        <main className="min-h-screen bg-white pb-24">

            {/* 1. HERO SECTION */}
            <section className="relative h-[60vh] min-h-[500px] w-full flex items-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero2_xx72si.jpg"
                        alt="Come Funziona Hero"
                        fill
                        className="object-cover opacity-70"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                </div>

                <div className="container mx-auto px-4 z-20 relative">
                    <RevealOnScroll>
                        <div className="max-w-3xl">
                            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-[1.1] mb-6">
                                Come <span className="text-[#FE8008]">Funziona?</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed max-w-2xl">
                                Scopri quanto è semplice unirti ai nostri viaggi e vivere un'esperienza indimenticabile.
                            </p>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 2. INTRO TEXT */}
            <section className="py-20 md:py-28">
                <div className="container mx-auto px-4 text-center max-w-4xl">
                    <RevealOnScroll>
                        <h2 className="section-title mb-6 text-4xl md:text-5xl">
                            Viaggiare con noi è molto semplice, <br className="hidden md:block" />
                            bastano solo 3 passi
                        </h2>
                        <p className="section-subtitle">
                            Abbiamo semplificato tutto per permetterti di pensare solo a fare la valigia.
                        </p>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 3. STEPS - ZIG ZAG */}
            <section className="pb-32 overflow-hidden">
                <div className="container mx-auto px-4 max-w-7xl space-y-32">

                    {/* STEP 1: SCEGLI (Text Left, Image Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-1 lg:order-1 flex flex-col items-start gap-6">
                            <RevealOnScroll>
                                <div className="inline-flex items-center gap-3 bg-blue-50 px-5 py-2 rounded-full mb-4 border border-blue-100/50">
                                    <span className="flex items-center justify-center w-8 h-8 bg-[#004BA5] text-white rounded-full font-bold text-sm shadow-lg shadow-blue-900/20">1</span>
                                    <span className="text-[#004BA5] font-bold tracking-wide uppercase text-sm">Destinazione</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-bold text-[#323232] mb-6 leading-tight">
                                    Scegli la tua <br />
                                    <span className="text-[#004BA5]">Destinazione</span>
                                </h3>
                                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                    Esplora il nostro catalogo di viaggi e lasciati ispirare.
                                    Che tu voglia rilassarti su una spiaggia tropicale o avventurarti in una capitale culturale,
                                    abbiamo il viaggio perfetto per te. Filtra per data, budget o tipologia e trova il tuo prossimo sogno.
                                </p>
                                <Link href="/partenze" className="inline-flex items-center gap-2 bg-[#004BA5] text-white px-8 py-4 rounded-full font-bold hover:bg-[#003da5] transition-all hover:scale-105 shadow-xl shadow-blue-900/10">
                                    <MapPin className="w-5 h-5" />
                                    Esplora i Viaggi
                                </Link>
                            </RevealOnScroll>
                        </div>
                        <div className="order-2 lg:order-2">
                            <RevealOnScroll delay={200} className="relative h-[500px] w-full rounded-[1.25rem] overflow-hidden shadow-2xl shadow-blue-900/10 rotate-1 hover:rotate-0 transition-transform duration-700">
                                <Image
                                    src="https://res.cloudinary.com/dskliu1ig/image/upload/v1768263479/comefunziona1_mnxy8q.jpg"
                                    alt="Scegli la destinazione"
                                    fill
                                    className="object-cover hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                            </RevealOnScroll>
                        </div>
                    </div>

                    {/* STEP 2: PRENOTA (Image Left, Text Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <RevealOnScroll delay={200} className="relative h-[500px] w-full rounded-[1.25rem] overflow-hidden shadow-2xl shadow-orange-500/10 -rotate-1 hover:rotate-0 transition-transform duration-700">
                                <Image
                                    src="https://res.cloudinary.com/dskliu1ig/image/upload/v1768263478/comefunziona2_lqfgg4.png"
                                    alt="Prenota il viaggio"
                                    fill
                                    className="object-cover hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                            </RevealOnScroll>
                        </div>
                        <div className="order-1 lg:order-2 flex flex-col items-start gap-6">
                            <RevealOnScroll>
                                <div className="inline-flex items-center gap-3 bg-orange-50 px-5 py-2 rounded-full mb-4 border border-orange-100/50">
                                    <span className="flex items-center justify-center w-8 h-8 bg-[#FB6514] text-white rounded-full font-bold text-sm shadow-lg shadow-orange-500/20">2</span>
                                    <span className="text-[#FB6514] font-bold tracking-wide uppercase text-sm">Prenotazione</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-bold text-[#323232] mb-6 leading-tight">
                                    Prenotala <br />
                                    <span className="text-[#FB6514]">Online</span>
                                </h3>
                                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                    Una volta scelto il tour, blocca il tuo posto con un semplice acconto.
                                    Il nostro sistema è sicuro e veloce. Dopo la prenotazione, riceverai tutte le informazioni
                                    necessarie e verrai aggiunto al gruppo WhatsApp con i tuoi futuri compagni di viaggio.
                                </p>
                                <Link href="/contatti" className="inline-flex items-center gap-2 bg-[#FB6514] text-white px-8 py-4 rounded-full font-bold hover:bg-[#e05a0f] transition-all hover:scale-105 shadow-xl shadow-orange-500/10">
                                    <MousePointerClick className="w-5 h-5" />
                                    Hai domande?
                                </Link>
                            </RevealOnScroll>
                        </div>
                    </div>

                    {/* STEP 3: VIAGGIA (Text Left, Image Right) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="order-1 lg:order-1 flex flex-col items-start gap-6">
                            <RevealOnScroll>
                                <div className="inline-flex items-center gap-3 bg-blue-50 px-5 py-2 rounded-full mb-4 border border-blue-100/50">
                                    <span className="flex items-center justify-center w-8 h-8 bg-[#004BA5] text-white rounded-full font-bold text-sm shadow-lg shadow-blue-900/20">3</span>
                                    <span className="text-[#004BA5] font-bold tracking-wide uppercase text-sm">Partenza</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-bold text-[#323232] mb-6 leading-tight">
                                    Prepara la valigia e <br />
                                    <span className="text-[#004BA5]">Viaggia</span>
                                </h3>
                                <p className="text-lg text-slate-600 leading-relaxed mb-8">
                                    Tutto è pronto! Incontra il gruppo in aeroporto o a destinazione e goditi l'avventura.
                                    I nostri coordinatori si occuperanno della logistica, tu devi solo pensare a divertirti,
                                    scattare foto e creare ricordi indimenticabili con i nuovi amici.
                                </p>
                                <Link href="/partenze" className="inline-flex items-center gap-2 bg-[#004BA5] text-white px-8 py-4 rounded-full font-bold hover:bg-[#003da5] transition-all hover:scale-105 shadow-xl shadow-blue-900/10">
                                    <Plane className="w-5 h-5" />
                                    Partiamo Insieme
                                </Link>
                            </RevealOnScroll>
                        </div>
                        <div className="order-2 lg:order-2">
                            <RevealOnScroll delay={200} className="relative h-[500px] w-full rounded-[1.25rem] overflow-hidden shadow-2xl shadow-blue-900/10 rotate-1 hover:rotate-0 transition-transform duration-700">
                                <Image
                                    src="https://res.cloudinary.com/dskliu1ig/image/upload/v1768263478/comefunziona3_hvb8qk.png"
                                    alt="Viaggia con il gruppo"
                                    fill
                                    className="object-cover hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                            </RevealOnScroll>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    )
}
