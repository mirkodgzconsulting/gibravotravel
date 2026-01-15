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
            duration: 0.15,
            type: "tween",
            ease: "easeInOut"
        }
    },
    open: {
        opacity: 1,
        x: "0%",
        transition: {
            duration: 0.3,
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
        transition: { delay: i * 0.05, duration: 0.3 }
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
    const [mobilePartenzeOpen, setMobilePartenzeOpen] = useState(false)
    const partenzeRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()

    const effectiveScrolled = scrolled || mobileMenuOpen

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
            // Reset mobile submenus when closing main menu
            setMobilePartenzeOpen(false)
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [mobileMenuOpen])

    return (
        <>
            <header
                className={cn(
                    "w-full transition-all duration-300",
                    effectiveScrolled ? "bg-white shadow-sm py-0" : "bg-transparent py-2"
                )}
                onMouseLeave={() => setPartenzeOpen(false)}
            >
                <div className="container mx-auto flex h-[70px] lg:h-[80px] items-center px-4 lg:px-8 relative justify-between">
                    {/* Logo Section - Aligned Left */}
                    <div className="flex-shrink-0 flex items-center z-50">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image
                                src={effectiveScrolled ? logoOriginal : logoWhite}
                                alt="Gibravo Travel Logo"
                                width={160}
                                height={46}
                                className="h-10 w-auto md:h-12 transition-all duration-300"
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

                        <Link href="/partenze" className="hover:text-[#FE8008] transition-colors py-2">Partenze</Link>

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

                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className={cn(
                                "lg:hidden p-2 rounded-full transition-colors active:scale-95",
                                effectiveScrolled ? "hover:bg-slate-100 text-slate-900" : "hover:bg-white/10 text-white"
                            )}
                            aria-label="Apri menu"
                        >

                            {/* Custom 3-line Menu Icon (Hamburger) */}
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
                                <line x1="4" x2="20" y1="6" y2="6" />
                                <line x1="4" x2="20" y1="12" y2="12" />
                                <line x1="4" x2="20" y1="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* SUPER MODERN MOBILE MENU - ABSOLUTE POSITIONING */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            {/* Backdrop - Fixed viewport coverage */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setMobileMenuOpen(false)}
                                className="fixed inset-0 z-[-1] bg-black/60 backdrop-blur-sm h-[100vh]"
                            />

                            {/* Drawer - Fixed Top (Covers Header) */}
                            <motion.div
                                initial={{ y: "-100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "-100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="fixed top-0 left-0 right-0 z-[110] w-full bg-white shadow-2xl rounded-b-3xl overflow-hidden max-h-[85vh] flex flex-col"
                            >
                                {/* Internal Header (Logo + Close) */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50 bg-white">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src="/Logo_gibravo.svg"
                                            alt="Gibravo Travel Logo"
                                            width={140}
                                            height={40}
                                            className="h-10 w-auto object-contain"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-2 rounded-full bg-slate-50 text-slate-900 hover:bg-slate-100 transition-colors"
                                        aria-label="Chiudi menu"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Menu Items */}
                                <div className="flex-1 flex flex-col px-6 py-4 gap-2 overflow-y-auto">
                                    <motion.div custom={0} variants={linkVariants} initial="closed" animate="open">
                                        <Link
                                            href="/chi-siamo"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg font-[600] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors block py-2.5"
                                        >
                                            Chi Siamo
                                        </Link>
                                    </motion.div>

                                    <motion.div custom={1} variants={linkVariants} initial="closed" animate="open">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between w-full border-b border-gray-100 pb-2.5 py-2.5">
                                                <Link
                                                    href="/partenze"
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className="text-lg font-[600] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors flex-1"
                                                >
                                                    Partenze
                                                </Link>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setMobilePartenzeOpen(!mobilePartenzeOpen)
                                                    }}
                                                    className="p-2 -mr-2 text-slate-500 hover:text-[#004BA5] transition-colors"
                                                >
                                                    <ChevronDown className={cn("h-5 w-5 transition-transform duration-200", mobilePartenzeOpen && "rotate-180")} />
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {mobilePartenzeOpen && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden bg-gray-50/50 rounded-lg"
                                                    >
                                                        <div className="p-3 space-y-4">
                                                            {/* Section 1: Types */}
                                                            <div>
                                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Tipo di Viaggio</h4>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Link
                                                                        href="/categoria/aereo"
                                                                        onClick={() => setMobileMenuOpen(false)}
                                                                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 bg-white rounded-xl border border-blue-100/50 hover:border-blue-200 transition-colors shadow-sm"
                                                                    >
                                                                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-[#004BA5]">
                                                                            <Plane className="h-3.5 w-3.5" />
                                                                        </div>
                                                                        <span className="text-sm font-bold text-[#004BA5]">Aereo</span>
                                                                    </Link>
                                                                    <Link
                                                                        href="/categoria/bus"
                                                                        onClick={() => setMobileMenuOpen(false)}
                                                                        className="flex flex-col items-center justify-center gap-1.5 p-2.5 bg-white rounded-xl border border-orange-100/50 hover:border-orange-200 transition-colors shadow-sm"
                                                                    >
                                                                        <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center text-[#FE8008]">
                                                                            <Bus className="h-3.5 w-3.5" />
                                                                        </div>
                                                                        <span className="text-sm font-bold text-[#FE8008]">Bus</span>
                                                                    </Link>
                                                                </div>
                                                            </div>

                                                            {/* Section 2: Months */}
                                                            <div>
                                                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Filtra per Mese</h4>
                                                                <div className="grid grid-cols-4 gap-1.5">
                                                                    {months.map(m => (
                                                                        <Link
                                                                            key={m.value}
                                                                            href={`/partenze?mese=${m.value}`}
                                                                            onClick={() => setMobileMenuOpen(false)}
                                                                            className="text-center py-1.5 rounded-md bg-white border border-gray-100 text-slate-600 text-[10px] font-[700] uppercase tracking-wide hover:bg-[#004BA5] hover:text-white hover:border-[#004BA5] transition-all shadow-sm"
                                                                        >
                                                                            {m.name.slice(0, 3)}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>

                                    <motion.div custom={2} variants={linkVariants} initial="closed" animate="open">
                                        <Link
                                            href="/come-funziona"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg font-[600] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors block py-2.5"
                                        >
                                            Come funziona
                                        </Link>
                                    </motion.div>

                                    <motion.div custom={3} variants={linkVariants} initial="closed" animate="open">
                                        <Link
                                            href="/domande-frequenti"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg font-[600] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors block py-2.5"
                                        >
                                            FAQ
                                        </Link>
                                    </motion.div>

                                    <motion.div custom={4} variants={linkVariants} initial="closed" animate="open">
                                        <Link
                                            href="/contatti"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg font-[600] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors block py-2.5"
                                        >
                                            Contatti
                                        </Link>
                                    </motion.div>
                                </div>

                                {/* Drawer Footer Handle */}
                                <div className="p-3 border-t border-gray-50 flex justify-center bg-gray-50/30">
                                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </header>

            {/* Mobile Menu Removed (Moved inside Header) */}
        </>
    )
}
