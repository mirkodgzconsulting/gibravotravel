"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import Image from "next/image"
import Script from "next/script"
import { useSearchParams } from "next/navigation"
import {
    Bus,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    MapPinned,
    MessageCircle,
    Sparkles,
    Star,
    Users,
} from "lucide-react"
import { Button } from "@/components/website/ui/button"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/website/ui/carousel"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import { trackWhatsAppClick } from "@/lib/website/marketing-events"
import { buildWhatsAppUrl } from "@/lib/website/whatsapp"

const WHATSAPP_PHONE = "393519788531"
const BASE_WHATSAPP_MESSAGE =
    "Ciao GiBravo! Voglio prenotare il Summer Tour Liguria. Potete inviarmi disponibilita e dettagli?"

const TIKTOK_VIDEO_URL =
    "https://www.tiktok.com/@gibravotravel/video/7544036337565863190"
const TIKTOK_VIDEO_ID = "7544036337565863190"

const campaignAssets = {
    heroImage: "/tour-liguria-funnel/tour-liguriahero.webp",
    promoPoster: "/tour-liguria-funnel/tour-liguria01.webp",
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

const heroVariants = {
    a: {
        title: "Summer Tour Liguria: la tua domenica perfetta al mare",
        subtitle:
            "Parti in bus al mattino, vivi 9 ore di mare e torni in serata con zero stress e un gruppo super.",
    },
    b: {
        title: "Vivi l estate al massimo con GiBravo Travel",
        subtitle:
            "Bergeggi, Spotorno, Noli, Varigotti: ogni weekend una nuova giornata tra sole, mare e divertimento.",
    },
}

const instantBenefits = [
    
    "Pullman GT A/R incluso",
    "Coordinatore GiBravo",
]

const socialProofStats = [
    { value: "1200+", label: "Viaggiatori partiti con noi" },
    { value: "4.9/5", label: "Media recensioni esperienza" },
    { value: "Ogni weekend", label: "Partenze estive confermate" },
]

const timeline = [
    {
        time: "Mattino presto",
        title: "Partenza dai punti di ritrovo",
        text: "Check-in rapido, gruppo pronto e partenza in pullman GT.",
    },
    {
        time: "Meta mattina",
        title: "Arrivo in localita",
        text: "Ingresso libero in spiaggia, passeggiata o colazione vista mare.",
    },
    {
        time: "Giornata intera",
        title: "9 ore di mare e relax",
        text: "Sole, foto, divertimento e tempo per vivere la destinazione come vuoi.",
    },
    {
        time: "Ore 19:00 circa",
        title: "Ripartenza",
        text: "Rientro comodo in serata con il gruppo e il coordinatore.",
    },
]

const includeItems = [
    "Viaggio A/R in pullman GT",
    "Coordinatore di viaggio dedicato",
    "Gruppo giovane e divertente",
    "9 ore di mare e tempo libero",
    "Assistenza organizzativa prima e durante la partenza",
]

const whyChooseUs = [
    "Partenze da piu punti (Milano, Bergamo e dintorni)",
    "Conosci nuove persone in un ambiente positivo",
    "Viaggio organizzato = zero stress",
    "Atmosfera di gruppo che rende il tour memorabile",
    "Prezzo accessibile con promo a tempo",
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

const testimonials = [
    {
        quote:
            "Giornata stupenda, organizzazione perfetta. Puntuali e super disponibili dall inizio alla fine.",
        author: "Martina R.",
    },
    {
        quote:
            "Sono partita da sola e ho trovato un gruppo bellissimo. Esperienza top, la rifaccio subito.",
        author: "Sonia P.",
    },
    {
        quote:
            "Pullman comodo, mare stupendo e coordinatore impeccabile. Qualita prezzo altissima.",
        author: "Luca M.",
    },
]

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

const sectionAnchors = [
    { id: "offerta", label: "Offerta" },
    { id: "programma", label: "Programma" },
    { id: "partenze", label: "Partenze" },
]

type CtaProps = {
    section: string
    placement: string
    children: ReactNode
    className?: string
}

function WhatsAppCta({ section, placement, children, className }: CtaProps) {
    const href = useMemo(
        () =>
            buildWhatsAppUrl({
                phoneNumber: WHATSAPP_PHONE,
                baseMessage: BASE_WHATSAPP_MESSAGE,
                section,
            }),
        [section],
    )

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
                trackWhatsAppClick({
                    section,
                    placement,
                    ctaText: "Prenota ora su WhatsApp",
                    href,
                })
            }
            className={className}
        >
            {children}
        </a>
    )
}

