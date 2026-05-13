"use client"

import Image from "next/image"
import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { useMemo } from "react"
import { trackWhatsAppClick } from "@/lib/website/marketing-events"
import { buildWhatsAppUrl } from "@/lib/website/whatsapp"
import "./liguria-landing.css"

const WHATSAPP_PHONE = "393519788531"
const BASE_WHATSAPP_MESSAGE =
    "Ciao GiBravo! Voglio prenotare il Summer Tour Liguria. Potete inviarmi disponibilita e dettagli?"

/** ID video TikTok — player v1 (solo riproduzione, senza descrizione sotto). */
const TIKTOK_EMBED_VIDEO_IDS = [
    "7529922473836481814",
    "7527327110701108502",
    "7513234050094566678",
    "7519881034884828438", // vm.tiktok.com/ZNRgXr9pk/
] as const

function tiktokPlayerEmbedSrc(videoId: string) {
    const q = new URLSearchParams({
        description: "0",
        music_info: "0",
        rel: "0",
    })
    return `https://www.tiktok.com/player/v1/${videoId}?${q.toString()}`
}

const SOCIAL = {
    instagram: "https://www.instagram.com/gibravo.travel",
    facebook: "https://www.facebook.com/GiBravoTravelAgenzia",
    tiktok: "https://www.tiktok.com/@gibravotravel",
} as const

const campaignAssets = {
    heroImage: "/herolan.webp",
    gallery: [
        "/tour-liguria-funnel/tour-liguria01.webp",
        "/tour-liguria-funnel/tour-liguria02.webp",
        "/tour-liguria-funnel/tour-liguria03.webp",
        "/tour-liguria-funnel/tour-liguria04.webp",
        "/tour-liguria-funnel/tour-liguria05.webp",
        "/tour-liguria-funnel/tour-liguria06.webp",
        "/tour-liguria-funnel/tour-liguria07.webp",
    ],
}

type FeatBarIconName = "bus" | "person" | "clock" | "group" | "camera"

const featuresBar: { id: string; line1: string; line2: string; icon: FeatBarIconName }[] = [
    { id: "bus", line1: "VIAGGIO A/R", line2: "PULLMAN GT", icon: "bus" },
    { id: "coord", line1: "COORDINATORE", line2: "DI VIAGGIO", icon: "person" },
    { id: "mare", line1: "9 ORE DI MARE", line2: "GARANTITE", icon: "clock" },
    { id: "gruppo", line1: "GRUPPO GIOVANE", line2: "E DIVERTENTE", icon: "group" },
    { id: "ricordi", line1: "RICORDI CHE DURANO", line2: "PER SEMPRE", icon: "camera" },
]

