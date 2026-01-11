
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

// FORCE DYNAMIC to avoid static gen issues with slug param
export const dynamic = 'force-dynamic';

async function getTour(slug: string) {
    // 1. Try TourAereo
    let tourAereo = await prisma.tourAereo.findUnique({
        where: { slug },
        include: { creator: true }
    });

    if (!tourAereo) {
        // Fallback: Check by ID if slug lookup failed
        tourAereo = await prisma.tourAereo.findUnique({
            where: { id: slug },
            include: { creator: true }
        });
    }

    if (tourAereo) return { ...tourAereo, type: 'aereo' };

    // 2. Try TourBus
    let tourBus = await prisma.tourBus.findUnique({
        where: { slug },
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
    const itinerary = Array.isArray(tour.itinerario) ? tour.itinerario as any[] : [];
    const gallery = Array.isArray(tour.galeria) ? tour.galeria as string[] : [];

    // Hero Image (Use cover or first gallery or placeholder)
    const heroImage = tour.coverImage || gallery[0] || '/images/placeholder-tour.jpg';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
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

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 w-full p-6 md:p-12 text-white max-w-6xl mx-auto">
                    {tour.etiquetas && Array.isArray(tour.etiquetas) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {tour.etiquetas.map((tag: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-brand-500/90 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
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
            <div className="max-w-6xl mx-auto px-4 md:px-6 mt-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN (Details) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Consolidated Overview Section */}
                        <TourOverview
                            date={tour.fechaViaje}
                            duration={tour.duracionTexto}
                            daysCount={daysCount}
                            type={tour.type as 'aereo' | 'bus'}
                            description={tour.infoGeneral}
                        />



                        {/* Documentation Requirements */}
                        {tour.requisitosDocumentacion && Array.isArray(tour.requisitosDocumentacion) && tour.requisitosDocumentacion.length > 0 && (
                            <div className="bg-amber-50 rounded-xl shadow-sm p-6 border border-amber-100">
                                <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2 text-lg">
                                    <FileText className="w-5 h-5" />
                                    Documenti Richiesti
                                </h3>
                                <ul className="space-y-2">
                                    {tour.requisitosDocumentacion.map((req: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-amber-800 text-sm">
                                            <span className="text-amber-600 mt-1 flex-shrink-0">•</span>
                                            <span>{req}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}





                        {/* Dynamic Itinerary */}
                        <TourItinerary itinerary={itinerary} />

                        {/* Inclusions / Exclusions */}
                        <div id="incluso" className="scroll-mt-32 grid md:grid-cols-2 gap-6">
                            {/* Includes */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <h3 className="font-bold text-green-700 mb-4 flex items-center gap-2 text-lg">
                                    <CheckCircle2 className="w-5 h-5" />
                                    La Quota Include
                                </h3>
                                <ul className="space-y-3">
                                    {(tour.incluye as string[] || []).map((item, i) => (
                                        <li key={i} className="flex gap-3 text-gray-700 text-sm">
                                            <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Excludes */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2 text-lg">
                                    <XCircle className="w-5 h-5" />
                                    La Quota Non Include
                                </h3>
                                <ul className="space-y-3">
                                    {(tour.noIncluye as string[] || []).map((item, i) => (
                                        <li key={i} className="flex gap-3 text-gray-700 text-sm">
                                            <span className="text-red-400 mt-1 flex-shrink-0">✕</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Coordinator / Accompanist */}
                        {tour.coordinadorNombre && (
                            <div id="coordinatore" className="scroll-mt-32 bg-gradient-to-br from-brand-50 to-blue-50 rounded-xl p-8 border border-brand-100 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
                                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md flex-shrink-0">
                                    {tour.coordinadorFoto ? (
                                        <Image src={tour.coordinadorFoto} alt={tour.coordinadorNombre} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-brand-200 flex items-center justify-center text-4xl">👤</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">In viaggio con {tour.coordinadorNombre}</h3>
                                    <p className="text-brand-600 font-medium mb-3">Coordinatore Gibravo</p>
                                    <p className="text-gray-600 text-sm italic">
                                        "{tour.coordinadorDescripcion || 'Pronto a guidarvi in questa fantastica avventura!'}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Gallery */}
                        {gallery.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-gray-900">Galleria Fotografica</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-96 md:h-80">
                                    {gallery.slice(0, 5).map((url, i) => (
                                        <div key={i} className={`relative rounded-xl overflow-hidden shadow-sm hover:opacity-90 transition-opacity ${i === 0 ? 'col-span-2 row-span-2 h-full' : 'h-full'}`}>
                                            <Image src={url} alt={`Gallery ${i}`} fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Map Embed */}
                        {tour.mapaEmbed && (
                            <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 h-80 w-full relative bg-gray-100">
                                <iframe
                                    src={tour.mapaEmbed.includes('<iframe') ? (tour.mapaEmbed.match(/src=["']([^"']+)["']/) || [])[1] : tour.mapaEmbed}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="absolute inset-0"
                                />
                            </div>
                        )}

                        {/* Dynamic FAQ */}
                        <TourFAQ faq={tour.faq as any[]} />

                    </div>


                    {/* RIGHT COLUMN (Sticky Sidebar) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Price Card */}
                            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                                <div className="bg-gray-900 text-white p-4 text-center">
                                    <p className="text-sm opacity-80 uppercase tracking-widest font-semibold">Prezzo a persona</p>
                                </div>
                                <div className="p-6 text-center">
                                    <div className="flex items-start justify-center gap-1">
                                        <span className="text-2xl text-gray-400 font-light mt-2">€</span>
                                        <span className="text-5xl font-black text-brand-600">{tour.precioAdulto}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mt-2 mb-6">Tasse incluse • Cancellazione flessibile</p>

                                    <Link href={`/prenotazione/${tour.slug || tour.id}`}>
                                        <button className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 mb-3 text-lg cursor-pointer">
                                            Prenota Ora
                                        </button>
                                    </Link>
                                    <button className="w-full py-3 border-2 border-brand-100 text-brand-700 hover:bg-brand-50 font-bold rounded-lg transition-colors">
                                        Richiedi Info
                                    </button>
                                </div>
                                <div className="bg-gray-50 p-4 border-t border-gray-100 text-xs text-gray-500 text-center space-y-1">
                                    <p>Solo {('meta' in tour ? tour.meta : 50) || 20} posti totali</p>
                                    {tour.precioNino > 0 && <p>Prezzo Bambino: €{tour.precioNino}</p>}
                                </div>
                            </div>

                            {/* Why Travel With Us Card */}
                            {tour.etiquetas && tour.etiquetas.length > 0 && (
                                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                                    <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                                        <Star className="w-5 h-5 fill-emerald-600 text-emerald-600" />
                                        Perché viaggiare con noi?
                                    </h4>
                                    <ul className="space-y-3">
                                        {(tour.etiquetas as string[]).map((tag, i) => (
                                            <li key={i} className="flex items-start gap-3 text-emerald-800 text-sm font-medium">
                                                <span className="text-emerald-500 mt-0.5">★</span>
                                                <span>{tag}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Need Help Card */}
                            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <Phone className="w-4 h-4" /> Hai dubbi?
                                </h4>
                                <p className="text-blue-700 text-sm mb-4">Parla con un nostro esperto di viaggi per chiarire ogni dettaglio.</p>
                                <a href="mailto:info@gibravotravel.com" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Contattaci
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            {/* --- NEXT TOURS SECTION --- */}
            {
                relatedTours.length > 0 && (
                    <div className="max-w-5xl mx-auto px-4 py-16">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-gray-900 mb-6">I nostri prossimi viaggi di gruppo</h2>
                            <Link
                                href={tour.type === 'aereo' ? '/viaggi/aereo' : '/viaggi/bus'}
                                className="inline-block border-2 border-brand-500 text-brand-600 hover:bg-brand-50 font-bold py-2 px-6 rounded-full transition-colors"
                            >
                                Tutti i viaggi
                            </Link>
                        </div>

                        <div className="space-y-6">
                            {relatedTours.map((t: any) => (
                                <TourHorizontalCard
                                    key={t.id}
                                    id={t.id}
                                    slug={t.slug || t.id}
                                    title={t.titulo}
                                    image={t.coverImage || (t.galeria && t.galeria[0]) || '/images/placeholder-tour.jpg'}
                                    date={t.fechaViaje}
                                    duration={t.duracionTexto}
                                    price={t.precioAdulto}
                                    coordinator={t.coordinadorNombre ? { name: t.coordinadorNombre, photo: t.coordinadorFoto } : null}
                                    tags={Array.isArray(t.etiquetas) ? t.etiquetas : []}
                                />
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
