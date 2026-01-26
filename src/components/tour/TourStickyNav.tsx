"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/website/utils"

export function TourStickyNav() {
    const [activeSection, setActiveSection] = useState<string>('panoramica');

    useEffect(() => {
        const handleScroll = () => {
            const sections = ['panoramica', 'itinerario', 'incluso', 'coordinatore', 'faq'];

            // Find the section that is currently most visible in the viewport
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // If element top is near the top of viewport (considering offset), or active
                    // Using a simple range check:
                    if (rect.top >= 0 && rect.top <= 300) {
                        setActiveSection(section);
                        break;
                    } else if (rect.top < 0 && rect.bottom > 150) {
                        // Element overlaps the top viewing area significantly
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Simple smooth scroll handler
    const scrollToSection = (id: string) => {
        setActiveSection(id); // Optimistic update
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

    const navItems = [
        { id: 'panoramica', label: 'Panoramica' },
        { id: 'itinerario', label: 'Itinerario' },
        { id: 'incluso', label: 'Cosa è incluso' },
        { id: 'coordinatore', label: 'Coordinatore' },
        { id: 'faq', label: 'FAQ' },
    ];

    return (
        <div className="relative z-30 bg-white shadow-sm">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                <div className="flex items-center gap-8 overflow-x-auto no-scrollbar font-bold text-gray-400 text-sm uppercase tracking-wider whitespace-nowrap">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={cn(
                                "py-4 border-b-2 transition-all duration-300",
                                activeSection === item.id
                                    ? "text-[#323232] border-[#FE8008]"
                                    : "border-transparent hover:text-gray-600"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
