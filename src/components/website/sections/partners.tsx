"use client"

import Image from "next/image"
import { ChevronRight } from "lucide-react"

// Logos - Using placeholders or text if SVGs not available. 
// For now, I will use text or simple placeholders for logos to avoid broken images.
// Or I can use simple text.
// Ideally, I would use SVGs.
// I will try to use reliable placeholders or just styled text for the demo.

const press = [
    {
        quote: "10 Location Luxury nel mondo: quando l'alloggio impreziosisce il viaggio e il GiBravo diventa un itinerario Collection",
        source: "STYLE MAGAZINE"
    },
    {
        quote: "Carola Ludovica Farci, globetrotter e Coordinatrice GiBravo che viaggia per trasformare la plastica in alberi",
        source: "HUFFPOST"
    },
    {
        quote: "Svezia \"on the road\", da Stoccolma a Luleå a caccia dell'aurora boreale: l'itinerario perfecto coi consigli di GiBravo",
        source: "SKY TG24"
    }
]

export function Partners() {
    return (
        <section className="py-20 bg-[#111111] text-white border-t border-white/10">
            <div className="container px-4 mx-auto max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-[900] tracking-tight mb-2">Partner</h2>
                    <p className="text-white/60 font-medium">Scopri i nostri partner</p>
                </div>

                {/* Logos Row - Using Text/Placeholders for robustness */}
                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-70 mb-24 grayscale">
                    {/* Emirates */}
                    <h3 className="text-2xl font-serif text-white">Emirates</h3>
                    {/* Scalapay */}
                    <h3 className="text-2xl font-sans font-bold text-white flex items-center gap-1">
                        <span className="text-[#FE8008]">❤</span> scalapay
                    </h3>
                    {/* ITA */}
                    <h3 className="text-2xl font-sans font-black tracking-widest text-white italic">ITA<span className="text-sm font-normal not-italic block tracking-normal">AIRWAYS</span></h3>
                    {/* Hawaiian Tropic */}
                    <h3 className="text-xl font-serif italic text-white">Hawaiian Tropic</h3>
                    {/* Tropicfeel */}
                    <h3 className="text-xl font-sans font-bold text-white">Tropicfeel</h3>
                </div>

                {/* Press Quotes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                    {press.map((item, index) => (
                        <div key={index} className="flex flex-col items-center text-center">
                            <span className="text-4xl text-[#FE8008] font-serif leading-none mb-4">“</span>
                            <p className="text-lg font-[700] leading-snug mb-6 min-h-[100px] flex items-center justify-center">
                                {item.quote}
                            </p>
                            <p className="font-[900] uppercase tracking-wider text-sm text-white/50">{item.source}</p>
                        </div>
                    ))}

                    {/* Floating Arrow button */}
                    <div className="absolute top-1/2 -right-4 md:-right-12 transform -translate-y-1/2">
                        <button className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                            <ChevronRight className="text-black h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
