"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export type Language = "IT" | "ES" | "EN"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const translations = {
    IT: {
        // Navbar
        destinations: "Destinazioni",
        dates: "Partenze",
        types: "Tipi di viaggio",
        busTrip: "Viaggio in autobus",
        flightTrip: "Viaggio in aereo",
        aboutUs: "Chi siamo",
        contacts: "Contatti",
        search: "Cerca",
        favorites: "Preferiti",
        account: "Account",
        talkToUs: "PARLA CON NOI",
        // Hero
        heroTitle1: "Prepara lo zaino,",
        heroTitle2: "noi portiamo gli amici.",
        heroSubtitle: "Scopri il mondo viaggiando in piccoli gruppi",
        where: "Dove?",
        anyDestination: "Qualsiasi destinazione",
        when: "Quando?",
        allYear: "Tutto l'anno",
        searchBtn: "CERCA",
        // Featured
        popularDestinations: "Destinazioni Popolari",
        seeAll: "Vedi tutte",
    },
    ES: {
        destinations: "Destinos",
        dates: "Calendario",
        types: "Tipos de viaje",
        busTrip: "Viaje en autobús",
        flightTrip: "Viaje en avión",
        aboutUs: "Quiénes somos",
        contacts: "Contactos",
        search: "Buscar",
        favorites: "Favoritos",
        account: "Cuenta",
        talkToUs: "HABLEMOS",
        heroTitle1: "Prepara tu mochila,",
        heroTitle2: "nosotros ponemos los amigos.",
        heroSubtitle: "Descubre el mundo viajando en pequeños grupos",
        where: "¿Dónde?",
        anyDestination: "Cualquier destino",
        when: "¿Cuándo?",
        allYear: "Todo el año",
        searchBtn: "BUSCAR",
        popularDestinations: "Destinos Populares",
        seeAll: "Ver todos",
    },
    EN: {
        destinations: "Destinations",
        dates: "Dates",
        types: "Trip Types",
        busTrip: "Bus Trip",
        flightTrip: "Flight Trip",
        aboutUs: "About Us",
        contacts: "Contacts",
        search: "Search",
        favorites: "Favorites",
        account: "Account",
        talkToUs: "TALK TO US",
        heroTitle1: "Pack your backpack,",
        heroTitle2: "we bring the friends.",
        heroSubtitle: "Discover the world traveling in small groups",
        where: "Where?",
        anyDestination: "Any destination",
        when: "When?",
        allYear: "All year round",
        searchBtn: "SEARCH",
        popularDestinations: "Popular Destinations",
        seeAll: "See all",
    }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("IT")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem("language") as Language
        if (saved && ["IT", "ES", "EN"].includes(saved)) {
            setLanguage(saved)
        }
    }, [])

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("language", language)
            document.documentElement.lang = language.toLowerCase()
        }
    }, [language, mounted])

    const t = (key: string) => {
        // @ts-ignore
        return translations[language][key] || key
    }

    if (!mounted) {
        // Render with default language (IT) to match server server-side generation
        // or return null to avoid hydration mismatch if content differs significantly
        // For now, we render children to ensure SEO content is present
        return (
            <LanguageContext.Provider value={{ language: "IT", setLanguage, t }}>
                {children}
            </LanguageContext.Provider>
        )
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}
