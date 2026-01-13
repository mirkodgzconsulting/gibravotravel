"use client"

import { useState } from "react"
import { HelpCircle, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/website/utils"

interface TourFAQProps {
    faq: { question: string; answer: string }[]
}

export function TourFAQ({ faq }: TourFAQProps) {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    if (!faq || faq.length === 0) return null

    return (
        <div className="space-y-6 pt-8 border-t border-gray-200" id="faq">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-brand-500" />
                Domande Frequenti
            </h2>
            <div className="grid gap-3">
                {faq.map((item, i) => {
                    const isOpen = openIndex === i
                    return (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md">
                            <button
                                onClick={() => toggle(i)}
                                className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
                            >
                                <h3 className="font-bold text-gray-900 flex items-center gap-3">
                                    <span className="text-brand-500 font-black text-lg">Q.</span>
                                    {item.question}
                                </h3>
                                {isOpen ? <Minus className="w-5 h-5 text-brand-500" /> : <Plus className="w-5 h-5 text-gray-400" />}
                            </button>

                            <div className={cn(
                                "transition-all duration-300 ease-in-out border-t border-gray-100 bg-gray-50/50",
                                isOpen ? "max-h-[500px] opacity-100 p-5" : "max-h-0 opacity-0 overflow-hidden"
                            )}>
                                <div
                                    className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: item.answer || '' }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
