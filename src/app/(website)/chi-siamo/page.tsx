"use client"

import Image from "next/image"
import { Users, Target, Heart, Globe, Award, Zap, ChevronRight } from "lucide-react"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import { cn } from "@/lib/website/utils"

export default function ChiSiamoPage() {
    // TIP FOR USER: Replace these URLs with your Cloudinary links
    const teamMembers = [
        {
            name: "Katia Flores",
            role: "Biglietteria",
            category: "Ticketing & Reservas",
            image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767368768/katiaflores_mnw0fg.webp",
        },
        {
            name: "Anthony Miranda",
            role: "Biglietteria",
            category: "Ticketing & Reservas",
            image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767368767/anthonymiranda_mqutfm.webp",
        },
        {
            name: "Marco Rivolta",
            role: "Marketing & Pubblicità",
            category: "Digital & Brand Growth",
            image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767368767/marcorivolta_vhptdy.webp",
        }
    ]

    const values = [
        { title: "Vicinanza Culturale", text: "Comprendiamo le esigenze della comunità latina perché ne facciamo parte.", icon: Heart },
        { title: "Professionalità", text: "Oltre 10 anni di esperienza nella biglietteria aerea e nell'organizzazione di viaggi.", icon: Award },
        { title: "Passione per il viaggio", text: "Creiamo itinerari pensati per godere, scoprire e vivere la cultura e la gastronomia locale.", icon: Globe },
        { title: "Impegno", text: "Ci sforziamo di offrire sempre le migliori tariffe, rotte ed esperienze.", icon: Target },
        { title: "Lavoro di squadra", text: "Il nostro team multidisciplinare lavora insieme per fornire un servizio completo e di qualità.", icon: Users },
        { title: "Innovazione", text: "Puntiamo su idee fresche, digitali e moderne come agenzia internazionale.", icon: Zap },
    ]

    return (
        <main className="min-h-screen bg-white">
            {/* 1. HERO SECTION - Premium Split Design */}
            <section className="relative h-[60vh] min-h-[500px] w-full flex items-center overflow-hidden bg-black">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://res.cloudinary.com/dskliu1ig/image/upload/v1767388612/SLIDER-1_myor0u.webp"
                        alt="Chi Siamo Hero"
                        fill
                        className="object-cover opacity-80"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                </div>

                <div className="container mx-auto px-4 z-20 relative pt-32">
                    <RevealOnScroll>
                        <div className="max-w-3xl">

                            <h1 className="text-5xl md:text-7xl font-[700] text-white tracking-tighter leading-[1.1] mb-8">
                                Connettiamo <br />
                                <span className="text-[#FE8008]">Culture e Persone</span>
                            </h1>
                            <p className="text-xl text-white/90 font-medium leading-relaxed max-w-2xl">
                                Siamo un team giovane, dinamico e altamente professionale specializzato nell'organizzazione di viaggi che lasciano il segno.
                            </p>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 2. INTRO SECTION - Minimalist & Elegant */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <RevealOnScroll>
                            <div className="space-y-6">
                                <h2 className="section-title">
                                    Chi è <span className="text-[#004BA5]">GiBravo Travel?</span>
                                </h2>
                                <div className="space-y-4 body-text text-lg">
                                    <p>
                                        Siamo un'agenzia di viaggi con sede a Milano, formata da un team giovane, dinamico e altamente professionale. Siamo specializzati nell'organizzazione di viaggi di gruppo in Europa, offrendo biglietti aerei con tariffe etniche e pacchetti personalizzati.
                                    </p>
                                    <p>
                                        Grazie alla nostra profonda conoscenza del mercato e ai nostri oltre 10 anni di esperienza nel settore aereo, garantiamo ai nostri clienti il servizio che cercano, affidabile e sempre orientato a offrire i migliori prezzi ed esperienze uniche.
                                    </p>
                                    <div className="pt-4">
                                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="h-12 w-12 bg-[#004BA5] rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                                10+
                                            </div>
                                            <div>
                                                <p className="text-sm font-[700] text-[#323232] uppercase tracking-wider">Anni di esperienza</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </RevealOnScroll>

                        <RevealOnScroll delay={200}>
                            <div className="relative aspect-square w-full">
                                <div className="absolute top-0 right-0 w-[60%] h-[60%] rounded-[30px] overflow-hidden shadow-2xl z-20">
                                    <Image
                                        src="https://res.cloudinary.com/dskliu1ig/image/upload/v1767368572/Praga-image1_uj60xx.jpg"
                                        alt="Viaggiatori Praga"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="absolute bottom-0 left-0 w-[80%] h-[80%] rounded-[40px] overflow-hidden shadow-2xl z-30 border-8 border-white">
                                    <Image
                                        src="https://res.cloudinary.com/dskliu1ig/image/upload/v1767368571/Praga-image6_fcmaii.jpg"
                                        alt="Praga Escursione"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#004BA5]/5 rounded-full blur-3xl opacity-50" />
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* 3. TEAM SECTION - The main request */}
            <section className="py-24 bg-slate-50 overflow-hidden">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-16">
                        <RevealOnScroll>
                            <h2 className="section-title mb-2">
                                Il Nostro <span className="text-[#004BA5]">Team</span>
                            </h2>
                            <p className="section-subtitle max-w-2xl mx-auto">
                                Incontra le persone che rendono possibili i tuoi sogni di viaggio
                            </p>
                        </RevealOnScroll>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {teamMembers.map((member, idx) => (
                            <RevealOnScroll key={member.name} delay={idx * 100}>
                                <div className="group bg-white rounded-[32px] p-4 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 w-full">
                                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] mb-6 shadow-inner bg-slate-100">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#004BA5]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Category Badge */}
                                        <div className="absolute top-4 left-4 z-20">
                                            <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-[700] text-[#004BA5] uppercase tracking-widest shadow-sm">
                                                {member.role}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="px-2 pb-2">
                                        <h3 className="text-2xl font-[700] text-[#323232] mb-1 group-hover:text-[#004BA5] transition-colors">{member.name}</h3>
                                        <p className="text-[#FE8008] text-sm font-[700] uppercase tracking-wider">{member.category}</p>
                                    </div>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. MISSION & VISION - Premium Bento Style */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <RevealOnScroll className="h-full">
                            <div className="group relative bg-[#004BA5] p-12 rounded-[40px] overflow-hidden text-white h-full shadow-2xl shadow-blue-900/20">
                                <div className="absolute -top-12 -right-12 h-64 w-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500" />
                                <Target className="h-16 w-16 text-[#FE8008] mb-8 relative z-10" />
                                <h2 className="section-title mb-6 relative z-10 text-white">Missione</h2>
                                <p className="body-text text-white/80 relative z-10">
                                    Goditi esperienze di viaggio uniche e accessibili con tour di gruppo, biglietti aerei a tariffe etniche e pacchetti personalizzati. Connettiamo culture e comunità offrendo un servizio professionale ed esclusivo per godere della cultura, della gastronomia e dell'avventura.
                                </p>
                            </div>
                        </RevealOnScroll>

                        <RevealOnScroll delay={200} className="h-full">
                            <div className="group relative bg-white p-12 rounded-[40px] overflow-hidden border-2 border-slate-50 h-full shadow-xl shadow-slate-200/50">
                                <div className="absolute -bottom-12 -right-12 h-64 w-64 bg-[#FE8008]/5 rounded-full blur-3xl group-hover:bg-[#FE8008]/10 transition-all duration-500" />
                                <Globe className="h-16 w-16 text-[#004BA5] mb-8 relative z-10" />
                                <h2 className="section-title mb-6 relative z-10">Visione</h2>
                                <p className="body-text relative z-10">
                                    Essere l'agenzia di riferimento in Europa, riconosciuta per unire culture attraverso viaggi unici. La nostra visione è continuare a crescere come un marchio internazionale, innovativo e all'avanguardia che supera le aspettativas de sus clientes.
                                </p>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* 5. VALUES GRID */}
            <section className="py-24 bg-[#004BA5] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-10 left-10 h-32 w-32 border-4 border-white rounded-full" />
                    <div className="absolute bottom-20 right-20 h-64 w-64 border-2 border-white rounded-full" />
                </div>

                <div className="container mx-auto px-4 max-w-7xl relative z-10">
                    <div className="text-center mb-16">
                        <RevealOnScroll>
                            <h2 className="section-title text-white mb-4">
                                I Nostri <span className="text-[#FE8008]">Valori</span>
                            </h2>
                            <div className="w-24 h-1.5 bg-[#FE8008] mx-auto rounded-full" />
                        </RevealOnScroll>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.map((value, idx) => {
                            const Icon = value.icon
                            return (
                                <RevealOnScroll key={idx} delay={idx * 50}>
                                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-3xl hover:bg-white/20 transition-all group flex flex-col h-full">
                                        <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#FE8008] transition-all">
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-[700] text-white mb-3 tracking-tight">{value.title}</h3>
                                        <p className="body-text text-white/70">
                                            {value.text}
                                        </p>
                                    </div>
                                </RevealOnScroll>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <RevealOnScroll>
                        <h2 className="section-title leading-tight mb-8">
                            Pronto a partire per la tua <br />
                            <span className="text-[#004BA5]">Prossima Avventura?</span>
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="h-10 bg-[#004BA5] hover:bg-[#FE8008] text-white font-[500] px-8 rounded-2xl shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                                Scopri i Viaggi
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button className="h-10 bg-slate-50 hover:bg-slate-100 text-[#323232] font-[500] px-8 rounded-2xl transition-all border border-slate-200">
                                Contattaci
                            </button>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
        </main>
    )
}
