"use client"

import { Button } from "@/components/website/ui/button"
import { TravelCard } from "@/components/website/ui/travel-card"
import { Search } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/context/website/language-context"

import { CollectionsGrid } from "@/components/website/sections/collections-grid"
import { HowItWorks } from "@/components/website/sections/how-it-works"
import { VideoStories } from "@/components/website/sections/video-stories"
import { Partners } from "@/components/website/sections/partners"

export default function Home() {
    const { t } = useLanguage()

    const featuredTrips = [
        {
            title: "Cuba 360°: da l'Avana a Trinidad, tra sigari, salsa e spiagge",
            slug: "cuba-360",
            image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop",
            price: 1999,
            days: 12,
            rating: 4.8,
            reviews: 124,
            tags: ["Top Seller"]
        },
        {
            title: "Giappone 360°: alla scoperta di Tokyo, Kyoto, Hiroshima e...",
            slug: "giappone-360",
            image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format&fit=crop",
            price: 2499,
            originalPrice: 2699,
            days: 14,
            rating: 4.9,
            reviews: 215,
            tags: ["Top Seller"]
        },
        {
            title: "Islanda: a caccia dell'Aurora Boreale",
            slug: "islanda-aurora",
            image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop",
            price: 1499,
            days: 8,
            rating: 4.7,
            reviews: 89,
            tags: ["Last Minute"]
        },
        {
            title: "Perù 360°: Machu Picchu, Montagna Arcobaleno e il lago...",
            slug: "peru-360",
            image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=2076&auto=format&fit=crop",
            price: 2199,
            days: 13,
            rating: 4.8,
            reviews: 156,
            tags: ["Adventure"]
        },
        {
            title: "Thailandia Express: Bangkok e il Nord in 10 giorni",
            slug: "thailandia-express",
            image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2039&auto=format&fit=crop",
            price: 1399,
            days: 10,
            rating: 4.6,
            reviews: 45,
            tags: ["Nature"]
        },
        {
            title: "Marocco Express: Città Imperiali e deserto",
            slug: "marocco-express",
            image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=2070&auto=format&fit=crop",
            price: 899,
            days: 8,
            rating: 4.7,
            reviews: 112,
            tags: ["Culture"]
        }
    ]

    // UPDATED: Last Minute Trips with precise data from WeRoad snippet
    const lastMinuteTrips = [
        {
            title: "Islanda Express: un assaggio dell’isola del ghiaccio e del fuoco",
            slug: "viaggio-breve-islanda-5-giorni",
            image: "https://cdn.weroad.io/common/images/highlights/jpg/northern-lights.jpg",
            price: 749,
            days: 5,
            rating: 4.8,
            reviews: 92,
            tags: [],
            theme: 'dark'
        },
        {
            title: "Cairo Express: viaggio tra souk, musei e piramidi",
            slug: "cairo-express",
            image: "https://strapi-imaginary.weroad.it/resource/icon/1906/moschea-cupole-minareti-paesaggio-urbano-tramonto.jpg",
            price: 419,
            originalPrice: 499,
            days: 5,
            rating: 4.8,
            reviews: 61,
            tags: ["TOP SELLER"],
            theme: 'dark'
        },
        {
            title: "Istanbul Express: un assaggio di Turchia tra moschee, mercati e quartieri colorati",
            slug: "istanbul-express",
            image: "https://strapi-imaginary.weroad.it/resource/icon/4029/moschea-cupole-minareti-mare-navi.jpg",
            price: 489,
            originalPrice: 549,
            days: 5,
            rating: 4.7,
            reviews: 76,
            tags: ["TOP SELLER"],
            theme: 'dark'
        },
        {
            title: "Lapponia finlandese Express: a caccia dell'aurora boreale",
            slug: "lapponia-finlandese",
            image: "https://strapi-imaginary.weroad.it/resource/icon/62209/aurore-boreali-cielo-notturno-foresta.jpg",
            price: 1269,
            originalPrice: 1499,
            days: 6,
            rating: 4.8,
            reviews: 16,
            tags: ["TOP SELLER"],
            theme: 'dark'
        },
        {
            title: "Scozia Express: Edimburgo e le Highlands da veri local",
            slug: "scozia-express",
            image: "https://strapi-imaginary.weroad.it/resource/icon/75156/mucca-highland-scogliera-mare-blu.jpg",
            price: 799,
            originalPrice: 899,
            days: 5,
            rating: 4.7,
            reviews: 23,
            tags: [],
            theme: 'dark'
        },
        {
            title: "Oman Express",
            slug: "oman-express",
            image: "https://strapi-imaginary.weroad.it/resource/icon/52339/moschea-skyline-lungomare-tramonto-montagne.jpg",
            price: 759,
            originalPrice: 799,
            days: 5,
            rating: 4.8,
            reviews: 13,
            tags: [],
            theme: 'dark'
        }
    ]

    const futureTrips = [
        {
            title: "Giappone 360°: alla scoperta di Tokyo, Kyoto, Hiroshima e...",
            slug: "giappone-360-2026",
            image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format&fit=crop",
            price: 1819,
            days: 11,
            rating: 4.7,
            reviews: 215,
            tags: ["Top Seller"],
            theme: 'dark'
        },
        {
            title: "Sudafrica 360°: da Cape Town al safari nel Parco Nazionale del...",
            slug: "sudafrica-360",
            image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2068&auto=format&fit=crop",
            price: 2149,
            days: 13,
            rating: 4.8,
            reviews: 89,
            tags: [],
            theme: 'dark'
        },
        {
            title: "Perù 360°: Machu Picchu, Montagna Arcobaleno e il lago...",
            slug: "peru-360-2026",
            image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=2076&auto=format&fit=crop",
            price: 1739,
            originalPrice: 2049,
            days: 12,
            rating: 4.8,
            reviews: 156,
            tags: ["Top Seller"],
            theme: 'dark'
        },
        {
            title: "Cina 360°: Pechino, Shanghai e la Grande Muraglia",
            slug: "cina-360-2026",
            image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?q=80&w=2070&auto=format&fit=crop",
            price: 1689,
            originalPrice: 1899,
            days: 12,
            rating: 4.7,
            reviews: 34,
            tags: ["Top Seller"],
            theme: 'dark'
        },
        {
            title: "Messico 360°: Yucatan, Chiapas e rovine Maya",
            slug: "messico-360-2026",
            image: "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?q=80&w=2070&auto=format&fit=crop",
            price: 2299,
            days: 14,
            rating: 4.8,
            reviews: 120,
            tags: ["Adventure"],
            theme: 'dark'
        },
        {
            title: "Vietnam 360°: da Hanoi a Ho Chi Minh City",
            slug: "vietnam-360-2026",
            image: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop",
            price: 1899,
            days: 12,
            rating: 4.9,
            reviews: 98,
            tags: ["Nature"],
            theme: 'dark'
        }
    ]

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section - Exact WeRoad Replication */}
            <section className="relative h-[650px] w-full flex items-center justify-center">
                {/* Background */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://images.unsplash.com/photo-1513581166391-887a96ddeafd?q=80&w=2070&auto=format&fit=crop"
                        alt="Hero Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Darker gradient for text contrast */}
                    <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Content */}
                <div className="relative z-10 container flex flex-col items-center text-center px-4 mt-0 md:mt-[-60px]">
                    <h1 className="text-4xl md:text-[52px] font-[900] tracking-tight text-white leading-[1.1] mb-2 drop-shadow-lg">
                        {t("heroTitle1")}
                    </h1>
                    <h2 className="text-3xl md:text-[52px] font-[900] tracking-tight text-white leading-[1.1] mb-4 drop-shadow-md">
                        {t("heroTitle2")}
                    </h2>
                    <p className="text-lg md:text-xl font-medium text-white/90 mb-12 drop-shadow-sm tracking-wide">
                        {t("heroSubtitle")}
                    </p>
                </div>

                {/* Search Pill Component - Overlapping Bottom Edge */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4">
                    <div className="bg-white rounded-xl p-2 shadow-[0px_8px_30px_rgba(0,0,0,0.12)] flex flex-col md:flex-row items-center h-auto md:h-[80px] gap-2 md:gap-0">

                        {/* Section 1: Destination */}
                        <div className="w-full md:flex-1 flex flex-col justify-center items-start text-left md:border-r border-gray-100 px-6 h-full cursor-pointer hover:bg-gray-50 rounded-xl md:rounded-l-xl md:rounded-r-none group transition-colors py-3 md:py-0">
                            <span className="text-[14px] font-[800] text-gray-400 mb-0.5 group-hover:text-[#FE8008] transition-colors">{t("where")}</span>
                            <span className="text-[18px] font-[800] text-slate-900 truncate w-full">{t("anyDestination")}</span>
                        </div>

                        {/* Section 2: Date */}
                        <div className="w-full md:flex-1 flex flex-col justify-center items-start text-left md:border-r border-gray-100 px-6 h-full cursor-pointer hover:bg-gray-50 group transition-colors py-3 md:py-0">
                            <span className="text-[14px] font-[800] text-gray-400 mb-0.5 group-hover:text-[#FE8008] transition-colors">{t("when")}</span>
                            <span className="text-[18px] font-[800] text-slate-900 truncate w-full">{t("allYear")}</span>
                        </div>

                        {/* Section 3: Search Button */}
                        <div className="w-full md:w-auto p-1 md:px-2">
                            <Button className="w-full md:w-auto rounded-lg h-[60px] md:h-[64px] px-10 bg-[#004BA5] hover:bg-[#FE8008] text-white font-[800] text-[18px] shadow-lg flex items-center gap-2 transition-colors duration-300">
                                <Search className="h-5 w-5 stroke-[3px]" />
                                {t("searchBtn")}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Section */}
            <section className="pt-20 pb-12 bg-slate-50">
                <div className="container px-4">
                    <div className="flex flex-col items-center mb-[30px] text-center">
                        <h2 className="text-3xl font-[900] tracking-tight text-[#323232] mb-2">
                            Scelti per te
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-6xl mx-auto">
                        {featuredTrips.map((trip) => (
                            <TravelCard key={trip.slug} {...trip} size="compact" />
                        ))}
                    </div>
                </div>
            </section>



            {/* NEW: Last Minute Section (Dark Theme with Aurora Background) */}
            <section className="relative pt-8 pb-16 bg-[#0e191a]">
                {/* Background Image with Gradient Fade */}
                <div className="absolute inset-0 z-0 h-[400px] w-full">
                    <Image
                        src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop"
                        alt="Misty Mountains Landscape"
                        fill
                        className="object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0e191a]/80 to-[#0e191a]" />
                </div>

                <div className="relative z-10 container px-4">
                    <div className="flex flex-col items-center mb-[180px] text-center">
                        <h2 className="text-3xl lg:text-4xl font-[900] tracking-tight text-white mb-2 drop-shadow-lg">
                            Viaggetto express last minute
                        </h2>
                        <p className="text-white/90 font-medium text-lg lg:text-xl drop-shadow-md">Per partire entro il 31 gennaio</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-6xl mx-auto">
                        {lastMinuteTrips.map((trip) => (
                            <TravelCard key={trip.slug} {...trip} theme="dark" size="compact" />
                        ))}
                    </div>

                    <div className="flex justify-center mt-12">
                        <Button className="bg-[#004BA5] hover:bg-[#FE8008] text-white font-[800] px-8 py-4 rounded-lg text-lg shadow-lg hover:scale-105 transition-transform">
                            Partiamo!
                        </Button>
                    </div>
                </div>
            </section>

            {/* NEW: 2026 Adventures Section (Dark Theme with Safari Background) */}
            <section className="relative pt-8 pb-16 bg-[#15110E]"> {/* Dark brownish/black color */}
                {/* Background Image with Gradient Fade */}
                <div className="absolute inset-0 z-0 h-[600px] w-full">
                    <Image
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop"
                        alt="Scenic Landscape"
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#15110E]/60 to-[#15110E]" />
                </div>

                <div className="relative z-10 container px-4">
                    <div className="flex flex-col items-center mb-[180px] text-center">
                        <h2 className="text-3xl font-[900] tracking-tight text-[#323232] mb-2 drop-shadow-lg md:text-white">
                            Quali avventure ti aspettano nel 2026?
                        </h2>
                        <p className="text-white/90 font-medium text-lg drop-shadow-md">È il momento di pianificare un nuovo anno di viaggi!</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-6xl mx-auto">
                        {futureTrips.map((trip) => (
                            <TravelCard key={trip.slug} {...trip} theme="dark" size="compact" />
                        ))}
                    </div>

                    <div className="flex justify-center mt-12">
                        <Button className="bg-[#004BA5] hover:bg-[#FE8008] text-white font-[800] px-8 py-6 rounded-lg text-lg hover:scale-105 transition-transform">
                            Eccomi ci sono!
                        </Button>
                    </div>
                </div>
            </section>

            {/* NEW: Collections Grid (Bento) */}
            <CollectionsGrid />

            {/* NEW: How WeRoad Works */}
            <HowItWorks />

            {/* NEW: Video Stories */}
            <VideoStories />

            {/* NEW: Partners */}
            <Partners />
        </div>
    )
}
