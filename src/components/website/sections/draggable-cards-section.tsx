"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { MapPin, ArrowUpRight } from "lucide-react";
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll";
import { cn } from "@/lib/website/utils";

const destinations = [
    {
        id: "vienna",
        title: "Vienna",
        subtitle: "Arte imperiale",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395329/Vienna-Coverv3_eytdes.jpg",
        size: "large" // Spans full height on left
    },
    {
        id: "braies",
        title: "Dolomiti",
        subtitle: "Natura pura",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395309/LagoDiBraies-cover-home_vay2qw.jpg",
        size: "normal"
    },
    {
        id: "parigi",
        title: "Parigi",
        subtitle: "Romantica",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395302/Parigi-Cover_os7ze8.jpg",
        size: "normal"
    },
    {
        id: "praga",
        title: "Praga",
        subtitle: "Magica",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395292/Praga-image1_sjypev.jpg",
        size: "wide" // Spans width
    },
    {
        id: "egitto",
        title: "Egitto",
        subtitle: "Eterno",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395511/egipto-home-card_rxa21m.webp",
        size: "normal"
    },
    {
        id: "livigno",
        title: "Livigno",
        subtitle: "Neve & Sport",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395568/LIVIGNO-assets01_f9kkly.jpg",
        size: "normal"
    },
];

export function DraggableCardsSection() {
    return (
        <section className="py-16 bg-white overflow-hidden relative">
            <div className="container px-4 mx-auto relative z-10 max-w-6xl">
                <div className="text-center mb-12 lg:mb-16">
                    <RevealOnScroll>
                        <h2 className="section-title mb-4">Ispirazione per il tuo viaggio</h2>
                        <p className="section-subtitle">Tutte le sfumature del mondo, in un colpo d'occhio.</p>
                    </RevealOnScroll>
                </div>

                {/* BENTO GRID LAYOUT - 6 ITEMS PERFECT FIT */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[280px]">
                    
                    {/* Fila 1 */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="md:col-span-2 relative rounded-xl overflow-hidden group cursor-pointer"
                    >
                         <GalleryCard item={destinations[0]} />
                    </motion.div>

                    <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.5, delay: 0.1 }}
                        className="md:col-span-1 relative rounded-xl overflow-hidden group cursor-pointer"
                    >
                        <GalleryCard item={destinations[1]} />
                    </motion.div>

                    <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.5, delay: 0.2 }}
                        className="md:col-span-1 relative rounded-xl overflow-hidden group cursor-pointer"
                    >
                        <GalleryCard item={destinations[2]} />
                    </motion.div>

                    {/* Fila 2 - Balanced Pattern */}
                    <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.5, delay: 0.3 }}
                        className="md:col-span-1 relative rounded-xl overflow-hidden group cursor-pointer"
                    >
                        <GalleryCard item={destinations[4]} /> {/* Egitto moved here */}
                    </motion.div>

                    <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.5, delay: 0.4 }}
                        className="md:col-span-1 relative rounded-xl overflow-hidden group cursor-pointer"
                    >
                       <GalleryCard item={destinations[5]} /> {/* Livigno moved here */}
                    </motion.div>

                    <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ duration: 0.5, delay: 0.5 }}
                        className="md:col-span-2 relative rounded-xl overflow-hidden group cursor-pointer"
                    >
                        <GalleryCard item={destinations[3]} /> {/* Praga (Wide) moved here */}
                    </motion.div>

                </div>
            </div>
        </section>
    );
}

function GalleryCard({ item }: { item: any }) {
    return (
        <>
            <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 p-6 w-full flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <MapPin className="h-3 w-3 text-[#FE8008]" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{item.subtitle}</span>
                </div>
                
                <div className="flex justify-between items-end">
                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">{item.title}</h3>
                    
                    <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300">
                        <ArrowUpRight className="h-5 w-5 text-white" />
                    </div>
                </div>
            </div>
        </>
    )
}
