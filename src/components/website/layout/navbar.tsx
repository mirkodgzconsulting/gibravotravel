"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, Search, User, Heart, ChevronDown, Globe, X } from "lucide-react"
import { Button } from "@/components/website/ui/button"
import { cn } from "@/lib/website/utils"
import { useLanguage, Language } from "@/context/website/language-context"

export function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [langMenuOpen, setLangMenuOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const langMenuRef = useRef<HTMLDivElement>(null)
    const { t, language, setLanguage } = useLanguage()

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
                    scrolled ? "bg-white shadow-md py-0" : "bg-transparent py-4"
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
                            scrolled ? "text-[#4D4D4D]" : "text-white"
                        )}>
                            <Link href="/partenze" className="hover:text-[#FE8008] transition-colors">{t("dates")}</Link>
                            <Link href="/destinazioni" className="hover:text-[#FE8008] transition-colors">{t("destinations")}</Link>
                            <Link href="/tipi-di-viaggio" className="hover:text-[#FE8008] transition-colors">{t("types")}</Link>
                            <Link href="/eventi" className="hover:text-[#FE8008] transition-colors">{t("events")}</Link>
                            <Link href="/blog" className="hover:text-[#FE8008] transition-colors">{t("blog")}</Link>
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
                                scrolled ? "text-[#4D4D4D] hover:text-[#FE8008] hover:bg-[#FE8008]/5" : "text-white hover:text-[#FE8008]"
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
                                scrolled ? "text-[#4D4D4D] hover:text-[#FE8008] hover:bg-[#FE8008]/5" : "text-white hover:text-[#FE8008]"
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
                                    scrolled ? "text-slate-900" : "text-white"
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

                        {/* Login / Dashboard Link */}
                        <Link href="/dashboard-viajes" className={cn(
                            "hidden lg:flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors ml-2 hover:opacity-80",
                            scrolled
                                ? "bg-white border-gray-200 shadow-sm text-gray-700"
                                : "bg-white/10 border-white/20 backdrop-blur-sm text-white"
                        )} title="Area Riservata">
                            <span className="text-sm font-bold hidden xl:block">Login</span>
                            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <User className="h-4 w-4" />
                            </div>
                        </Link>

                        {/* CTA Button (Brand Colors: Primary Blue Text, Hover Secondary Orange BG) */}
                        <Button className={cn(
                            "hidden lg:flex rounded-full px-6 font-[800] text-[13px] shadow-sm transition-all hover:scale-105 border-2 ml-2",
                            scrolled
                                ? "bg-white text-[#004BA5] border-[#004BA5] hover:bg-[#FE8008] hover:text-white hover:border-[#FE8008]"
                                : "bg-white text-[#004BA5] border-white hover:bg-[#FE8008] hover:text-white hover:border-[#FE8008]"
                        )}>
                            {t("talkToUs")}
                        </Button>

                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(true)}
                            className={cn(
                                "lg:hidden",
                                scrolled ? "text-slate-900" : "text-white"
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
                        <nav className="flex flex-col gap-4 text-lg font-[800] text-slate-900">
                            <Link href="/partenze" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("dates")}</Link>
                            <Link href="/destinazioni" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("destinations")}</Link>
                            <Link href="/tipi-di-viaggio" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("types")}</Link>
                            <Link href="/eventi" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("events")}</Link>
                            <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#FE8008]">{t("blog")}</Link>
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
                            <Button className="w-full bg-[#004BA5] hover:bg-[#FE8008] text-white font-[800] py-6 rounded-xl text-lg shadow-lg">
                                {t("talkToUs")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
