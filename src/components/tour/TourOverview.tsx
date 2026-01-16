"use client"

import { CalendarDays, Clock, Plane, Bus, Info } from "lucide-react"

interface TourOverviewProps {
    date: Date | null
    duration: string | null
    daysCount: number | null
    type: 'aereo' | 'bus'
    description: string | null
    gallery?: string[]
}

export function TourOverview({ date, duration, daysCount, type, description, gallery = [] }: TourOverviewProps) {
    const formatDate = (d: Date | null) => {
        if (!d) return 'Data da definire';
        return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div id="panoramica" className="scroll-mt-32">
            {/* Header - Aligned with other sections (No padding, No Icon) */}
            <h2 className="text-2xl font-black text-[#004BA5] mb-8 flex items-center gap-3 uppercase tracking-tight">
                Panoramica
            </h2>

            {/* Stats Grid - Cleaner, White "Floating" Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                {/* Item 1: Date */}
                <div className="group flex flex-col justify-center p-3.5 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="p-2 bg-blue-50 text-[#004BA5] rounded-xl group-hover:bg-[#004BA5] group-hover:text-white transition-colors duration-300">
                            <CalendarDays className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partenza</span>
                    </div>
                    <p className="font-extrabold text-[#323232] text-base ml-1">
                        {formatDate(date)}
                    </p>
                </div>

                {/* Item 2: Duration */}
                <div className="group flex flex-col justify-center p-3.5 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Durata</span>
                    </div>
                    <p className="font-extrabold text-[#323232] text-base ml-1">
                        {duration || (daysCount ? `${daysCount} Giorni` : 'N/A')}
                    </p>
                </div>

                {/* Item 3: Type (Simplified to "Tour") */}
                <div className="group flex flex-col justify-center p-3.5 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="p-2 bg-orange-50 text-[#FE8008] rounded-xl group-hover:bg-[#FE8008] group-hover:text-white transition-colors duration-300">
                            {type === 'aereo' ? <Plane className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo</span>
                    </div>
                    <p className="font-extrabold text-[#323232] text-base ml-1">
                        Tour
                    </p>
                </div>
            </div>

            {/* Description Text - No Padding */}
            {description && (
                <div className="prose prose-lg max-w-none leading-relaxed mb-8 rte-content text-gray-600">
                    <div dangerouslySetInnerHTML={{ __html: description || '' }} />
                </div>
            )}

            {/* Visual Mini Gallery - Integrated */}
            {gallery && gallery.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-96 md:h-80 mt-8">
                    {gallery.slice(0, 5).map((img, index) => (
                        <div
                            key={index}
                            className={`relative rounded-2xl overflow-hidden border border-gray-100 group shadow-sm ${index === 0 ? 'col-span-2 row-span-2 h-full' : 'h-full'
                                }`}
                        >
                            <img
                                src={img}
                                alt={`Galleria Panoramica ${index + 1}`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                            />
                            {/* Subtle overlay gradient for depth */}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
