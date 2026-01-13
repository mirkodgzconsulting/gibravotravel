
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma'; // Adjust import based on your project structure, e.g., '@/lib/db' or '@/lib/prisma'
import { Metadata } from 'next';
import Link from 'next/link';
import { TourItinerary } from '@/components/tour/TourItinerary';
import { TourFAQ } from '@/components/tour/TourFAQ';
import { TourStickyNav } from '@/components/tour/TourStickyNav';
import { TourOverview } from '@/components/tour/TourOverview';
import { TourHorizontalCard } from '@/components/tour/TourHorizontalCard';

// Simple Icons (Lucide-like SVG inline for zero-dep dependencies if needed, or lucide-react if installed)
// Assuming lucide-react is available based on previous context (XIcon etc used in Admin)
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    Star,
    CheckCircle2,
    XCircle,
    Info,
    ChevronDown,
    ChevronUp,
    Share2,
    Phone,
    Mail,
    FileText,
    HelpCircle
} from 'lucide-react';

interface TourPageProps {
    params: Promise<{
        slug: string;
    }>;
}

interface ItineraryItem {
    title: string;
    description: string;
}

interface FAQItem {
    question: string;
    answer: string;
}

// FORCE DYNAMIC to avoid static gen issues with slug param
export const dynamic = 'force-dynamic';

async function getTour(slug: string) {
    // 1. Try TourAereo
    // Use findFirst for case-insensitive slug match
    let tourAereo = await prisma.tourAereo.findFirst({
        where: {
            slug: { equals: slug, mode: 'insensitive' }
        },
        include: { creator: true }
    });

    if (!tourAereo) {
        // Fallback: Check by ID if slug lookup failed
        // IDs are case-sensitive/exact usually, so findUnique is fine, but safe to use findFirst if needed.
        // Keeping findUnique for ID as it's cleaner, but wrapping in try/catch if strictly compliant.
        tourAereo = await prisma.tourAereo.findUnique({
            where: { id: slug },
            include: { creator: true }
        });
    }

    if (tourAereo) return { ...tourAereo, type: 'aereo' };

    // 2. Try TourBus
    let tourBus = await prisma.tourBus.findFirst({
        where: {
            slug: { equals: slug, mode: 'insensitive' }
        },
        include: { creator: true }
    });

    if (!tourBus) {
        tourBus = await prisma.tourBus.findUnique({
            where: { id: slug },
            include: { creator: true }
        });
    }

    if (tourBus) return { ...tourBus, type: 'bus' };

    return null;
}

export async function generateMetadata({ params }: TourPageProps): Promise<Metadata> {
    const { slug } = await params;
    const tour = await getTour(slug);
    if (!tour) return { title: 'Tour non trovato' };

    return {
        title: `${tour.titulo} | Gibravo Travel`,
        description: tour.subtitulo || tour.descripcion?.slice(0, 160) || `Viaggia con noi in ${tour.titulo}`,
        openGraph: {
            images: tour.coverImage ? [tour.coverImage] : [],
        },
    };
}


async function getRelatedTours(excludedId: string, type: 'aereo' | 'bus') {
    const today = new Date();

    if (type === 'aereo') {
        const tours = await prisma.tourAereo.findMany({
            where: {
                id: { not: excludedId },
                isPublic: true,
                fechaViaje: { gte: today }
            },
            take: 3,
            orderBy: { fechaViaje: 'asc' },
            select: {
                id: true,
                slug: true,
                titulo: true,
                coverImage: true,
                galeria: true,
                fechaViaje: true,
                fechaFin: true,
                duracionTexto: true,
                precioAdulto: true,
                coordinadorNombre: true,
                coordinadorFoto: true,
                etiquetas: true
            }
        });
        return tours.map(t => ({ ...t, type: 'aereo' }));
    } else {
        const tours = await prisma.tourBus.findMany({
            where: {
                id: { not: excludedId },
                isPublic: true,
                fechaViaje: { gte: today }
            },
            take: 3,
            orderBy: { fechaViaje: 'asc' },
            select: {
                id: true,
                slug: true,
                titulo: true,
                coverImage: true,
                galeria: true,
                fechaViaje: true,
                fechaFin: true,
                duracionTexto: true,
                precioAdulto: true,
                coordinadorNombre: true,
                coordinadorFoto: true,
                etiquetas: true
            }
        });
        return tours.map(t => ({ ...t, type: 'bus' }));
    }
}