function FeatBarIcon({ name }: { name: FeatBarIconName }) {
    /* Spessore medio sul viewBox 24 (scala con l'icona) */
    const stroke = 0.82
    const common = { fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
    switch (name) {
        case "bus":
            return (
                <svg className="feat-bar-svg" viewBox="0 0 24 24" aria-hidden>
                    <rect x="3" y="6" width="18" height="11" rx="1.5" {...common} />
                    <path d="M6 6V4.5h12V6M5 10h14" {...common} />
                    <circle cx="7.5" cy="18.5" r="1.8" {...common} />
                    <circle cx="16.5" cy="18.5" r="1.8" {...common} />
                    <path d="M9.5 18.5h5" {...common} />
                </svg>
            )
        case "person":
            return (
                <svg className="feat-bar-svg" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="8" r="3.5" {...common} />
                    <path d="M5.5 20.5c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6" {...common} />
                </svg>
            )
        case "clock":
            return (
                <svg className="feat-bar-svg" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="12" r="9" {...common} />
                    <path d="M12 7v5.5l3.5 2" {...common} />
                </svg>
            )
        case "group":
            return (
                <svg className="feat-bar-svg" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="6" cy="9" r="2.2" {...common} />
                    <path d="M3 19c0-2.2 1.6-3.5 3-3.5s3 1.3 3 3.5" {...common} />
                    <circle cx="12" cy="7.5" r="2.5" {...common} />
                    <path d="M8 19c0-2.4 1.8-4 4-4s4 1.6 4 4" {...common} />
                    <circle cx="18" cy="9" r="2.2" {...common} />
                    <path d="M15 19c0-2.2 1.6-3.5 3-3.5s3 1.3 3 3.5" {...common} />
                </svg>
            )
        case "camera":
            return (
                <svg className="feat-bar-svg" viewBox="0 0 24 24" aria-hidden>
                    <path d="M4 9.5h3l1.5-2h7l1.5 2h3a1.5 1.5 0 011.5 1.5v8A1.5 1.5 0 0119.5 20h-15A1.5 1.5 0 013 18.5v-8A1.5 1.5 0 014.5 9z" {...common} />
                    <circle cx="12" cy="15" r="3.5" {...common} />
                </svg>
            )
        default:
            return null
    }
}

type WhyIconName = "pin" | "people" | "sun" | "shield" | "thumb" | "camera"

function WhyGridIcon({ name }: { name: WhyIconName }) {
    const sw = 1.2
    const c = {
        fill: "none" as const,
        stroke: "currentColor",
        strokeWidth: sw,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
    }
    switch (name) {
        case "pin":
            return (
                <svg className="why-grid-svg" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 21.5s7.5-5.8 7.5-11.5a7.5 7.5 0 10-15 0c0 5.7 7.5 11.5 7.5 11.5z" {...c} />
                    <circle cx="12" cy="10" r="2.2" {...c} />
                </svg>
            )
        case "people":
            return (
                <svg className="why-grid-svg" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="7" cy="9" r="2" {...c} />
                    <path d="M4 18c0-2 1.8-3.5 3-3.5s3 1.5 3 3.5" {...c} />
                    <circle cx="12" cy="7.5" r="2.3" {...c} />
                    <path d="M8 18c0-2.2 1.8-3.8 4-3.8s4 1.6 4 3.8" {...c} />
                    <circle cx="17" cy="9" r="2" {...c} />
                    <path d="M14 18c0-2 1.8-3.5 3-3.5s3 1.5 3 3.5" {...c} />
                </svg>
            )
        case "sun":
            return (
                <svg className="why-grid-svg" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="12" r="4.5" {...c} />
                    <path
                        d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M5.2 18.8l1.6-1.6M17.2 6.8l1.6-1.6"
                        {...c}
                    />
                </svg>
            )
        case "shield":
            return (
                <svg className="why-grid-svg" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 3l7.5 3.5V11c0 4.2-2.8 8.2-7.5 9.5C7.3 19.2 4.5 15.2 4.5 11V6.5L12 3z" {...c} />
                    <path d="M9 11.5l2 2 4.5-5" {...c} />
                </svg>
            )
        case "thumb":
            return (
                <svg className="why-grid-svg" viewBox="0 0 24 24" aria-hidden>
                    <path d="M8 10v9M8 10H6a1.5 1.5 0 00-1.5 1.5V18A1.5 1.5 0 006 19.5h2" {...c} />
                    <path
                        d="M8 10h3l4.5-1.5a1.8 1.8 0 012.2 1.1l1 3.2a2 2 0 01-.4 1.8L16 17h-5"
                        {...c}
                    />
                    <path d="M16 17v2.5" {...c} />
                </svg>
            )
        case "camera":
            return (
                <svg className="why-grid-svg" viewBox="0 0 24 24" aria-hidden>
                    <path d="M4 9.5h3l1.5-2h7l1.5 2h3a1.5 1.5 0 011.5 1.5v8A1.5 1.5 0 0119.5 20h-15A1.5 1.5 0 013 18.5v-8A1.5 1.5 0 014.5 9z" {...c} />
                    <circle cx="12" cy="15" r="3.2" {...c} />
                </svg>
            )
        default:
            return null
    }
}

function DestPinIcon() {
    return (
        <svg className="dest-pin-icon" viewBox="0 0 24 24" aria-hidden width="15" height="15">
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21.5s7.5-5.8 7.5-11.5a7.5 7.5 0 10-15 0c0 5.7 7.5 11.5 7.5 11.5z"
            />
            <circle cx="12" cy="10" r="2" fill="currentColor" />
        </svg>
    )
}

const expCollageAlts = [
    "Gruppo GiBravo sul pullman verso il mare",
    "Divertimento in spiaggia Summer Tour Liguria",
    "Bagno e relax nel mare della Liguria",
    "Momenti e tramonti sui viaggi GiBravo",
] as const

const experienceChecks = [
    "Immagina di partire al mattino senza stress... Salire sul pullman, conoscere nuove persone e arrivare davanti al mare.",
    "Una giornata fatta di sole, risate, relax e momenti che ti resteranno dentro.",
    "Con GiBravo Travel non sei solo un cliente... sei parte del gruppo.",
]

const whyCards: { id: string; icon: WhyIconName; name: string; desc: string }[] = [
    {
        id: "cities",
        icon: "pin",
        name: "PARTENZE DA PIÙ CITTÀ",
        desc: "Bergamo, Trezzo, Agrate Brianza, Cologno Centro, Lambrate",
    },
    {
        id: "people",
        icon: "people",
        name: "CONOSCI NUOVE PERSONE",
        desc: "Viaggia, socializza e crea nuove amicizie.",
    },
    {
        id: "atmo",
        icon: "sun",
        name: "ATMOSFERA UNICA",
        desc: "Divertimento, musica e complicità di gruppo.",
    },
    {
        id: "org",
        icon: "shield",
        name: "ORGANIZZAZIONE TOP",
        desc: "Pensiamo a tutto noi, tu devi solo goderti la giornata!",
    },
    {
        id: "price",
        icon: "thumb",
        name: "PREZZI ACCESSIBILI",
        desc: "Qualità, sicurezza e convenienza sempre garantite.",
    },
    {
        id: "mem",
        icon: "camera",
        name: "RICORDI INDIMENTICABILI",
        desc: "Ogni viaggio è un ricordo che porterai nel cuore.",
    },
]

const destinations: { place: string; src: string }[] = [
    { place: "BERGEGGI", src: campaignAssets.gallery[0]! },
    { place: "SPOTORNO", src: campaignAssets.gallery[1]! },
    { place: "NOLI", src: campaignAssets.gallery[2]! },
    { place: "VARIGOTTI", src: campaignAssets.gallery[3]! },
    { place: "FINALE LIGURE", src: campaignAssets.gallery[4]! },
    { place: "ALBISOLA MARINA", src: campaignAssets.gallery[5]! },
]

const departures = [
    "Domenica 28 Giugno - Bergeggi",
    "Domenica 05 Luglio - Spotorno",
    "Domenica 12 Luglio - Noli",
    "Domenica 19 Luglio - Varigotti",
    "Domenica 26 Luglio - Finale Ligure",
    "Domenica 02 Agosto - Spotorno",
    "Sabato 08 Agosto - Albisola Marina",
    "Domenica 09 Agosto - Varigotti",
    "Ferragosto 15 Agosto - Noli / Finale Ligure",
    "Domenica 16 Agosto - Spotorno",
    "Sabato 22 Agosto - Bergeggi",
    "Domenica 23 Agosto - Albisola Marina",
    "Domenica 30 Agosto - Noli",
]

const departureCities = [
    "Bergamo Malpensa",
    "Trezzo sull Adda",
    "Agrate Brianza",
    "Cologno Centro",
    "Lambrate Stazione",
]

const testimonials: {
    initials: string
    avatarStyle: CSSProperties | undefined
    name: string
    text: string
}[] = [
    {
        initials: "MG",
        avatarStyle: undefined,
        name: "Martina G.",
        text: "Giornata stupenda! Organizzazione perfetta e gruppo fantastico. Tornerò sicuramente!",
    },
    {
        initials: "LR",
        avatarStyle: { background: "var(--yellow)", color: "var(--blue-dark)" } as CSSProperties,
        name: "Luca R.",
        text: "È il modo migliore per disconnettersi dalla routine e passare una giornata indimenticabile!",
    },
    {
        initials: "SP",
        avatarStyle: { background: "var(--pink)", color: "#fff" } as CSSProperties,
        name: "Sara P.",
        text: "Nuove amicizie, posti meravigliosi e zero pensieri. GiBravo Travel è una garanzia!",
    },
]

const reviewsCollageSrc: [string, string] = [campaignAssets.gallery[2]!, campaignAssets.gallery[5]!]

function ReviewStarsRow() {
    return (
        <div className="review-stars-row" aria-label="Valutazione 5 su 5">
            {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} className="review-star-svg" viewBox="0 0 24 24" aria-hidden width="17" height="17">
                    <path
                        fill="currentColor"
                        d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.9 5.8 21.1 7 14.2l-5-4.9 6.9-1L12 2z"
                    />
                </svg>
            ))}
        </div>
    )
}

