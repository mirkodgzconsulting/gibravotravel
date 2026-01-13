"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, User, ChevronDown, X, Plane, Bus } from "lucide-react"
import { Button } from "@/components/website/ui/button"
import { cn } from "@/lib/website/utils"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence, Variants } from "motion/react"

const menuVariants: Variants = {
    closed: {
        opacity: 0,
        x: "100%",
        transition: {
            duration: 0.2,
            type: "tween",
            ease: "easeInOut"
        }
    },
    open: {
        opacity: 1,
        x: "0%",
        transition: {
            duration: 0.4,
            type: "spring",
            damping: 25,
            stiffness: 200
        }
    }
}

const linkVariants = {
    closed: { opacity: 0, x: 20 },
    open: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.1, duration: 0.4 }
    })
}

const logoWhite = "/Logo-GiBravo-TraciaoBianco.svg"
const logoOriginal = "/Logo_gibravo.svg"

const getInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const f = firstName?.charAt(0) || ""
    const l = lastName?.charAt(0) || ""
    return (f + l).toUpperCase() || "V"
}

// Data for Partenze Dropdown
const months = [
    { name: "Gennaio", value: "01" },
    { name: "Febbraio", value: "02" },
    { name: "Marzo", value: "03" },
    { name: "Aprile", value: "04" },
    { name: "Maggio", value: "05" },
    { name: "Giugno", value: "06" },
    { name: "Luglio", value: "07" },
    { name: "Agosto", value: "08" },
    { name: "Settembre", value: "09" },
    { name: "Ottobre", value: "10" },
    { name: "Novembre", value: "11" },
    { name: "Dicembre", value: "12" },
]

