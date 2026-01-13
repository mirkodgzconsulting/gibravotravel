"use client"

import React from "react"
import Link from "next/link"
import { Star } from "lucide-react"

// Hardcoded Review Data for Presentation
const reviews = [
    {
        name: "Martina C.",
        avatar: "M",
        stars: 5,
        review: "La mia prima avventura con GiBravo è stata così sorprendente che sono tentata di ripeterla! Sono profondamente grata ai miei compagni di viaggio, ma soprattutto al nostro coordinatore Marco Usai. Con il suo costante incoraggiamento, la sua capacità di farci sentire integrati e, naturalmente, la sua impeccabile gestione.",
        date: "1 review"
    },
    {
        name: "Alex C",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop", // Dummy avatar for realism
        image: true,
        stars: 5,
        review: "La mia prima avventura in gruppo è stata semplicemente spettacolare! 😍 Non solo la destinazione (Sri Lanka) ha contribuito, ma soprattutto il nostro fantastico coordinatore, Federico Porcino. Ha pianificato tutto alla perfezione e ha reso ogni istante del viaggio facile e divertente fin dal primo minuto.",
        date: "1 review"
    },
    {
        name: "Luca D.",
        avatar: "L",
        stars: 5,
        review: "La mia prima esperienza di viaggio con GiBravo è stata assolutamente perfetta e la consiglio vivamente a tutti i futuri viaggiatori. Vorrei inoltre complimentarmi con il nostro coordinatore, Delio Palma, per il suo impeccabile lavoro. È stato estremamente attento alle nostre esigenze.",
        date: "1 review"
    }
]

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

const TestimonialsComponent = () => {
    return (
        <section className='py-20 bg-slate-50'>
            <div className='container mx-auto px-4 max-w-7xl'>

                {/* Header Section */}
                <div className='text-center mb-16 space-y-4'>
                    <h2 className='section-title mb-6'>
                        Cosa dicono di noi?
                    </h2>
                    <p className="section-subtitle">
                        Più di 20.000 huakaiers hanno già provato l'esperienza
                    </p>

                    {/* Google Rating Block */}
                    <div className="flex flex-col items-center justify-center pt-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-white p-2 rounded-full shadow-sm">
                                <GoogleIcon />
                            </div>
                            <span className="text-4xl font-bold text-[#323232]">4.9</span>
                            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">
                            oltre 6.000 recensioni tra Italia e Spagna
                        </p>
                    </div>
                </div>

                {/* Reviews Grid */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                    {reviews.map((review, index) => (
                        <div key={index} className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-slate-100 flex flex-col h-full">

                            {/* Card Header */}
                            <div className="flex items-center gap-4 mb-6">
                                {review.image ? (
                                    /* @ts-ignore -- allowing generic string for avatar */
                                    <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-[#E8EAED] flex items-center justify-center text-slate-500 font-bold text-xl">
                                        {review.avatar}
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-[#323232] text-lg leading-none mb-1">{review.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            ))}
                                        </div>
                                        <span className="text-xs text-slate-400">{review.date}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Review Body */}
                            <p className="text-slate-600 text-[15px] leading-relaxed mb-8 flex-grow">
                                {review.review}
                            </p>

                            {/* Footer Link */}
                            <Link
                                href="#"
                                className="text-[#EA4335] text-sm font-semibold hover:underline flex items-center gap-1 mt-auto"
                            >
                                Vedi più recensioni su Google &gt;
                            </Link>

                        </div>
                    ))}
                </div>

            </div>
        </section>
    )
}

export default TestimonialsComponent
