"use client"

import { Calendar, Clock, Users, Info, MapPin } from "lucide-react"

interface TourOverviewProps {
    date: Date | null
    duration: string | null
    daysCount: number | null
    type: 'aereo' | 'bus'
    description: string | null
}

export function TourOverview({ date, duration, daysCount, type, description }: TourOverviewProps) {
    const formatDate = (d: Date | null) => {
        if (!d) return 'Data da definire';
        return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div id="panoramica" className="scroll-mt-32 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-2">
                <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3 uppercase tracking-tight">
                    <span className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                        <Info className="w-6 h-6" />
                    </span>
                    Panoramica
                </h2>
            </div>

            {/* Stats Grid */}
            <div className="px-6 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4 border-t border-b border-gray-100">
                    {/* Item 1: Date */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Partenza</p>
                            <p className="font-bold text-gray-900 text-lg leading-tight">
                                {formatDate(date)}
                            </p>
                        </div>
                    </div>

                    {/* Item 2: Duration */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Durata</p>
                            <p className="font-bold text-gray-900 text-lg leading-tight">
                                {duration || (daysCount ? `${daysCount} Giorni` : 'N/A')}
                            </p>
                        </div>
                    </div>

                    {/* Item 3: Type */}
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Tipo</p>
                            <p className="font-bold text-gray-900 text-lg leading-tight capitalize">
                                {type === 'aereo' ? 'Volo + Tour' : 'Bus Tour'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description Text */}
            {description && (
                <div className="p-6 pt-4">
                    <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                        {description}
                    </div>
                </div>
            )}
        </div>
    )
}