export function SummerTourLiguriaClient() {
    const searchParams = useSearchParams()
    const variantKey = searchParams.get("v") === "b" ? "b" : "a"
    const heroCopy = heroVariants[variantKey]

    return (
        <main className="min-h-screen bg-[#f4f8ff] pb-24">
            <Script src="https://www.tiktok.com/embed.js" strategy="afterInteractive" />
            <section className="relative overflow-hidden border-b border-white/20">
                <div className="absolute inset-0">
                    <Image
                        src={campaignAssets.heroImage}
                        alt="Summer Tour Liguria con GiBravo Travel"
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-[#0a2e68]/45 to-black/50" />
                </div>

                <div className="relative container mx-auto px-4 pb-20 pt-36 md:pb-24 md:pt-44">
                    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
                        <RevealOnScroll>
                            <div className="max-w-3xl text-white">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur md:text-sm">
                                    <Sparkles className="h-4 w-4 text-[#ffd066]" />
                                    Offerta estate 2026 - posti limitati ogni weekend
                                </div>

                                <h1 className="text-4xl font-[800] leading-[1.06] tracking-tight md:text-6xl">
                                    {heroCopy.title}
                                </h1>

                                <p className="mt-5 max-w-2xl text-lg text-white/95 md:text-2xl">
                                    {heroCopy.subtitle}
                                </p>

                                <div className="mt-7 grid gap-2 text-sm md:grid-cols-2 md:text-base">
                                    {instantBenefits.map((benefit) => (
                                        <div
                                            key={benefit}
                                            className="flex items-start gap-2 rounded-xl bg-white/10 px-3 py-2"
                                        >
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#ffd066]" />
                                            <span className="font-semibold">{benefit}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <WhatsAppCta section="hero" placement="hero-primary">
                                        <Button className="h-12 px-7 text-base md:h-14 md:px-9 md:text-lg">
                                            <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                                            Prenota ora su WhatsApp
                                        </Button>
                                    </WhatsAppCta>

                                    <a
                                        href="#partenze"
                                        className="inline-flex h-12 items-center justify-center rounded-full border border-white/50 px-6 text-sm font-bold text-white transition hover:bg-white/10 md:h-14 md:text-base"
                                    >
                                        Vedi date disponibili
                                    </a>
                                </div>

                                <p className="mt-4 text-sm font-semibold text-[#ffdca1] md:text-base">
                                    Promo attiva: 40EUR invece di 45EUR fino al 15 maggio.
                                </p>
                            </div>
                        </RevealOnScroll>

                        <RevealOnScroll delay={120}>
                            <aside className="rounded-3xl border border-white/30 bg-white/10 p-4 text-white shadow-2xl backdrop-blur">
                                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                                    <Image
                                        src={campaignAssets.promoPoster}
                                        alt="Locandina Summer Tour Liguria"
                                        fill
                                        sizes="(max-width: 1024px) 70vw, 360px"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="mt-4 rounded-2xl bg-[#001a45]/65 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ffd066]">
                                        Offerta flash
                                    </p>
                                    <p className="mt-2 text-3xl font-[900] leading-none">40EUR</p>
                                    <p className="text-sm text-white/90">invece di 45EUR a persona</p>
                                </div>
                            </aside>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            <section className="bg-[#0a3f95] py-5">
                <div className="container mx-auto grid max-w-6xl gap-3 px-4 md:grid-cols-3">
                    {sectionAnchors.map((anchor) => (
                        <a
                            key={anchor.id}
                            href={`#${anchor.id}`}
                            className="rounded-full border border-white/25 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-white/10"
                        >
                            {anchor.label}
                        </a>
                    ))}
                </div>
            </section>

            <section id="offerta" className="bg-white py-8">
                <div className="container mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-3">
                    {socialProofStats.map((item) => (
                        <RevealOnScroll key={item.label}>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-center shadow-sm">
                                <p className="text-2xl font-[900] text-[#0b4aa7] md:text-3xl">{item.value}</p>
                                <p className="mt-1 text-sm font-semibold text-slate-600">{item.label}</p>
                            </div>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>

            <section className="bg-white py-12 md:py-14">
                <div className="container mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <RevealOnScroll>
                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0b4aa7]">
                                Video prova sociale
                            </p>
                            <div className="rounded-2xl border border-slate-200 bg-white p-2">
                                <blockquote
                                    className="tiktok-embed !my-0 !min-w-0"
                                    cite={TIKTOK_VIDEO_URL}
                                    data-video-id={TIKTOK_VIDEO_ID}
                                    style={{ maxWidth: "605px", minWidth: "325px", margin: "0 auto" }}
                                >
                                    <section>
                                        <a
                                            target="_blank"
                                            rel="noreferrer"
                                            href={TIKTOK_VIDEO_URL}
                                        >
                                            Guarda il video su TikTok
                                        </a>
                                    </section>
                                </blockquote>
                            </div>
                            <p className="mt-4 text-base font-semibold text-slate-700 md:text-lg">
                                Non e solo un viaggio: e un esperienza da vivere insieme.
                            </p>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={100}>
                        <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#0b4aa7]">
                                Foto reali Summer Tour
                            </p>
                            <Carousel opts={{ align: "start", loop: true }} className="w-full">
                                <CarouselContent>
                                    {campaignAssets.gallery.map((src, index) => (
                                        <CarouselItem key={src} className="basis-full">
                                            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                                                <Image
                                                    src={src}
                                                    alt={`Summer Tour Liguria 2025 - foto ${index + 1}`}
                                                    fill
                                                    sizes="(max-width: 1024px) 90vw, 540px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-3 top-1/2 z-10 -translate-y-1/2 border-none bg-white/80 text-slate-800 hover:bg-white" />
                                <CarouselNext className="right-3 top-1/2 z-10 -translate-y-1/2 border-none bg-white/80 text-slate-800 hover:bg-white" />
                            </Carousel>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            <section id="programma" className="py-14">
                <div className="container mx-auto grid max-w-6xl gap-8 px-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <RevealOnScroll>
                        <div className="rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-100">
                            <h2 className="text-3xl font-[800] text-[#0c2f6f] md:text-4xl">
                                Programma della giornata
                            </h2>
                            <div className="mt-6 space-y-4">
                                {timeline.map((step) => (
                                    <div
                                        key={step.title}
                                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                                    >
                                        <p className="text-xs font-bold uppercase tracking-wide text-[#0b4aa7]">
                                            {step.time}
                                        </p>
                                        <h3 className="mt-1 text-lg font-[800] text-slate-900">{step.title}</h3>
                                        <p className="mt-1 text-sm text-slate-600">{step.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </RevealOnScroll>

                    <RevealOnScroll delay={100}>
                        <div className="space-y-5 rounded-3xl bg-[#0b3f96] p-7 text-white shadow-lg">
                            <h3 className="text-2xl font-[800]">Cosa include la tua quota</h3>
                            {includeItems.map((item) => (
                                <div key={item} className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#ffd066]" />
                                    <p className="text-white/95">{item}</p>
                                </div>
                            ))}

                                

                            <h3 className="pt-2 text-2xl font-[800]">Perche scegliere GiBravo</h3>
                            {whyChooseUs.map((reason) => (
                                <div key={reason} className="flex items-start gap-2">
                                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[#ffd066]" />
                                    <p className="text-white/95">{reason}</p>
                                </div>
                            ))}
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            <section id="partenze" className="bg-white py-14">
                <div className="container mx-auto max-w-6xl px-4">
                    <RevealOnScroll>
                        <h2 className="text-center text-3xl font-[800] text-[#0c2f6f] md:text-4xl">
                            Prossime partenze estate 2026
                        </h2>
                        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
                            Ogni weekend verso Bergeggi, Spotorno, Noli, Varigotti, Finale Ligure e Albisola.
                        </p>
                    </RevealOnScroll>

                    <div className="mt-8 grid gap-3 md:grid-cols-2">
                        {departures.map((departure, index) => (
                            <RevealOnScroll key={departure} delay={Math.min(index * 30, 250)}>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                    <CalendarDays className="h-5 w-5 flex-none text-[#0b4aa7]" />
                                    <span className="font-semibold text-slate-800">{departure}</span>
                                </div>
                            </RevealOnScroll>
                        ))}
                    </div>

                    <div className="mt-8 grid gap-4 rounded-3xl bg-[#0a3f95] p-6 text-white md:grid-cols-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-[#ffd066]" />
                            <span>Partenze da Milano/Bergamo</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bus className="h-5 w-5 text-[#ffd066]" />
                            <span>Pullman GT confortevole</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-[#ffd066]" />
                            <span>Gruppo coordinato e social</span>
                        </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-[#0a3f95]">
                            <MapPinned className="h-5 w-5" />
                            <p className="font-[800]">Punti di ritrovo principali</p>
                        </div>
                        <div className="grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
                            {departureCities.map((city) => (
                                <div key={city} className="rounded-xl bg-white px-3 py-2">
                                    {city}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-14">
                <div className="container mx-auto max-w-6xl px-4">
                    <RevealOnScroll>
                        <div className="rounded-3xl bg-gradient-to-r from-[#003ea3] to-[#0d58c7] p-8 text-white shadow-xl md:p-10">
                            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#ffd066]">
                                <Sparkles className="h-4 w-4" />
                                Offerta speciale
                            </p>
                            <h2 className="mt-2 text-3xl font-[800] md:text-5xl">
                                Prenota entro il 15 maggio: 40EUR
                            </h2>
                            <p className="mt-2 text-base text-white/90 md:text-lg">
                                Da 45EUR a 40EUR per persona. Dopo la scadenza si torna alla tariffa piena.
                            </p>

                            <div className="mt-6 flex flex-wrap gap-4">
                                <WhatsAppCta section="offer" placement="offer-primary">
                                    <Button className="h-12 bg-white px-7 text-base font-[800] text-[#003ea3] hover:bg-white/90 md:h-14 md:text-lg">
                                        <MessageCircle className="h-4 w-4" />
                                        Prenota ora su WhatsApp
                                    </Button>
                                </WhatsAppCta>
                                <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
                                    <Clock3 className="h-4 w-4" />
                                    Posti limitati ogni settimana
                                </p>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            <section id="recensioni" className="bg-white py-14">
                <div className="container mx-auto max-w-6xl px-4">
                    <RevealOnScroll>
                        <h2 className="text-center text-3xl font-[800] text-[#0c2f6f] md:text-4xl">
                            Cosa dicono i viaggiatori
                        </h2>
                    </RevealOnScroll>
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        {testimonials.map((item, index) => (
                            <RevealOnScroll key={item.author} delay={index * 80}>
                                <article className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                    <div className="mb-2 flex items-center gap-1 text-[#ff9f1a]">
                                        <Star className="h-4 w-4 fill-current" />
                                        <Star className="h-4 w-4 fill-current" />
                                        <Star className="h-4 w-4 fill-current" />
                                        <Star className="h-4 w-4 fill-current" />
                                        <Star className="h-4 w-4 fill-current" />
                                    </div>
                                    <p className="text-slate-700">{item.quote}</p>
                                    <p className="mt-3 font-[800] text-[#0b4aa7]">{item.author}</p>
                                </article>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-14">
                <div className="container mx-auto max-w-4xl px-4">
                    <RevealOnScroll>
                        <h2 className="text-center text-3xl font-[800] text-[#0c2f6f] md:text-4xl">
                            Domande frequenti
                        </h2>
                    </RevealOnScroll>
                    <div className="mt-7 space-y-3">
                        {faqItems.map((item, index) => (
                            <RevealOnScroll key={item.q} delay={index * 60}>
                                <details className="rounded-2xl border border-slate-200 bg-white p-4">
                                    <summary className="cursor-pointer list-none font-[700] text-slate-800">
                                        {item.q}
                                    </summary>
                                    <p className="pt-2 text-slate-600">{item.a}</p>
                                </details>
                            </RevealOnScroll>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-[#0a3f95] py-14 text-white">
                <div className="container mx-auto max-w-5xl px-4 text-center">
                    <RevealOnScroll>
                        <h2 className="text-3xl font-[800] md:text-5xl">
                            Non rimandare: i posti finiscono in fretta
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
                            Scrivici ora su WhatsApp, blocca il tuo posto e preparati a vivere la tua estate migliore in Liguria.
                        </p>
                        <div className="mt-8">
                            <WhatsAppCta section="final-cta" placement="final-primary">
                                <Button className="h-12 px-8 text-base md:h-14 md:text-lg">
                                    <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                                    Blocca ora il tuo posto su WhatsApp
                                </Button>
                            </WhatsAppCta>
                        </div>
                        <p className="mt-4 text-sm text-white/80">
                            Rispondiamo in tempi rapidi con disponibilita reali e conferma prenotazione.
                        </p>
                    </RevealOnScroll>
                </div>
            </section>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
                <WhatsAppCta section="sticky-mobile" placement="sticky-bottom-mobile" className="block">
                    <Button className="h-12 w-full text-base">
                        <MessageCircle className="h-4 w-4" />
                        Blocca ora il tuo posto su WhatsApp
                    </Button>
                </WhatsAppCta>
            </div>
        </main>
    )
}
