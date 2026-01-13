"use client";
import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll";

const images = [
    {
        title: "Vienna",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395329/Vienna-Coverv3_eytdes.jpg",
    },
    {
        title: "Lago di Braies",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395309/LagoDiBraies-cover-home_vay2qw.jpg",
    },
    {
        title: "Parigi",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395302/Parigi-Cover_os7ze8.jpg",
    },
    {
        title: "Praga",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395292/Praga-image1_sjypev.jpg",
    },
    {
        title: "Egitto",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395511/egipto-home-card_rxa21m.webp",
    },
    {
        title: "Livigno",
        src: "https://res.cloudinary.com/dskliu1ig/image/upload/v1767395568/LIVIGNO-assets01_f9kkly.jpg",
    },
];

export function DraggableCardsSection() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const springConfig = { stiffness: 100, damping: 30, bounce: 0 };
    const scrollSpring = useScroll({ target: containerRef, offset: ["start end", "end start"] }).scrollYProgress;

    const [isMobile, setIsMobile] = React.useState(true);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Increased range for more obvious effect - ONLY DESKTOP
    const y1 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -300]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : 300]); // Moves opposite
    const y3 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -150]);

    return (
        <section ref={containerRef} className="relative pt-12 pb-24 md:pb-48 bg-slate-50 overflow-hidden min-h-[100vh]">
            <div className="container px-4 mx-auto relative z-20 max-w-7xl">
                {/* Static Header */}
                <div className="text-center mb-16 md:mb-32 relative z-[100]">
                    <RevealOnScroll>
                        <h2 className="section-title mb-4">Ispirazione per il tuo viaggio</h2>
                        <p className="section-subtitle">Lasciati guidare dalla bellezza del mondo</p>
                    </RevealOnScroll>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* Column 1 - Moves Up Faster */}
                    <motion.div style={{ y: y1 }} className="flex flex-col gap-6">
                        {images.slice(0, 2).map((img, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: idx * 0.2 }}
                                className="relative h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl group cursor-pointer"
                            >
                                <Image
                                    src={img.src}
                                    alt={img.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                                <div className="absolute bottom-6 left-6 transform translate-y-0 transition-transform duration-500">
                                    <h3 className="text-white text-3xl font-bold drop-shadow-lg">{img.title}</h3>
                                    <p className="text-white/80 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                                        Scopri di più &rarr;
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Column 2 - Moves Down (Parallax Lag) */}
                    <motion.div style={{ y: y2 }} className="flex flex-col gap-6 md:-mt-24">
                        {images.slice(2, 4).map((img, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 + (idx * 0.2) }}
                                className="relative h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl group cursor-pointer"
                            >
                                <Image
                                    src={img.src}
                                    alt={img.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                                <div className="absolute bottom-6 left-6 transform translate-y-0 transition-transform duration-500">
                                    <h3 className="text-white text-3xl font-bold drop-shadow-lg">{img.title}</h3>
                                    <p className="text-white/80 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                                        Scopri di più &rarr;
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Column 3 - Moves Up Slower */}
                    <motion.div style={{ y: y3 }} className="flex flex-col gap-6">
                        {images.slice(4, 6).map((img, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.4 + (idx * 0.2) }}
                                className="relative h-[300px] md:h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl group cursor-pointer"
                            >
                                <Image
                                    src={img.src}
                                    alt={img.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                                <div className="absolute bottom-6 left-6 transform translate-y-0 transition-transform duration-500">
                                    <h3 className="text-white text-3xl font-bold drop-shadow-lg">{img.title}</h3>
                                    <p className="text-white/80 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-4 group-hover:translate-y-0">
                                        Scopri di più &rarr;
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