function ReviewsTitleHeartIcon() {
    return (
        <svg className="reviews-title-heart-svg" viewBox="0 0 24 24" aria-hidden width="28" height="28">
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinejoin="round"
                d="M12 20.5s-6.8-4.6-6.8-9.6A4.3 4.3 0 0112 6.2a4.3 4.3 0 016.8 4.7c0 5-6.8 9.6-6.8 9.6z"
            />
        </svg>
    )
}

/** Corazón decorativo (footer). */
function HeroHeartIcon({ className, size = 40 }: { className?: string; size?: number }) {
    return (
        <svg className={className} viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden>
            <path
                d="M32 54C32 54 8 38 8 22c0-8 6-14 14-14 5 0 10 3 10 8 0-5 5-8 10-8 8 0 14 6 14 14 0 16-24 32-24 32z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function FooterPhoneIcon() {
    return (
        <svg className="footer-contact-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.44 12.44 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.44 12.44 0 002.81.7A2 2 0 0122 16.92z"
            />
        </svg>
    )
}

function FooterSocialIcon({ src }: { src: string }) {
    return (
        <Image
            src={src}
            alt=""
            width={22}
            height={22}
            className="footer-social-img"
            sizes="22px"
            aria-hidden
        />
    )
}

const faqItems = [
    {
        q: "Quanto dura il tour?",
        a: "Partenza al mattino presto, circa 9 ore in localita e rientro in serata.",
    },
    {
        q: "Posso partire anche se sono da solo?",
        a: "Si. Molti viaggiatori partono da soli e conoscono nuove persone durante il tour.",
    },
    {
        q: "Come prenoto il mio posto?",
        a: "Clicca sul bottone WhatsApp. Ti rispondiamo con disponibilita, punto di partenza e conferma rapida.",
    },
    {
        q: "L offerta da 40EUR e valida sempre?",
        a: "No. E una promo limitata con scadenza e disponibilita ridotta.",
    },
]

const heroSubByVariant = {
    a: "Viaggi di gruppo in pullman verso le migliori destinazioni della Liguria.\nMare, relax, divertimento e nuove amicizie...",
    b: "Bergeggi, Spotorno, Noli, Varigotti: ogni weekend una nuova giornata tra sole, mare e divertimento.",
} as const

type Variant = "a" | "b"

function WaIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    )
}

