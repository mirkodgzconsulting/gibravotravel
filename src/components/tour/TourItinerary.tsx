"use client"

import { useState } from "react"
import { MapPin, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/website/utils"

interface FooterItineraryProps {
    itinerary: { title: string; description: string }[]
}

export function TourItinerary({ itinerary }: FooterItineraryProps) {
    // Open first day by default
    const [openDays, setOpenDays] = useState<number[]>([0])

    const toggleDay = (index: number) => {
        setOpenDays(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        )
    }

    if (!itinerary || itinerary.length === 0) return null

    return (
        <div id="itinerary" className="scroll-mt-32">
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-gray-100">
                <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
                    <span className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                        <MapPin className="w-6 h-6" />
                    </span>
                    Itinerario Day by Day
                </h2>

                <div className="space-y-4">
                    {itinerary.map((day, i) => {
                        const isOpen = openDays.includes(i)
                        return (
                            <div key={i} className="group border border-gray-200 rounded-xl overflow-hidden transition-all hover:border-brand-200 hover:shadow-md">
                                {/* Header */}
                                <div
                                    onClick={() => toggleDay(i)}
                                    className="cursor-pointer flex items-center bg-white p-4 gap-4"
                                >
                                    {/* Day Bubble */}
                                    <div className={cn(
                                        "flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center rounded-lg font-bold transition-all",
                                        isOpen ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600"
                                    )}>
                                        <span className="text-[10px] uppercase font-bold opacity-70">Giorno</span>
                                        <span className="text-xl leading-none">{i + 1}</span>
                                    </div>

                                    {/* Title */}
                                    <div className="flex-1">
                                        <h3 className={cn(
                                            "font-bold text-lg md:text-xl transition-colors",
                                            isOpen ? "text-brand-900" : "text-gray-700 group-hover:text-brand-700"
                                        )}>
                                            {day.title}
                                        </h3>
                                    </div>

                                    {/* Icon */}
                                    <div className="text-gray-400">
                                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                    </div>
                                </div>

                                {/* Body */}
                                <div
                                    className={cn(
                                        "bg-gray-50 overflow-hidden transition-all duration-300 ease-in-out",
                                        isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                    )}
                                >
                                    <div className="p-5 pt-2 border-t border-gray-100/50">
                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                                            {day.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