export function Navbar() {
    const { user, isLoaded, isSignedIn } = useUser()
    const [scrolled, setScrolled] = useState(false)
    const [partenzeOpen, setPartenzeOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const partenzeRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()

    // Ensure effectiveScrolled logic is kept from original file
    const effectiveScrolled = scrolled

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 20
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled)
            }
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (partenzeRef.current && !partenzeRef.current.contains(event.target as Node)) {
                setPartenzeOpen(false)
            }
        }

        window.addEventListener("scroll", handleScroll)
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            window.removeEventListener("scroll", handleScroll)
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [scrolled])

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [mobileMenuOpen])

    return (
        <>
            <header
                className={cn(
                    "relative z-50 w-full transition-all duration-300",
                    effectiveScrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-0" : "bg-transparent py-2 lg:py-4"
                )}
                onMouseLeave={() => setPartenzeOpen(false)}
            >
                <div className="container mx-auto flex h-[70px] lg:h-[80px] items-center px-4 lg:px-8 relative justify-between">
                    {/* Logo Section - Aligned Left */}
                    <div className="flex-shrink-0 flex items-center z-50">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image
                                src={logoOriginal}
                                alt="Gibravo Travel Logo"
                                width={160}
                                height={46}
                                className="h-10 w-auto md:h-12 transition-all duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation - Centered */}
                    <nav className={cn(
                        "hidden lg:flex items-center absolute left-1/2 -translate-x-1/2 gap-8 text-[15px] font-[600] tracking-wide transition-colors h-full",
                        effectiveScrolled ? "text-[#4D4D4D]" : "text-white"
                    )}>
                        <Link href="/chi-siamo" className="hover:text-[#FE8008] transition-colors py-2">Chi siamo</Link>

                        {/* Partenze Dropdown Trigger */}
                        <div
                            className="relative h-full flex items-center"
                            ref={partenzeRef}
                            onMouseEnter={() => setPartenzeOpen(true)}
                        >
                            <button
                                className={cn(
                                    "flex items-center gap-1 hover:text-[#FE8008] transition-colors focus:outline-none py-2",
                                    partenzeOpen && "text-[#FE8008]"
                                )}
                                onClick={() => setPartenzeOpen(!partenzeOpen)}
                            >
                                Partenze
                                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", partenzeOpen && "rotate-180")} />
                            </button>

                            {/* Mega Menu Dropdown */}
                            <AnimatePresence>
                                {partenzeOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-[80%] left-1/2 -translate-x-1/2 pt-4 w-[600px]"
                                    >
                                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8 grid grid-cols-2 gap-8 relative overflow-hidden">
                                            {/* Column 1: Mesi */}
                                            <div>
                                                <h3 className="text-[#004BA5] font-bold text-lg mb-4 flex items-center gap-2">
                                                    Mesi
                                                </h3>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                    {months.map((month) => (
                                                        <Link
                                                            key={month.value}
                                                            href={`/partenze?mese=${month.value}`}
                                                            className="text-gray-600 hover:text-[#FE8008] text-sm py-1 transition-colors block"
                                                            onClick={() => setPartenzeOpen(false)}
                                                        >
                                                            {month.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Column 2: Viaggi */}
                                            <div className="border-l border-gray-100 pl-8">
                                                <h3 className="text-[#004BA5] font-bold text-lg mb-4 flex items-center gap-2">
                                                    Viaggi
                                                </h3>
                                                <div className="space-y-3">
                                                    <Link
                                                        href="/categoria/aereo"
                                                        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors"
                                                        onClick={() => setPartenzeOpen(false)}
                                                    >
                                                        <div className="bg-blue-100 text-[#004BA5] p-2 rounded-full group-hover:bg-[#004BA5] group-hover:text-white transition-colors">
                                                            <Plane className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <span className="block font-semibold text-gray-800 group-hover:text-[#004BA5]">Viaggi Aerei</span>
                                                            <span className="text-xs text-gray-500">Esplora il mondo in volo</span>
                                                        </div>
                                                    </Link>

                                                    <Link
                                                        href="/categoria/bus"
                                                        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors"
                                                        onClick={() => setPartenzeOpen(false)}
                                                    >
                                                        <div className="bg-orange-100 text-[#FE8008] p-2 rounded-full group-hover:bg-[#FE8008] group-hover:text-white transition-colors">
                                                            <Bus className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <span className="block font-semibold text-gray-800 group-hover:text-[#FE8008]">Viaggi in Bus</span>
                                                            <span className="text-xs text-gray-500">Tour comodi e vicini</span>
                                                        </div>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Invisible bridge to prevent closing when moving mouse */}
                                        <div className="absolute top-0 left-0 w-full h-8 -mt-8 bg-transparent" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <Link href="/come-funziona" className="hover:text-[#FE8008] transition-colors py-2">Come funziona</Link>
                        <Link href="/domande-frequenti" className="hover:text-[#FE8008] transition-colors py-2">FAQ</Link>
                        <Link href="/contatti" className="hover:text-[#FE8008] transition-colors py-2">Contatti</Link>
                    </nav>

                    {/* Action Buttons - Aligned Right */}
                    <div className="flex items-center justify-end gap-3 flex-shrink-0 z-50">
                        <div className="hidden lg:block ml-2">
                            {isLoaded && isSignedIn ? (
                                <Link href="/area-riservata">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#004BA5] to-[#003580] shadow-sm border-2 border-white flex items-center justify-center text-white text-[13px] font-[700] tracking-tighter shrink-0 ring-2 ring-[#004BA5]/5 uppercase hover:scale-105 transition-transform duration-200">
                                        {getInitials(user?.firstName, user?.lastName)}
                                    </div>
                                </Link>
                            ) : (
                                <Link href="/login">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "rounded-full w-10 h-10 p-0 flex items-center justify-center transition-all",
                                            effectiveScrolled
                                                ? "bg-gray-100/80 active:bg-gray-200 text-slate-700"
                                                : "bg-white/10 active:bg-white/20 text-white"
                                        )}
                                    >
                                        <User className="h-5 w-5" />
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile User Icon - Visible only on mobile, left of hamburger */}
                        <div className="lg:hidden mr-2">
                            {isLoaded && isSignedIn ? (
                                <Link href="/area-riservata">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#004BA5] to-[#003580] shadow-sm border-2 border-white flex items-center justify-center text-white text-[12px] font-[700] tracking-tighter shrink-0 ring-1 ring-[#004BA5]/10 uppercase active:scale-95 transition-transform duration-200">
                                        {getInitials(user?.firstName, user?.lastName)}
                                    </div>
                                </Link>
                            ) : (
                                <Link href="/login">
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "rounded-full w-9 h-9 p-0 flex items-center justify-center transition-all",
                                            effectiveScrolled
                                                ? "bg-gray-100/80 active:bg-gray-200 text-slate-700"
                                                : "bg-white/10 active:bg-white/20 text-white"
                                        )}
                                    >
                                        <User className="h-5 w-5" />
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile Menu Toggle - Improved Icon Button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className={cn(
                                "lg:hidden p-2 rounded-full transition-colors active:scale-95",
                                effectiveScrolled ? "hover:bg-slate-100 text-slate-900" : "hover:bg-white/10 text-white"
                            )}
                            aria-label="Apri menu"
                        >

                            {/* Custom 2-line Menu Icon */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="4" x2="20" y1="9" y2="9" />
                                <line x1="4" x2="20" y1="15" y2="15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* SUPER MODERN MOBILE MENU */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={menuVariants}
                        className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 pb-2">
                            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                                <Image
                                    src="/Logo_gibravo.svg"
                                    alt="Gibravo"
                                    width={140}
                                    height={40}
                                    className="h-10 w-auto"
                                />
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 rounded-full bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors"
                            >
                                <X className="h-7 w-7" />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 flex flex-col justify-center px-8 gap-6 overflow-y-auto">
                            <motion.div custom={0} variants={linkVariants}>
                                <Link
                                    href="/chi-siamo"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-2xl font-[500] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors block"
                                >
                                    Chi Siamo
                                </Link>
                            </motion.div>

                            <motion.div custom={1} variants={linkVariants}>
                                <div className="space-y-4">
                                    <span className="text-2xl font-[500] tracking-tight text-slate-900 block border-b border-gray-100 pb-2">
                                        Partenze
                                    </span>
                                    <div className="pl-4 grid grid-cols-2 gap-3">
                                        <Link
                                            href="/categoria/aereo"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg text-slate-600 hover:text-[#004BA5] flex items-center gap-2"
                                        >
                                            <Plane className="h-4 w-4" /> Aereo
                                        </Link>
                                        <Link
                                            href="/categoria/bus"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg text-slate-600 hover:text-[#004BA5] flex items-center gap-2"
                                        >
                                            <Bus className="h-4 w-4" /> Bus
                                        </Link>
                                    </div>
                                    <div className="pl-4 grid grid-cols-3 gap-2">
                                        {months.slice(0, 6).map(m => (
                                            <Link
                                                key={m.value}
                                                href={`/partenze?mese=${m.value}`}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="text-sm text-slate-500 hover:text-[#004BA5]"
                                            >
                                                {m.name.slice(0, 3)}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div custom={2} variants={linkVariants}>
                                <Link
                                    href="/come-funziona"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-2xl font-[500] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors block"
                                >
                                    Come funziona
                                </Link>
                            </motion.div>

                            <motion.div custom={3} variants={linkVariants}>
                                <Link
                                    href="/domande-frequenti"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-2xl font-[500] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors block"
                                >
                                    FAQ
                                </Link>
                            </motion.div>

                            <motion.div custom={4} variants={linkVariants}>
                                <Link
                                    href="/contatti"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-2xl font-[500] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors block"
                                >
                                    Contatti
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
