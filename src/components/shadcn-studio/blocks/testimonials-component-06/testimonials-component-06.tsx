"use client"

import React from "react"
import { CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/website/ui/carousel"

const GOOGLE_REVIEW_LINK = "https://share.google/AdSGWQzwHWB3lAS1U"

const reviews = [
    {
        name: "Gladys Calero",
        stars: 5,
        date: "1 mese fa",
        review: "È la prima volta che faccio un viaggio con questa agenzia e mi sono trovata benissimo anche se non avevo grandi aspettative all'inizio 😁 . Siamo stati accompagnati da Alessandro leader gruppo e Matteo l'accompagnatore ufficiale. Matteo un ragazzo molto giovane ma con grande futuro nel settore turistico ⭐⭐⭐⭐⭐ io come donna che è abituata a viaggiare da sola avevo certa paura per certo posto ma loro due hanno preso cura di noi 🙏🏻💖 sempre attenti a chiedere: tutto ok? A offrirsi volentieri a farti le foto anche video 🥹 ( amo le fotografie) avere ricordi dei viaggi è molto importante per un viaggiatore 📸❤️ , loro come agenzia hanno scelto con saggezza un guida locale adatto a noi: Mahmoud, lui parlava un italiano perfetto anche spagnolo e ci ha fatto sentire molta fiducia e sicurezza. Sono felice di aver scelto Gibravo per fare questo viaggio che avevo desiderato da tanto tempo. Grazie Alessandro per le foto 🫶🏻 grazie per la pazienza ☺️ . Ci vediamo al prossimo viaggio ✈️🧳✨",
        avatar: "GC",
        image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero1_ebkhxx.jpg"
    },
    {
        name: "Dario Giusti",
        stars: 5,
        date: "2 mesi fa",
        review: "Bellissima esperienza con GiBravo in Tunisia alla scoperta della Medina e dei Suk di Tunisi, el museo del Bardo, le rovine di Cartagine e la caratteristica Sidi Bou Said. Guide locali preparate e molto gentili ci hanno accompagnato in posti magnifici. Organizzazione TOP grazie alla coordinatrice Yessica, una garanzia! Luoghi incantevoli, ristoranti tipici e street food locale per assaporare appieno il viaggio, con un passaggio al mare per ammirare il tramonto pucciando i piedi in acqua. Viaggio da portare nei ricordi e nel cuore!!!",
        avatar: "DG",
        image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero3_irc053.jpg"
    },
    {
        name: "Ada Iannace",
        stars: 5,
        date: "3 mesi fa",
        review: "Ho partecipato ieri ad una gita organizzata da voi, presso il villaggio di Heidi, e mi sono trovata benissimo: tutto curato nei dettagli e ottima organizzazione. Un grazie speciale a Jessica che ci ha seguito durante la giornata, siempre disponibile, attenta e sorridente. È stato davvero un piacere! 🌸",
        avatar: "AI"
    },
    {
        name: "Jessyca Formaggini",
        stars: 5,
        date: "4 mesi fa",
        review: "Ho conosciuto quest'agenzia tramite tiktok. Avevo prenotato tre settimane prima per ferragosto. Sono stati molto gentili mi hanno spiegato tutto come funciona. Siamo andati a noli ferragosto devo dire autista Marcello e chiara sono stati bravissimi e simpatici. Mi sono divertita un sacco.",
        avatar: "JF"
    },
    {
        name: "Marisol Suescun",
        stars: 5,
        date: "5 mesi fa",
        review: "Experiencia unica. Yessica muy precisa Y concisa grazie por la atencion prestada..",
        avatar: "MS"
    },
    {
        name: "katiuscia fenili",
        stars: 5,
        date: "6 mesi fa",
        review: "Viaggio Marocco dall' 11/03 al 15/03.. prenotato tutto via whatsapp.. non conoscevo questa agenzia l'ho conosciuta tramite i social e devo dire che è il Top... la referente Jessica ☺️.. è stata eccezionale sia io che mio figlio ci siamo trovati benissimo.. tutto organizzato nel minimo dettaglio..voto 1000.. Jessica preparati a organizzare per l'anno prossimo un Tour per la Valle dei Re.. grazie ancora a Jessica e a Gibravo ❤️",
        avatar: "KF"
    }
]

const WhiteStarIcon = ({ className = "h-4 w-4" }) => (
    <svg viewBox="0 0 24 24" className={className} fill="white">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
)

const StarIcon = ({ className = "h-4 w-4" }) => (
    <Image
        src="https://cdn.trustindex.io/assets/platform/Google/star/f.svg"
        alt="star"
        width={16}
        height={16}
        className={className}
    />
)

const GoogleG = () => (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

const GoogleLogo = () => (
    <div className="flex items-center text-[24px] font-bold tracking-tight">
        <span className="text-[#4285F4]">G</span>
        <span className="text-[#EA4335]">o</span>
        <span className="text-[#FBBC05]">o</span>
        <span className="text-[#4285F4]">g</span>
        <span className="text-[#34A853]">l</span>
        <span className="text-[#EA4335]">e</span>
    </div>
)

const TestimonialsComponent = () => {
    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    )

    return (
        <section className='py-16 bg-slate-100'>
            <div className="container px-4 mx-auto max-w-5xl">
                <div className='flex flex-col items-center justify-center pt-5'>
                    <h3 className="text-[28px] font-bold text-black mb-4 tracking-tight uppercase">ECCELLENTE</h3>

                    {/* Stars row with squares */}
                    <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-[#FEBB02] w-[34px] h-[34px] rounded-sm flex items-center justify-center">
                                <WhiteStarIcon className="w-6 h-6" />
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 mb-6 text-[15px]">
                        <span className="text-black font-bold">4.9/5</span>
                        <span className="text-black font-bold mx-1">|</span>
                        <a
                            href={GOOGLE_REVIEW_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-black hover:opacity-70 transition-opacity flex items-center gap-1"
                        >
                            In base a <span className="underline font-bold">144 recensioni</span>
                            <div className="bg-[#4285F4] rounded-full p-0.5 w-[14px] h-[14px] flex items-center justify-center ml-1">
                                <CheckCircle2 className="w-[8px] h-[8px] text-white fill-white" />
                            </div>
                        </a>
                        <GoogleLogo />
                    </div>

                    {/* Carousel wrapper */}
                    <div className="relative group w-full">
                        <Carousel
                            opts={{
                                align: "start",
                                loop: true,
                            }}
                            plugins={[plugin.current]}
                            className="w-full"
                        >
                            <CarouselContent className="">
                                {reviews.map((review, index) => (
                                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 pl-4">
                                        <div className="bg-white rounded-lg p-6 flex flex-col h-[200px] relative transition-all duration-300 hover:shadow-lg border border-gray-100">

                                            {/* Card Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-[#7B1FA2] flex items-center justify-center text-white font-bold text-sm overflow-hidden text-center uppercase">
                                                            {review.avatar}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1">
                                                            <div className="bg-white rounded-full p-[2px]">
                                                                <GoogleG />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-black text-[15px] leading-tight">{review.name}</span>
                                                        <span className="text-[12px] text-[#70757a]">{review.date}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                     <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <StarIcon key={i} className="w-[14px] h-[14px] text-[#FEBB02] fill-[#FEBB02]" />
                                                        ))}
                                                    </div>
                                                    <div className="bg-[#4285F4] rounded-full p-0.5 flex items-center justify-center w-[14px] h-[14px]">
                                                        <CheckCircle2 className="w-[8px] h-[8px] text-white fill-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content Area */}
                                            <div className="flex gap-3 items-start flex-grow overflow-hidden relative">
                                                <div className="flex-grow flex flex-col justify-between h-full"> 
                                                     <p className="text-[#4b5563] text-[14px] leading-relaxed line-clamp-5 flex-grow">
                                                        {review.review}
                                                    </p>
                                                    <div className="mt-auto pt-2">
                                                        <a
                                                            href={GOOGLE_REVIEW_LINK}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[#70757a] text-[13px] font-bold hover:underline cursor-pointer flex items-center gap-1"
                                                        >
                                                            Leggi di più
                                                        </a>
                                                    </div>
                                                </div>
                            
                                                {/* Image Thumbnail inside card */}
                                                {review.image && (
                                                    <div className="w-[60px] h-[60px] shrink-0 rounded-lg overflow-hidden relative border border-slate-200 mt-1">
                                                        <Image
                                                            src={review.image}
                                                            fill
                                                            sizes="60px"
                                                            alt="Review thumbnail"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                            <CarouselPrevious className="hidden md:flex -left-12 h-10 w-10 border border-slate-200 bg-white text-slate-400 hover:text-black hover:bg-white shadow-sm" />
                            <CarouselNext className="hidden md:flex -right-12 h-10 w-10 border border-slate-200 bg-white text-slate-400 hover:text-black hover:bg-white shadow-sm" />
                        </Carousel>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TestimonialsComponent
