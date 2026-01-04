"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, User, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/website/ui/button"
import { cn } from "@/lib/website/utils"
import { useUser } from "@clerk/nextjs"
import { motion, AnimatePresence, Variants } from "motion/react"

// Add this interface or just use inline types if preferred, but for clarity:
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

const getInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const f = firstName?.charAt(0) || ""
    const l = lastName?.charAt(0) || ""
    return (f + l).toUpperCase() || "V"
}

export function Navbar() {
    // ... existing hooks ...
    const { user, isLoaded, isSignedIn } = useUser()
    const [scrolled, setScrolled] = useState(false)
    const [typesMenuOpen, setTypesMenuOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const typesMenuRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()

    // ... existing logic ...

    // Ensure effectiveScrolled logic is kept from original file
    const effectiveScrolled = true

    useEffect(() => {
        // ... (keep scroll logic)
        const handleScroll = () => {
            const isScrolled = window.scrollY > 20
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled)
            }
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (typesMenuRef.current && !typesMenuRef.current.contains(event.target as Node)) {
                setTypesMenuOpen(false)
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
                    effectiveScrolled ? "bg-white shadow-md py-0" : "bg-transparent py-4"
                )}
            >
                <div className="container mx-auto flex h-[58px] items-center px-4 lg:px-8 relative justify-between">
                    {/* Logo Section - Aligned Left */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image
                                src="/Logo_gibravo.svg"
                                alt="Gibravo Travel Logo"
                                width={160}
                                height={46}
                                className="h-10 w-auto md:h-12"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Desktop Navigation - Centered */}
                    <nav className={cn(
                        "hidden lg:flex items-center absolute left-1/2 -translate-x-1/2 gap-8 text-[15px] font-[600] tracking-normal transition-colors h-full",
                        effectiveScrolled ? "text-[#4D4D4D]" : "text-white"
                    )}>
                        <Link href="/chi-siamo" className="hover:text-[#FE8008] transition-colors">Chi siamo</Link>

                        <Link href="/destinazioni" className="hover:text-[#FE8008] transition-colors">Destinazioni</Link>

                        {/* Travel Types Dropdown */}
                        <div className="relative flex items-center h-full" ref={typesMenuRef}>
                            <button
                                onClick={() => setTypesMenuOpen(!typesMenuOpen)}
                                type="button"
                                className="flex items-center gap-1 hover:text-[#FE8008] transition-colors cursor-pointer h-full outline-none"
                            >
                                <span>Tipi di viaggio</span>
                                <ChevronDown className={cn(
                                    "h-4 w-4 transition-transform duration-200",
                                    typesMenuOpen ? "rotate-180" : ""
                                )} />
                            </button>

                            {typesMenuOpen && (
                                <div className="absolute top-[80%] left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden text-slate-900 py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <Link
                                        href="/tipi-di-viaggio/autobus"
                                        className="block px-4 py-2 text-sm font-semibold hover:bg-gray-50 hover:text-[#FE8008] transition-colors"
                                        onClick={() => setTypesMenuOpen(false)}
                                    >
                                        Viaggio in autobus
                                    </Link>
                                    <Link
                                        href="/tipi-di-viaggio/aereo"
                                        className="block px-4 py-2 text-sm font-semibold hover:bg-gray-50 hover:text-[#FE8008] transition-colors"
                                        onClick={() => setTypesMenuOpen(false)}
                                    >
                                        Viaggio in aereo
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link href="/domande-frequenti" className="hover:text-[#FE8008] transition-colors">FAQ</Link>
                        <Link href="/contatti" className="hover:text-[#FE8008] transition-colors">Contatti</Link>
                    </nav>

                    {/* Action Buttons - Aligned Right */}
                    <div className="flex items-center justify-end gap-3 flex-shrink-0">
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
                                <Link
                                    href="/destinazioni"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-2xl font-[500] tracking-tight text-slate-900 hover:text-[#004BA5] transition-colors block"
                                >
                                    Destinazioni
                                </Link>
                            </motion.div>

                            <motion.div custom={2} variants={linkVariants}>
                                <div className="space-y-3">
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">TIPI DI VIAGGIO</span>
                                    <div className="flex flex-col gap-3 pl-1 border-l-2 border-[#FE8008]">
                                        <Link
                                            href="/tipi-di-viaggio/autobus"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg font-medium text-slate-700 hover:text-[#FE8008] pl-3 py-1 block"
                                        >
                                            Viaggio in Autobus
                                        </Link>
                                        <Link
                                            href="/tipi-di-viaggio/aereo"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-lg font-medium text-slate-700 hover:text-[#FE8008] pl-3 py-1 block"
                                        >
                                            Viaggio in Aereo
                                        </Link>
                                    </div>
                                </div>
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
