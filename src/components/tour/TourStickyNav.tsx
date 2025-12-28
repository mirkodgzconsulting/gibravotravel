"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/website/utils"

export function TourStickyNav() {
    // Simple smooth scroll handler
    const scrollToSection = (id: string) => {
        const el = document.getElementById(id)
        if (el) {
            // Offset for the sticky header (58px) + sticky nav (~60px) + content padding
            const offset = 140
            const bodyRect = document.body.getBoundingClientRect().top
            const elementRect = el.getBoundingClientRect().top
            const elementPosition = elementRect - bodyRect
            const offsetPosition = elementPosition - offset

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            })
        }
    }

    return (
        <div className="sticky top-[58px] z-40 bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-4 font-bold text-gray-500 text-sm uppercase tracking-wider whitespace-nowrap">
                    <button
                        onClick={() => scrollToSection('panoramica')}
                        className="hover:text-brand-600 transition-colors"
                    >
                        Panoramica
                    </button>
                    <button
                        onClick={() => scrollToSection('itinerario')}
                        className="hover:text-brand-600 transition-colors"
                    >
                        Itinerario
                    </button>
                    <button
                        onClick={() => scrollToSection('incluso')}
                        className="hover:text-brand-600 transition-colors"
                    >
                        Cosa è incluso
                    </button>
                    <button
                        onClick={() => scrollToSection('coordinatore')}
                        className="hover:text-brand-600 transition-colors"
                    >
                        Coordinatore
                    </button>
                    <button
                        onClick={() => scrollToSection('faq')}
                        className="hover:text-brand-600 transition-colors"
                    >
                        FAQ
                    </button>
                </div>
            </div>
        </div>
    )
}
