"use client"

import Image from 'next/image'



interface TourOverviewProps {
    description: string | null
    gallery?: string[]
}

export function TourOverview({ description, gallery = [] }: TourOverviewProps) {
    return (
        <div id="panoramica" className="scroll-mt-32">
            {/* Header - Aligned with other sections (No padding, No Icon) */}
            <h2 className="text-xl font-black text-[#004BA5] mb-8 flex items-center gap-3 uppercase tracking-tight">
                Panoramica
            </h2>



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
                            <Image
                                src={img}
                                alt={`Galleria Panoramica ${index + 1}`}
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
