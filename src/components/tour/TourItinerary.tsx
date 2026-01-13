"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"
import { cn } from "@/lib/website/utils"

interface FooterItineraryProps {
    itinerary: { title: string; description: string }[]
}

export function TourItinerary({ itinerary }: FooterItineraryProps) {
    // Open first day by default
    const [openDays, setOpenDays] = useState<number[]>([])

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
            <div className="space-y-4">
                {itinerary.map((day, i) => {
                    const isOpen = openDays.includes(i)
                    return (
                        <div key={i} className="overflow-hidden">
                            {/* Header / Pill */}
                            <div
                                onClick={() => toggleDay(i)}
                                className={cn(
                                    "cursor-pointer flex items-center gap-4 md:gap-6 px-5 md:px-8 py-4 md:py-5 rounded-2xl transition-all duration-200 group select-none",
                                    isOpen
                                        ? "bg-[#004BA5] text-white shadow-lg shadow-blue-900/10"
                                        : "bg-[#F7F9FB] hover:bg-slate-100 text-[#323232]"
                                )}
                            >
                                {/* Icon */}
                                <div className="flex-shrink-0">
                                    {isOpen ? (
                                        <Minus className="w-5 h-5 font-bold" />
                                    ) : (
                                        <Plus className="w-5 h-5 font-bold text-gray-400 group-hover:text-gray-600" />
                                    )}
                                </div>

                                {/* Text */}
                                <div className="text-base md:text-lg font-medium leading-tight">
                                    <span className={cn("block md:inline font-black mr-3 uppercase tracking-wide text-sm md:text-base mb-1 md:mb-0", isOpen ? "text-white" : "text-[#FE8008]")}>
                                        Giorno {i + 1}
                                    </span>
                                    <span className={isOpen ? "text-blue-50" : "text-gray-700"}>
                                        {day.title}
                                    </span>
                                </div>
                            </div>

                            {/* Body */}
                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out pl-6 md:pl-20 pr-4 md:pr-8",
                                    isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <div className="py-6">
                                    <div
                                        className="text-gray-600 leading-relaxed text-base prose max-w-none"
                                        dangerouslySetInnerHTML={{ __html: day.description || '' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