// Typeguard helpers or loose typing for shared fields
// Both models share most fields now thanks to the normalization
export default async function TourPage({ params }: TourPageProps) {
    const { slug } = await params;
    const tour = await getTour(slug);

    if (!tour) {
        notFound();
    }

    // Formatting helpers
    const formatDate = (d: Date | null) => {
        if (!d) return 'Data da definire';
        return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const calculateDays = (start: Date | null, end: Date | null) => {
        if (!start || !end) return null;
        const diff = end.getTime() - start.getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24)) + 1; // inclusive
        return days;
    };

    const daysCount = calculateDays(tour.fechaViaje, tour.fechaFin);


    // Fetch related tours
    const relatedTours = await getRelatedTours(tour.id, tour.type as 'aereo' | 'bus');

    // Safe parsing for Itinerary
    // It's defined as Json in Prisma, so standard TS treats it as 'any' or 'JsonValue'.
    // We know it's { title: string, description: string }[] based on previous tasks.
    const itinerary = Array.isArray(tour.itinerario) ? tour.itinerario as unknown as ItineraryItem[] : [];
    const gallery = Array.isArray(tour.galeria) ? tour.galeria as string[] : [];

    // Hero Image (Use cover or first gallery or placeholder)
    const heroImage = tour.coverImage || gallery[0] || '/images/placeholder-tour.jpg';

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* --- HERO SECTION --- */}
            <div className="relative h-[60vh] w-full">
                <Image
                    src={tour.webCoverImage || '/images/placeholder-tour.jpg'}
                    alt={tour.titulo}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-black/40" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 w-full p-6 md:p-12 text-white max-w-7xl mx-auto">

                    <h1 className="text-4xl md:text-6xl font-black mb-2 uppercase tracking-tight shadow-sm">
                        {tour.titulo}
                    </h1>
                    {tour.subtitulo && (
                        <p className="text-xl md:text-2xl font-light text-gray-200 max-w-2xl">
                            {tour.subtitulo}
                        </p>
                    )}
                </div>
            </div>

            {/* --- STICKY NAV --- */}
            <TourStickyNav />

            {/* --- MAIN CONTENT GRID --- */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 mt-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* LEFT COLUMN (Details) */}
                    <div className="lg:col-span-2 space-y-12">

                        {/* Consolidated Overview Section */}
                        <div className="border-b border-gray-100 pb-12">
                            <TourOverview
                                date={tour.fechaViaje}
                                duration={tour.duracionTexto}
                                daysCount={daysCount}
                                type={tour.type as 'aereo' | 'bus'}
                                description={tour.infoGeneral}
                                gallery={gallery}
                            />
                        </div>

                        {/* Dynamic Itinerary */}
                        <div className="border-b border-gray-100 pb-12">
                            <h2 className="text-2xl font-black text-[#004BA5] mb-8 uppercase tracking-tight">Itinerario di Viaggio</h2>
                            <TourItinerary itinerary={itinerary} />
                        </div>

                        {/* Inclusions / Exclusions - Clean Columns */}
                        <div id="incluso" className="scroll-mt-32 border-b border-gray-100 pb-12">
                            <h2 className="text-2xl font-black text-[#004BA5] mb-8 uppercase tracking-tight">Cosa è compreso</h2>
                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                                {/* Includes */}
                                <div>
                                    <h3 className="font-bold text-[#323232] mb-4 flex items-center gap-2 text-lg">
                                        <CheckCircle2 className="w-5 h-5 text-[#FE8008]" />
                                        La Quota Include
                                    </h3>
                                    <ul className="space-y-3">
                                        {(tour.incluye as string[] || []).map((item, i) => (
                                            <li key={i} className="flex gap-3 text-gray-600 text-sm leading-relaxed">
                                                <span className="w-1.5 h-1.5 bg-[#FE8008] rounded-full mt-2 flex-shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Excludes */}
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        La Quota Non Include
                                    </h3>
                                    <ul className="space-y-3">
                                        {(tour.noIncluye as string[] || []).map((item, i) => (
                                            <li key={i} className="flex gap-3 text-gray-600 text-sm leading-relaxed">
                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Coordinator - Minimalist */}
                        {tour.coordinadorNombre && (
                            <div id="coordinatore" className="scroll-mt-32 border-b border-gray-100 pb-12">
                                <h2 className="text-2xl font-black text-[#004BA5] mb-8 uppercase tracking-tight">Il Coordinatore</h2>
                                <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
                                    <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-blue-900/10 flex-shrink-0">
                                        {tour.coordinadorFoto ? (
                                            <Image src={tour.coordinadorFoto} alt={tour.coordinadorNombre} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl">👤</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#323232] mb-1">{tour.coordinadorNombre}</h3>
                                        <p className="text-[#FE8008] font-[700] mb-4 text-xs uppercase tracking-widest">Coordinatore Gibravo</p>
                                        <div className="relative pl-6">
                                            <span className="absolute left-0 top-0 text-3xl text-gray-200 font-serif">"</span>
                                            <div
                                                className="text-gray-600 italic leading-relaxed prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: tour.coordinadorDescripcion || 'Pronto a guidarvi in questa fantastica avventura!' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Documentation & Info - Simple List */}
                        {tour.requisitosDocumentacion && Array.isArray(tour.requisitosDocumentacion) && tour.requisitosDocumentacion.length > 0 && (
                            <div className="border-b border-gray-100 pb-12">
                                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-xl">
                                    <FileText className="w-5 h-5" />
                                    Documenti Richiesti
                                </h3>
                                <ul className="grid md:grid-cols-2 gap-4">
                                    {tour.requisitosDocumentacion.map((req: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                                            <span className="text-brand-600 font-bold">•</span>
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Gallery - Tighter Grid */}
                        {gallery.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-[#004BA5] uppercase tracking-tight">Galleria</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-96 md:h-80">
                                    {gallery.slice(0, 5).map((url, i) => (
                                        <div key={i} className={`relative rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${i === 0 ? 'col-span-2 row-span-2 h-full' : 'h-full'}`}>
                                            <Image src={url} alt={`Gallery ${i}`} fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Map Embed - Clean */}
                        {/* Map Embed - Standard & Visible */}
                        {tour.mapaEmbed && (
                            <div className="pt-8 border-t border-gray-100">
                                <h2 className="text-2xl font-black text-[#004BA5] mb-8 uppercase tracking-tight">Mappa</h2>
                                <div className="rounded-2xl overflow-hidden bg-gray-100 h-96 w-full relative shadow-sm border border-gray-200">
                                    <iframe
                                        src={tour.mapaEmbed.includes('<iframe') ? (tour.mapaEmbed.match(/src=["']([^"']+)["']/) || [])[1] : tour.mapaEmbed}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className="absolute inset-0"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Dynamic FAQ - Divider only */}
                        <div className="pt-8">
                            <h2 className="text-2xl font-black text-[#004BA5] mb-8 uppercase tracking-tight">Domande Frequenti</h2>
                            <TourFAQ faq={tour.faq as unknown as FAQItem[]} />
                        </div>

                    </div>


                    {/* RIGHT COLUMN (Sticky Sidebar) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-8">
                            {/* Price Card - Clean White */}
                            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden p-8">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Prezzo a persona</p>
                                    <div className="flex flex-col items-center justify-center mb-6">
                                        <div className="flex items-center gap-1 mb-2">
                                            <span className="text-3xl font-bold text-gray-300 font-light">€</span>
                                            <span className="text-6xl font-black text-[#FE8008] tracking-tighter shadow-orange-100">{tour.precioAdulto}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium bg-gray-50 px-4 py-2 rounded-lg text-center max-w-[200px] leading-snug">
                                            ⚠️ Il prezzo si intende per il <span className="text-[#004BA5] font-bold">solo tour</span>, voli esclusi.
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-8">
                                        <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Tasse incluse</span>
                                        <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cancellabile</span>
                                    </div>

                                    <Link href={`/prenotazione/${tour.slug || tour.id}`} className="w-full block">
                                        <button className="w-full py-4 bg-[#004BA5] hover:bg-[#003a80] text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 hover:shadow-blue-900/30 transition-all transform hover:-translate-y-0.5 mb-6 text-xl">
                                            Prenota Ora
                                        </button>
                                    </Link>
                                    <button className="w-full py-2 text-gray-400 font-bold hover:text-[#004BA5] transition-colors text-sm mb-6">
                                        Scarica Programma PDF
                                    </button>
                                </div>
                                <div className="w-full border-t border-gray-50 pt-6 flex justify-center">
                                    <div className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wide animate-pulse">
                                        🔥 Ultimi posti disponibili
                                    </div>
                                </div>
                            </div>

                            {/* Why Us - Clean List (No colored box) */}
                            {tour.etiquetas && tour.etiquetas.length > 0 && (
                                <div className="pl-2">
                                    <h4 className="font-bold text-[#323232] mb-4 text-sm uppercase tracking-wider">Perché questo viaggio?</h4>
                                    <ul className="space-y-4">
                                        {(tour.etiquetas as string[]).map((tag, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-600 text-sm font-medium">
                                                <Star className="w-5 h-5 text-[#FE8008] flex-shrink-0" />
                                                <span>{tag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Assistance - Clean */}
                            <div className="pl-2 border-t border-gray-100 pt-6 mt-6">
                                <h4 className="font-bold text-[#323232] mb-2 text-sm flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-[#004BA5]" />
                                    Serve aiuto?
                                </h4>
                                <p className="text-gray-500 text-sm mb-3 leading-relaxed">
                                    Hai dubbi sull'itinerario o sui pagamenti?
                                </p>
                                <a href="https://wa.me/393282197645" target="_blank" className="text-[#004BA5] font-bold text-sm hover:underline flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Parla con noi su WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* --- NEXT TOURS SECTION --- */}
            {
                relatedTours.length > 0 && (
                    <div className="max-w-7xl mx-auto px-4 py-24 border-t border-gray-100 mt-12">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h2 className="text-3xl font-black text-[#004BA5] mb-2">Prossime Partenze</h2>
                                <p className="text-gray-500">Altri viaggi che potrebbero interessarti</p>
                            </div>
                            <Link
                                href={tour.type === 'aereo' ? '/viaggi/aereo' : '/viaggi/bus'}
                                className="hidden md:inline-block font-bold text-[#FE8008] hover:text-[#e67300] transition-colors"
                            >
                                Vedi tutti &rarr;
                            </Link>
                        </div>

                        <div className="space-y-8">
                            {relatedTours.map((t) => (
                                <TourHorizontalCard
                                    key={t.id}
                                    id={t.id}
                                    slug={t.slug ?? t.id}
                                    title={t.titulo}
                                    image={t.coverImage || (t.galeria && t.galeria[0]) || '/images/placeholder-tour.jpg'}
                                    date={t.fechaViaje}
                                    duration={t.duracionTexto ?? ''}
                                    price={t.precioAdulto}
                                    coordinator={t.coordinadorNombre ? { name: t.coordinadorNombre, photo: t.coordinadorFoto } : null}
                                    tags={Array.isArray(t.etiquetas) ? t.etiquetas : []}
                                />
                            ))}
                        </div>
                    </div>
                )
            }

            {/* --- MOBILE FIXED BOTTOM BAR (Conversion Booster) --- */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 md:hidden flex items-center justify-between gap-4 pb-safe">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Prezzo a persona</span>
                    <div className="flex items-center gap-1">
                        <span className="text-xl font-bold text-gray-300">€</span>
                        <span className="text-3xl font-black text-[#FE8008] tracking-tight">{tour.precioAdulto}</span>
                    </div>
                </div>
                <Link href={`/prenotazione/${tour.slug || tour.id}`} className="flex-1">
                    <button className="w-full py-3 bg-[#004BA5] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-transform text-lg">
                        Prenota Ora
                    </button>
                </Link>
            </div>
        </div >
    );
}
