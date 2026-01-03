"use client";
import React from "react";
import Link from "next/link";
import {
    DraggableCardBody,
    DraggableCardContainer,
} from "@/components/website/ui/draggable-card";
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll";

export function DraggableCardsSection() {
    const items = [
        {
            title: "Vienna",
            image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395329/Vienna-Coverv3_eytdes.jpg",
            className: "absolute top-10 left-[15%] rotate-[-5deg] z-10",
        },
        {
            title: "Lago di Braies",
            image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395309/LagoDiBraies-cover-home_vay2qw.jpg",
            className: "absolute top-40 left-[25%] rotate-[-7deg] z-20",
        },
        {
            title: "Parigi",
            image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395302/Parigi-Cover_os7ze8.jpg",
            className: "absolute top-5 left-[40%] rotate-[8deg] z-30",
        },
        {
            title: "Praga",
            image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395292/Praga-image1_sjypev.jpg",
            className: "absolute top-32 left-[55%] rotate-[10deg] z-40",
        },
        {
            title: "Egitto",
            image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395511/egipto-home-card_rxa21m.webp",
            className: "absolute top-20 right-[25%] rotate-[2deg] z-50",
        },
        {
            title: "Livigno",
            image: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395568/LIVIGNO-assets01_f9kkly.jpg",
            className: "absolute top-24 left-[45%] rotate-[-7deg] z-[60]",
        },
    ];

    return (
        <section className="relative py-24 bg-slate-50 overflow-hidden min-h-[850px] flex items-center justify-center">
            <div className="container px-4 mx-auto relative z-20 h-full">

                {/* Static Header */}
                <div className="text-center mb-12 relative z-[100] pointer-events-none">
                    <RevealOnScroll>
                        <h2 className="section-title mb-2">Ispirazione per il tuo viaggio</h2>
                        <p className="section-subtitle">Clicca ogni card per scoprire nuove destinazioni</p>
                    </RevealOnScroll>
                </div>

                <DraggableCardContainer className="relative flex h-[600px] w-full items-center justify-center">

                    {/* Background Reveal Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                        <RevealOnScroll>
                            <h3 className="text-3xl md:text-5xl font-[700] text-[#004BA5] mb-6 tracking-tight">
                                Il mondo ti aspetta...
                            </h3>
                            <Link
                                href="https://www.facebook.com/GiBravoTravelAgenzia/events"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-8 h-12 bg-[#FE8008] text-white font-[600] rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                            >
                                Clicca per scoprire tutti i nostri viaggi 🌍
                            </Link>
                        </RevealOnScroll>
                    </div>

                    {/* Draggable Cards */}
                    {items.map((item, idx) => (
                        <DraggableCardBody key={idx} className={item.className}>
                            <div className="relative h-full w-full">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="pointer-events-none relative z-10 h-80 w-full object-cover rounded-xl shadow-sm"
                                />
                                <h3 className="mt-4 text-center text-2xl font-bold text-[#323232]">
                                    {item.title}
                                </h3>
                            </div>
                        </DraggableCardBody>
                    ))}
                </DraggableCardContainer>
            </div>
        </section>
    );
}