function WhatsAppLink({
    section,
    placement,
    className,
    style,
    children,
    ctaText = "WhatsApp",
}: {
    section: string
    placement: string
    className?: string
    style?: CSSProperties
    children: ReactNode
    ctaText?: string
}) {
    const href = useMemo(
        () =>
            buildWhatsAppUrl({
                phoneNumber: WHATSAPP_PHONE,
                baseMessage: BASE_WHATSAPP_MESSAGE,
                section,
            }),
        [section]
    )
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            style={style}
            onClick={() =>
                trackWhatsAppClick({
                    section,
                    placement,
                    ctaText,
                    href,
                })
            }
        >
            {children}
        </a>
    )
}

interface SummerTourLiguriaClientProps {
    variant?: Variant
}

export function SummerTourLiguriaClient({ variant = "a" }: SummerTourLiguriaClientProps) {
    const v: Variant = variant === "b" ? "b" : "a"
    const heroSub = heroSubByVariant[v]

    return (
        <main id="liguria-offer-root">
            <section className="hero">
                <div className="hero-left">
                    <div className="hero-brand-badge-wrap">
                        <Link href="/" className="hero-logo">
                            <Image
                                src="/Logo_gibravo.svg"
                                alt="GiBravo Travel"
                                width={200}
                                height={56}
                                priority
                                className="hero-logo-img"
                            />
                        </Link>
                    </div>
                    <h1 className="hero-title">
                        <span className="hero-title-line hero-title-line--blue">VIVI L&apos;ESTATE</span>
                        <span className="hero-title-line hero-title-line--yellow">AL MASSIMO</span>
                    </h1>
                    <div className="hero-sub-row">
                        <p className="hero-sub">{heroSub}</p>
                    </div>
                    <WhatsAppLink
                        section="hero"
                        placement="hero-flyer"
                        className="hero-flyer-wa-link"
                        ctaText="Hero flyer WhatsApp"
                    >
                        <Image
                            src="/flyer3.webp"
                            alt="Tutto in un solo giorno — Prenota ora su WhatsApp"
                            width={800}
                            height={360}
                            className="hero-flyer-wa-img"
                            priority
                            sizes="(max-width: 900px) min(92vw, 460px), min(100%, 460px)"
                        />
                    </WhatsAppLink>
                    <p className="hero-wa-note">Posti limitati ogni settimana!</p>
                </div>
                <div className="hero-right">
                    <Image
                        src={campaignAssets.heroImage}
                        alt="Gruppo GiBravo Travel in Liguria"
                        fill
                        priority
                        sizes="(max-width: 900px) 100vw, 50vw"
                        className="hero-hero-img"
                    />
                </div>
            </section>

            <div className="features-bar">
                {featuresBar.map((f) => (
                    <div key={f.id} className="feat-item" data-icon={f.icon}>
                        <span className="feat-icon-wrap" aria-hidden>
                            <FeatBarIcon name={f.icon} />
                        </span>
                        <span className="feat-text">
                            <span className="feat-line">{f.line1}</span>
                            <span className="feat-line">{f.line2}</span>
                        </span>
                    </div>
                ))}
            </div>

            <section className="exp-section">
                <div className="exp-left">
                    <div className="exp-title-block">
                        <div className="exp-title-copy">
                            <span className="exp-title-line exp-title-line--underline">NON È SOLO UN VIAGGIO...</span>
                            <span className="exp-title-line">
                                <em>È UN&apos;ESPERIENZA</em>
                            </span>
                            <span className="exp-title-line">DA VIVERE INSIEME</span>
                        </div>
                        <span className="exp-title-heart" aria-hidden>
                            <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
                                <path
                                    fill="none"
                                    d="M32 54C32 54 8 38 8 22c0-8 6-14 14-14 5 0 10 3 10 8 0-5 5-8 10-8 8 0 14 6 14 14 0 16-24 32-24 32z"
                                    stroke="#e63946"
                                    strokeWidth="2.2"
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>
                    </div>
                    <div className="exp-body">
                        {experienceChecks.map((t) => (
                            <p key={t} className="exp-para">
                                {t}
                            </p>
                        ))}
                    </div>
                    <p className="motto">SIAMO COMPAGNI DI VIAGGIO, NON SEMPLICI PASSEGGERI.</p>
                </div>
                <div className="exp-right">
                    <div className="exp-collage">
                        {[0, 1, 2, 3].map((idx) => (
                            <div key={idx} className={`exp-collage-card exp-collage-card--${idx + 1}`}>
                                <Image
                                    src={campaignAssets.gallery[idx]!}
                                    alt={expCollageAlts[idx]}
                                    fill
                                    sizes="(max-width: 900px) 45vw, 22vw"
                                    className="exp-fill-img"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="exp-tiktok-section" aria-labelledby="exp-tiktok-heading">
                <h2 id="exp-tiktok-heading" className="exp-tiktok-title">
                    GUARDA I NOSTRI VIAGGI SU TIKTOK
                </h2>
                <div className="exp-tiktok-embeds">
                    {TIKTOK_EMBED_VIDEO_IDS.map((videoId, i) => (
                        <div key={videoId} className="exp-tiktok-cell">
                            <iframe
                                src={tiktokPlayerEmbedSrc(videoId)}
                                title={`Video GiBravo Travel su TikTok (${i + 1})`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                loading="lazy"
                                className="exp-tiktok-iframe"
                            />
                        </div>
                    ))}
                </div>
            </section>

            <section className="two-col-section">
                <div className="two-col-col two-col-col--why">
                    <h2 className="col-heading">
                        <span className="col-heading-line">
                            <span className="col-heading-under">PERCHÉ</span> SCEGLIERE
                        </span>
                        <span className="col-heading-line">GIBRAVO TRAVEL?</span>
                    </h2>
                    <div className="why-grid">
                        {whyCards.map((c) => (
                            <div key={c.id} className="why-card">
                                <div className="why-card-icon" aria-hidden>
                                    <WhyGridIcon name={c.icon} />
                                </div>
                                <div className="why-card-name">{c.name}</div>
                                <div className="why-card-desc">{c.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="two-col-col two-col-col--dest">
                    <h2 className="col-heading">
                        <span className="col-heading-line">
                            <span className="col-heading-under">OGNI</span> WEEKEND
                        </span>
                        <span className="col-heading-line">UNA NUOVA DESTINAZIONE</span>
                    </h2>
                    <div className="dest-grid">
                        {destinations.map((d) => (
                            <div key={d.place} className="dest-card">
                                <Image
                                    src={d.src}
                                    alt={d.place}
                                    fill
                                    sizes="(max-width: 900px) 45vw, 18vw"
                                    className="dest-fill-img"
                                />
                                <div className="dest-label">
                                    <DestPinIcon />
                                    <span>{d.place}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="dest-tagline-row">
                        <p className="dest-tagline">9 ORE DI MARE, RELAX E DIVERTIMENTO!</p>
                        <svg
                            className="dest-tagline-wave"
                            viewBox="0 0 64 24"
                            width="56"
                            height="22"
                            aria-hidden
                        >
                            <path
                                fill="none"
                                stroke="var(--blue)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 14c6-8 14-8 20 0s14 8 20 0 14-8 20 0"
                            />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Sezione "Prossime partenze estate 2026" temporaneamente disattivata
            <section id="partenze" className="liguria-extra-partenze">
                <h2>Prossime partenze estate 2026</h2>
                <p>Ogni weekend verso Bergeggi, Spotorno, Noli, Varigotti, Finale Ligure e Albisola.</p>
                <div className="liguria-partenze-grid">
                    {departures.map((d) => (
                        <div key={d} className="liguria-partenze-item">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="liguria-ritiro-wrap">
                    <p>Punti di ritrovo principali</p>
                    <div className="liguria-ritiro-grid">
                        {departureCities.map((city) => (
                            <span key={city} className="liguria-ritiro-chip">
                                {city}
                            </span>
                        ))}
                    </div>
                </div>
            </section>
            */}

            <section className="offer-banner" aria-label="Offerta Summer Tour Liguria">
                <WhatsAppLink
                    section="promo"
                    placement="offer-banner"
                    className="offer-banner-wa-link"
                    ctaText="Banner offerta WhatsApp"
                >
                    <Image
                        src="/flyer1.webp"
                        alt="Offerta speciale Summer Tour Liguria: promo, date e prezzo"
                        width={2320}
                        height={462}
                        className="offer-banner-img offer-banner-img--desktop"
                        sizes="100vw"
                        quality={90}
                    />
                    <Image
                        src="/flyer4.webp"
                        alt="Offerta speciale Summer Tour Liguria: promo, date e prezzo"
                        width={1200}
                        height={600}
                        className="offer-banner-img offer-banner-img--mobile"
                        sizes="100vw"
                        quality={90}
                        loading="lazy"
                        fetchPriority="low"
                    />
                </WhatsAppLink>
            </section>

            <section className="reviews-section reviews-scrapbook" aria-labelledby="reviews-scrapbook-heading">
                <h2 id="reviews-scrapbook-heading" className="reviews-scrapbook-title">
                    <span className="reviews-scrapbook-title-text">COSA DICONO DI NOI</span>
                    <ReviewsTitleHeartIcon />
                </h2>

                <div className="reviews-scrapbook-top">
                    <div className="reviews-scrapbook-cards">
                        {testimonials.map((t) => (
                            <article key={t.name} className="review-card review-card--scrap">
                                <div className="review-card-top">
                                    <div className="reviewer-avatar reviewer-avatar--scrap" style={t.avatarStyle}>
                                        {t.initials}
                                    </div>
                                    <p className="review-text review-text--scrap">&quot;{t.text}&quot;</p>
                                </div>
                                <div className="review-card-bottom">
                                    <span className="reviewer-name reviewer-name--scrap">{t.name}</span>
                                    <ReviewStarsRow />
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="reviews-collage" aria-hidden>
                        <div className="reviews-collage-hearts-bg" />
                        <div className="reviews-pol reviews-pol--back">
                            <span className="reviews-tape reviews-tape--tl" />
                            <span className="reviews-tape reviews-tape--br" />
                            <div className="reviews-pol-frame">
                                <Image
                                    src={reviewsCollageSrc[0]}
                                    alt=""
                                    width={260}
                                    height={195}
                                    className="reviews-pol-img"
                                    sizes="(max-width: 900px) 45vw, 260px"
                                />
                            </div>
                        </div>
                        <div className="reviews-pol reviews-pol--front">
                            <span className="reviews-tape reviews-tape--tr" />
                            <div className="reviews-pol-frame">
                                <Image
                                    src={reviewsCollageSrc[1]}
                                    alt=""
                                    width={260}
                                    height={195}
                                    className="reviews-pol-img"
                                    sizes="(max-width: 900px) 45vw, 260px"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA “NON ASPETTARE…” (franja bajo testimonios; no es el bloque de tarjetas) */}
                <div className="reviews-scrapbook-cta">
                    <svg
                        className="reviews-scrapbook-cta-wave"
                        viewBox="0 0 1440 72"
                        preserveAspectRatio="none"
                        aria-hidden
                    >
                        <path
                            fill="#eef0f4"
                            d="M0,38 C100,12 200,58 300,38 C400,18 500,62 600,38 C700,14 800,60 900,38 C1000,16 1100,58 1200,38 C1280,22 1360,48 1440,34 L1440,72 L0,72 Z"
                        />
                    </svg>
                    <div className="reviews-scrapbook-cta-inner">
                        <div className="reviews-scrapbook-cta-copy">
                            <p className="reviews-cta-line1">NON ASPETTARE... I POSTI FINISCONO OGNI SETTIMANA!</p>
                            <p className="reviews-cta-line2">PRENOTA ORA IL TUO POSTO!</p>
                        </div>
                        <div className="reviews-scrapbook-cta-wa">
                            <WhatsAppLink
                                section="reviews"
                                placement="reviews-cta"
                                className="reviews-cta-flyer-wa-link"
                                ctaText="Flyer WhatsApp CTA"
                            >
                                <Image
                                    src="/flyer2.webp"
                                    alt="Prenota su WhatsApp"
                                    width={900}
                                    height={300}
                                    className="reviews-cta-flyer-wa-img"
                                    sizes="(max-width: 900px) min(92vw, 400px), (max-width: 1320px) min(55vw, 420px), 380px"
                                />
                            </WhatsAppLink>
                        </div>
                    </div>
                </div>
            </section>

            <section className="liguria-faq">
                <h2>Domande frequenti</h2>
                {faqItems.map((item) => (
                    <details key={item.q}>
                        <summary>{item.q}</summary>
                        <p>{item.a}</p>
                    </details>
                ))}
            </section>

            <footer className="liguria-footer">
                <div className="footer-col footer-col--brand">
                    <Link href="/" className="footer-brand-link">
                        <Image
                            src="/Logo-GiBravo-TraciaoBianco.svg"
                            alt="GiBravo Travel"
                            width={406}
                            height={100}
                            className="hero-logo-img"
                        />
                    </Link>
                </div>
                <div className="footer-col footer-col--contact">
                    <p className="footer-col-heading">INFO &amp; PRENOTAZIONI</p>
                    <div className="footer-contact-row">
                        <a href="tel:+390282197645" className="footer-contact-link">
                            <FooterPhoneIcon />
                            <span>02 8219 7645</span>
                        </a>
                        <a
                            href={buildWhatsAppUrl({ phoneNumber: WHATSAPP_PHONE, baseMessage: BASE_WHATSAPP_MESSAGE })}
                            className="footer-contact-link"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <WaIcon className="footer-wa-ico" />
                            <span>351 978 8531</span>
                        </a>
                    </div>
                </div>
                <div className="footer-col footer-col--social">
                    <p className="footer-col-heading">SEGUICI SU</p>
                    <div className="footer-social-row">
                        <a href={SOCIAL.instagram} className="footer-social-btn" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                            <FooterSocialIcon src="/instagram.png" />
                        </a>
                        <a href={SOCIAL.facebook} className="footer-social-btn" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                            <FooterSocialIcon src="/facebook.png" />
                        </a>
                        <a href={SOCIAL.tiktok} className="footer-social-btn" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                            <FooterSocialIcon src="/tik-tok.png" />
                        </a>
                    </div>
                </div>
                <div className="footer-col footer-col--tagline">
                    <div className="footer-tagline-inner">
                        <p className="footer-tagline-text">
                            <span className="footer-tagline-line">LA TUA ESTATE</span>
                            <span className="footer-tagline-line">COMINCIA QUI!</span>
                        </p>
                        <HeroHeartIcon className="footer-hero-heart" size={44} />
                    </div>
                </div>
            </footer>

            <div className="liguria-sticky-wa">
                <WhatsAppLink section="sticky-mobile" placement="sticky-bottom" className="btn-wa" style={{ width: "100%", justifyContent: "center" }}>
                    <WaIcon className="wa-svg" />
                    PRENOTA SU WHATSAPP
                </WhatsAppLink>
            </div>
        </main>
    )
}
