import Image from "next/image"
import Link from "next/link"
import { Calendar, Star, Heart } from "lucide-react"
import { cn } from "@/lib/website/utils"

interface TravelCardProps {
    title: string
    slug: string
    image: string
    price: number
    originalPrice?: number
    days: number
    rating: number
    reviews: number
    tags?: string[]
    theme?: 'light' | 'dark'
    size?: 'default' | 'compact'
}

export function TravelCard({
    title,
    slug,
    image,
    price,
    originalPrice,
    days,
    rating,
    reviews,
    tags,
    theme = 'light',
    size = 'default'
}: TravelCardProps) {
    const isDark = theme === 'dark'
    const isCompact = size === 'compact'

    return (
        <Link href={`/tour/${slug}`} className="group relative flex flex-col w-full h-full bg-transparent overflow-visible">
            {/* Image Container */}
            <div className="relative aspect-[0.9/1] w-full overflow-hidden rounded-[12px]">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Mood Tags - Top Left (Solid Black for "Top Seller" style) */}
                {tags && tags.length > 0 && (
                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
                        {tags.map((tag, i) => (
                            <span key={tag} className={cn(
                                "font-[700] uppercase tracking-wider text-white rounded-md shadow-sm",
                                isCompact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]",
                                i === 0 ? "bg-[#1F1F1F] text-white" : "bg-black/60 backdrop-blur-sm"
                            )}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Heart Icon (Top Right) */}
                <div className="absolute top-3 right-3 z-20">
                    <div className="p-2 rounded-full hover:bg-black/20 transition-colors cursor-pointer">
                        <Heart className={cn("text-white stroke-2", isCompact ? "w-4 h-4" : "w-5 h-5")} />
                    </div>
                </div>

                {/* Days Badge - Bottom Left overlay on image */}
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
                    <span className={cn("font-[700] text-white drop-shadow-md", isCompact ? "text-[12px]" : "text-[14px]")}>{days} GIORNI</span>

                    {/* Rating inside badge for compact view, similar to screenshot if needed, or consistent */}
                    <div className={cn("flex items-center gap-1", isCompact ? "bg-black/10 backdrop-blur-[2px] px-1 rounded" : "")}>
                        <span className={cn("text-white drop-shadow-md font-[700]", isCompact ? "text-[12px]" : "text-[14px]")}>•</span>
                        <span className={cn("font-[700] text-white drop-shadow-md", isCompact ? "text-[12px]" : "text-[14px]")}>{rating}</span>
                        <Star className="w-3 h-3 fill-white text-white drop-shadow-md" />
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="pt-2 flex flex-col gap-0.5">
                <div className="flex items-start justify-between min-h-[40px]">
                    <h3 className={cn(
                        "font-[700] leading-tight transition-colors line-clamp-2 w-full",
                        isCompact ? "text-[15px]" : "text-[17px]",
                        // HTML snippet says text-base font-bold, which is usually 16px. 15px is safer for 2 lines.
                        isDark ? "text-white group-hover:text-white/80" : "text-[#323232] group-hover:text-[#FE8008]"
                    )}>
                        {title}
                    </h3>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                        "font-[700] uppercase",
                        isCompact ? "text-[13px]" : "text-[12px]", // HTML snippet shows "Da" quite visible
                        isDark ? "text-white/80" : "text-gray-500"
                    )}>Da</span>

                    <div className="flex items-baseline gap-1.5">
                        {/* Price first or Original Price first? HTML snippet: Da <price> <original> */}
                        {/* HTML: <span class="base-price">489 €</span> <span class="line-through">549 €</span> */}

                        <span className={cn(
                            "font-[700]",
                            isCompact ? "text-[16px]" : "text-[18px]",
                            originalPrice ? (isDark ? "text-white" : "text-[#FE8008]") : (isDark ? "text-[#004BA5]" : "text-[#004BA5]")
                        )}>
                            {price.toLocaleString('it-IT')} €
                        </span>

                        {originalPrice && (
                            <>
                                <span className={cn(
                                    "font-[700] line-through decoration-white/60",
                                    isCompact ? "text-[13px]" : "text-[14px]",
                                    isDark ? "text-white/60" : "text-gray-500"
                                )}>
                                    {originalPrice.toLocaleString('it-IT')} €
                                </span>
                                {originalPrice > price && (
                                    <span className={cn(
                                        "font-[700] px-1 py-0.5 rounded ml-0.5",
                                        isCompact ? "text-[10px]" : "text-[11px]",
                                        isDark ? "bg-white text-black" : "bg-[#E6F4F1] text-[#004BA5]"
                                        // HTML snippet shows -16% in a badge. 
                                        // Screenshot shows white badge with black text or similar high contrast?
                                        // User screenshot shows white badge " -15%"
                                    )}>
                                        -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
