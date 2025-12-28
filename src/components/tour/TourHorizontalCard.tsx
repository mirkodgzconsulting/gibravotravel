"use client"

import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, User, ArrowRight } from "lucide-react"
import { cn } from "@/lib/website/utils"

interface TourHorizontalCardProps {
    id: string
    slug: string
    title: string
    image: string
    date: Date | null
    duration: string
    price: number
    coordinator?: {
        name: string
        photo: string | null
    } | null
    tags?: string[]
}

export function TourHorizontalCard({
    id,
    slug,
    title,
    image,
    date,
    duration,
    price,
    coordinator,
    tags
}: TourHorizontalCardProps) {
    const tourDate = date ? new Date(date) : null
    const day = tourDate ? tourDate.getDate() : ""
    const month = tourDate ? tourDate.toLocaleString('it-IT', { month: 'short' }).toUpperCase() : "" // DIC
    const year = tourDate ? tourDate.getFullYear() : ""
    const fullDate = tourDate ? tourDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : "Prossimamente"

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row group">
            {/* Image Section (Left) */}
            <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0 bg-gray-200">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Date Overlay */}
                {date && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="text-white text-center drop-shadow-md">
                            <span className="block text-5xl font-black leading-none">{day}</span>
                            <span className="block text-xl font-bold uppercase tracking-widest">{month}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">

                {/* Middle Info */}
                <div className="flex-1 space-y-4">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-tight group-hover:text-brand-600 transition-colors">
                        {title}
                    </h3>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-brand-500" />
                            <span className="font-medium capitalize">{fullDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-brand-500" />
                            <span className="font-medium">{duration}</span>
                        </div>
                    </div>

                    {/* Coordinator & Tags Line */}
                    <div className="flex items-center gap-4 pt-1">
                        {coordinator && (
                            <div className="flex items-center gap-2 bg-gray-50 pr-3 py-1 rounded-full border border-gray-100">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white shadow-sm">
                                    {coordinator.photo ? (
                                        <Image src={coordinator.photo} alt={coordinator.name} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-brand-200 flex items-center justify-center text-xs">👤</div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold leading-none">Coordinatore</span>
                                    <span className="text-xs font-bold text-gray-700 leading-none">{coordinator.name}</span>
                                </div>
                            </div>
                        )}

                        {/* Mock Age Tag logic or real tags */}
                        {tags && tags.length > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded uppercase">
                                {tags[0]}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Action (Price & Button) */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pl-0 md:pl-6 md:border-l border-gray-100">
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1 hidden md:block">A partire da</p>
                        <p className="text-2xl font-black text-gray-900">
                            {price > 0 ? `€ ${price}` : 'Info'}
                        </p>
                    </div>

                    <Link
                        href={`/tour/${slug || id}`}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        Scopri
                    </Link>
                </div>

            </div>
        </div>
    )
}
