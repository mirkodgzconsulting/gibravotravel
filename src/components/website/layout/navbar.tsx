"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, Search, User, Heart, ChevronDown, Globe, X } from "lucide-react"
import { Button } from "@/components/website/ui/button"
import { cn } from "@/lib/website/utils"
import { useLanguage, Language } from "@/context/website/language-context"

export function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [langMenuOpen, setLangMenuOpen] = useState(false)
    const [typesMenuOpen, setTypesMenuOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const langMenuRef = useRef<HTMLDivElement>(null)
    const typesMenuRef = useRef<HTMLDivElement>(null)
    const { t, language, setLanguage } = useLanguage()
    const pathname = usePathname()

    // Pages that have a Hero/Cover image and need a transparent header initially
    const isTransparentPage = pathname === "/" || pathname === "/chi-siamo"

    // If NOT a transparent page, force "scrolled" style (Solid White) always
    const effectiveScrolled = scrolled || !isTransparentPage

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 20
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled)
            }
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
                setLangMenuOpen(false)
            }
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

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang)
        setLangMenuOpen(false)
    }

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 z-50 w-full transition-all duration-300",
                    effectiveScrolled ? "bg-white shadow-md py-0" : "bg-transparent py-4"
                )}
            >
                <div className="container mx-auto flex h-[58px] items-center justify-between px-4 lg:px-8">
                    {/* Logo Section */}
                    <div className="flex items-center gap-12">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Image
                                src="/Logo_gibravo.svg"
                                alt="Gibravo Travel Logo"
                                width={140}
                                height={40}
                                className="h-10 w-auto"
                                priority
                            />
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className={cn(
                            "hidden lg:flex items-center gap-8 text-[15px] font-[700] tracking-normal transition-colors",
                            effectiveScrolled ? "text-[#4D4D4D]" : "text-white"
                        )}>
                            <Link href="/chi-siamo" className="hover:text-[#FE8008] transition-colors">{t("aboutUs")}</Link>

                            <Link href="/destinazioni" className="hover:text-[#FE8008] transition-colors">{t("destinations")}</Link>

                            {/* Travel Types Dropdown */}
                            <div className="relative flex items-center" ref={typesMenuRef}>
                                <button
                                    onClick={() => setTypesMenuOpen(!typesMenuOpen)}
                                    type="button"
                                    className="flex items-center gap-1 hover:text-[#FE8008] transition-colors cursor-pointer"
                                >
                                    <span>{t("types")}</span>
                                    <ChevronDown className={cn(
                                        "h-4 w-4 transition-transform duration-200",
                                        typesMenuOpen ? "rotate-180" : ""
                                    )} />
                                </button>

                                {typesMenuOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden text-slate-900 py-1 animate-in fade-in zoom-in-95 duration-200">
                                        <Link
                                            href="/tipi-di-viaggio/autobus"
                                            className="block px-4 py-2 text-sm font-semibold hover:bg-gray-50 hover:text-[#FE8008] transition-colors"
                                            onClick={() => setTypesMenuOpen(false)}
                                        >
                                            {t("busTrip")}
                                        </Link>
                                        <Link
                                            href="/tipi-di-viaggio/aereo"
                                            className="block px-4 py-2 text-sm font-semibold hover:bg-gray-50 hover:text-[#FE8008] transition-colors"
                                            onClick={() => setTypesMenuOpen(false)}
                                        >
                                            {t("flightTrip")}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <Link href="/contatti" className="hover:text-[#FE8008] transition-colors">{t("contacts")}</Link>
                        </nav>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {/* Icons */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "hidden lg:flex hover:bg-white/10 w-9 h-9",
                                effectiveScrolled ? "text-[#4D4D4D] hover:text-[#FE8008] hover:bg-[#FE8008]/5" : "text-white hover:text-[#FE8008]"
                            )}
                        >
                            <Search className="h-5 w-5" strokeWidth={2.5} />
                            <span className="sr-only">{t("search")}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "hidden lg:flex hover:bg-white/10 w-9 h-9",
                                effectiveScrolled ? "text-[#4D4D4D] hover:text-[#FE8008] hover:bg-[#FE8008]/5" : "text-white hover:text-[#FE8008]"
                            )}
                        >
                            <Heart className="h-5 w-5" strokeWidth={2.5} />
                            <span className="sr-only">{t("favorites")}</span>
                        </Button>

                        {/* Language Dropdown (No EUR) */}
                        <div className="relative hidden lg:flex items-center" ref={langMenuRef}>
                            <button
                                onClick={() => setLangMenuOpen(!langMenuOpen)}
                                type="button"
                                className={cn(
                                    "flex items-center gap-1 text-xs font-bold mx-2 cursor-pointer hover:opacity-80 transition-opacity select-none px-2 py-1 rounded",
                                    effectiveScrolled ? "text-slate-900" : "text-white"
                                )}
                            >
                                <span>{language}</span>
                                <ChevronDown className="h-3 w-3 opacity-70" />
                            </button>

                            {/* Dropdown Menu */}
                            {langMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden text-slate-900 py-1 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">Select Language</div>
                                    {(["IT", "ES", "EN"] as Language[]).map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => handleLanguageChange(lang)}
                                            className={cn(
                                                "w-full text-left px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors",
                                                language === lang ? "text-primary bg-primary/5" : "text-slate-700"
                                            )}
                                        >
                                            <Globe className="h-3 w-3 opacity-50" />
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* User Icon (Placeholder) */}
                        <div className="hidden lg:block ml-2">
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "rounded-full w-10 h-10 p-0 flex items-center justify-center transition-all",
                                        effectiveScrolled
                                            ? "bg-gray-100 hover:bg-gray-200 text-slate-700"
                                            : "bg-white/10 hover:bg-white/20 text-white"
                                    )}
                                >
                                    <User className="h-5 w-5" />
                                </Button>
                            </Link>
                        </div>



                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(true)}
                            className={cn(
                                "lg:hidden",
                                effectiveScrolled ? "text-slate-900" : "text-white"
                            )}
                        >
                            <Menu className="h-7 w-7" strokeWidth={2} />
                            <span className="sr-only">Menu</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[60] bg-white animate-in slide-in-from-right duration-200 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/Logo_gibravo.svg"
                                alt="Gibravo Travel Logo"
                                width={120}
                                height={32}
                                className="h-8 w-auto"
                            />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                            <X className="h-6 w-6 text-slate-900" />
                        </Button>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                        <nav className={cn("flex flex-col gap-4 text-lg font-[800] text-slate-900")}>
                            <Link href="/chi-siamo" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("aboutUs")}</Link>

                            <Link href="/destinazioni" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("destinations")}</Link>

                            {/* Mobile Travel Types Submenu (Simplified as flat links for better mobile UX) */}
                            <div className="flex flex-col gap-2 pl-4 border-l-2 border-gray-100">
                                <span className="text-gray-400 text-sm uppercase tracking-wider font-bold">{t("types")}</span>
                                <Link href="/tipi-di-viaggio/autobus" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("busTrip")}</Link>
                                <Link href="/tipi-di-viaggio/aereo" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("flightTrip")}</Link>
                            </div>

                            <Link href="/contatti" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("contacts")}</Link>
                        </nav>

                        <div className="border-t border-gray-100 my-2" />

                        {/* Mobile Language Selector */}
                        <div className="flex gap-4">
                            {(["IT", "ES", "EN"] as Language[]).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => handleLanguageChange(lang)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-bold border",
                                        language === lang
                                            ? "bg-[#004BA5] text-white border-[#004BA5]"
                                            : "bg-white text-slate-600 border-gray-200"
                                    )}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto mb-4">
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
