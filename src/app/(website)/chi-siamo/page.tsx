"use client"

import Image from "next/image"
import { useLanguage } from "@/context/website/language-context"
import { Users, Target, Heart, Globe, Award, Zap } from "lucide-react"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

export default function ChiSiamoPage() {
    const { language } = useLanguage()

    const t = {
        ES: {
            title: "¿Quiénes Somos?",
            about: "Somos una agencia de viajes con sede en Milán, formada por un equipo joven, dinámico y altamente profesional. Nos especializamos en la organización de viajes grupales en Europa, ofreciendo billetes de avión con tarifas étnicas y paquetes personalizados, incluyendo cruceros y escapadas culturales. Nos dirigimos principalmente a la comunidad latina, pero también a viajeros de Italia, Roma, Rusia, Ucrania, Filipinas y otras nacionalidades residentes en Europa.\n\nGracias a nuestro profundo conocimiento del mercado y a nuestros más de 10 años de experiencia en el empernado aéreo, garantizamos a nuestros clientes el servicio que buscan, confiable y siempre orientado a ofrecer los mejores precios y experiencias únicas.\nEsperamos seguir creciendo como agencia de referencia internacional, conectando culturas y personas a través de los viajes.",
            teamTitle: "Nuestro Equipo",
            teamSubtitle: "Conoce a las personas que hacen posible tus sueños de viaje.",
            missionTitle: "Misión",
            missionText: "Disfrute de experiencias de viaje únicas y accesibles con tours en grupo, boletos de avión con tarifas étnicas, cruceros y paquetes personalizados. Conectamos culturas y comunidades, principalmente de Latinoamérica, y de diferentes nacionalidades residentes en Europa, ofreciendo un servicio profesional y exclusivo para disfrutar de la cultura, la gastronomía y la aventura en cada destino.",
            visionTitle: "Visión",
            visionText: "Somos una agencia de referencia en Europa, reconocida por unir culturas a través de viajes únicos. Nuestra visión es seguir creciendo como una marca internacional, innovadora y vanguardista que se preocupa por sus clientes y supera sus expectativas.",
            valuesTitle: "Nuestros Valores",
            values: [
                { title: "Cercanía Cultural", text: "Entendemos las necesidades de la comunidad latina porque somos parte de ella.", icon: Heart },
                { title: "Profesionalismo", text: "Más de 10 años de experiencia en boletería aérea y organización de viajes.", icon: Award },
                { title: "Pasión por el viaje", text: "Creamos itinerarios pensados para disfrutar, descubrir y vivir la cultura y gastronomía local.", icon: Globe },
                { title: "Compromiso", text: "Nos esforzamos por ofrecer siempre las mejores tarifas, rutas y experiencias.", icon: Target },
                { title: "Trabajo en equipo", text: "Nuestro equipo multidisciplinario trabaja unido para brindar un servicio completo y de calidad.", icon: Users },
                { title: "Innovación", text: "Apostamos por ideas frescas, digitales y modernas como agencia internacional.", icon: Zap },
            ]
        },
        IT: {
            title: "Chi Siamo?",
            about: "Siamo un'agenzia di viaggi con sede a Milano, formata da un team giovane, dinamico e altamente professionale. Siamo specializzati nell'organizzazione di viaggi di gruppo in Europa, offrendo biglietti aerei con tariffe etniche e pacchetti personalizzati, inclusi crociere e fuggite culturali. Ci rivolgiamo principalmente alla comunità latina, ma anche a viaggiatori provenienti da Italia, Romania, Russia, Ucraina, Filippine e altre nazionalità residenti in Europa.\n\nGrazie alla nostra profonda conoscenza del mercato e ai nostri oltre 10 anni di esperienza nel settore aereo, garantiamo ai nostri clienti il servizio che cercano, affidabile e sempre orientato a offrire i migliori prezzi ed esperienze uniche.\nSperiamo di continuare a crescere come agenzia di riferimento internazionale, connettendo culture e persone attraverso i viaggi.",
            teamTitle: "Il Nostro Team",
            teamSubtitle: "Incontra le persone che rendono possibili i tuoi sogni di viaggio.",
            missionTitle: "Missione",
            missionText: "Goditi esperienze di viaggio uniche e accessibili con tour di gruppo, biglietti aerei a tariffe etniche, crociere e pacchetti personalizzati. Connettiamo culture e comunità, principalmente dall'America Latina e da diverse nazionalità residenti in Europa, offrendo un servizio professionale ed esclusivo per godere della cultura, della gastronomia e dell'avventura in ogni destinazione.",
            visionTitle: "Visione",
            visionText: "Siamo un'agenzia di riferimento in Europa, riconosciuta per unire culture attraverso viaggi unici. La nostra visione è continuare a crescere come un marchio internazionale, innovativo e all'avanguardia che si preoccupa dei suoi clienti e supera le loro aspettative.",
            valuesTitle: "I Nostri Valori",
            values: [
                { title: "Vicinanza Culturale", text: "Comprendiamo le esigenze della comunità latina perché ne facciamo parte.", icon: Heart },
                { title: "Professionalità", text: "Oltre 10 anni di esperienza nella biglietteria aerea e nell'organizzazione di viaggi.", icon: Award },
                { title: "Passione per il viaggio", text: "Creiamo itinerari pensati per godere, scoprire e vivere la cultura e la gastronomia locale.", icon: Globe },
                { title: "Impegno", text: "Ci sforziamo di offrire sempre le migliori tariffe, rotte ed esperienze.", icon: Target },
                { title: "Lavoro di squadra", text: "Il nostro team multidisciplinare lavora insieme per fornire un servizio completo e di qualità.", icon: Users },
                { title: "Innovazione", text: "Puntiamo su idee fresche, digitali e moderne come agenzia internazionale.", icon: Zap },
            ]
        },
        EN: {
            title: "Who Are We?",
            about: "We are a travel agency based in Milan, formed by a young, dynamic, and highly professional team. We specialize in organizing group trips in Europe, offering flight tickets with ethnic fares and personalized packages, including cruises and cultural getaways. We primarily target the Latin community, but also travelers from Italy, Romania, Russia, Ukraine, the Philippines, and other nationalities residing in Europe.\n\nThanks to our deep market knowledge and over 10 years of experience in the airline industry, we guarantee our customers the reliable service they seek, always oriented towards offering the best prices and unique experiences.\nWe hope to continue growing as an international reference agency, connecting cultures and people through travel.",
            teamTitle: "Our Team",
            teamSubtitle: "Meet the people who make your travel dreams possible.",
            missionTitle: "Mission",
            missionText: "Enjoy unique and accessible travel experiences with group tours, flight tickets with ethnic fares, cruises, and personalized packages. We connect cultures and communities, mainly from Latin America and different nationalities residing in Europe, offering a professional and exclusive service to enjoy culture, gastronomy, and adventure in every destination.",
            visionTitle: "Vision",
            visionText: "We are a reference agency in Europe, recognized for bridging cultures through unique travels. Our vision is to continue growing as an international, innovative, and cutting-edge brand that cares about its customers and exceeds their expectations.",
            valuesTitle: "Our Values",
            values: [
                { title: "Cultural Closeness", text: "We understand the needs of the Latin community because we are part of it.", icon: Heart },
                { title: "Professionalism", text: "Over 10 years of experience in airline ticketing and travel organization.", icon: Award },
                { title: "Passion for Travel", text: "We create itineraries designed to enjoy, discover, and live local culture and gastronomy.", icon: Globe },
                { title: "Commitment", text: "We strive to always offer the best rates, routes, and experiences.", icon: Target },
                { title: "Teamwork", text: "Our multidisciplinary team works together to provide a complete and quality service.", icon: Users },
                { title: "Innovation", text: "We bet on fresh, digital, and modern ideas as an international agency.", icon: Zap },
            ]
        }
    }

    const content = t[language as keyof typeof t] || t.ES

    return (
        <main className="min-h-screen bg-white pb-20">
            {/* HERO SECTION */}
            <section className="relative h-[650px] w-full overflow-hidden">
                <Image
                    src="/images/website/bg-chisiamo.webp"
                    alt="bg-Chi Siamo"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <RevealOnScroll>
                        <h1 className="text-5xl md:text-7xl font-bold text-white text-center px-4 drop-shadow-lg">
                            {content.title}
                        </h1>
                    </RevealOnScroll>
                </div>
            </section>

            {/* INTRO SECTION */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                    {/* Text Column */}
                    <div className="flex-1 text-center lg:text-left">
                        <RevealOnScroll className="h-full">
                            <h2 className="text-3xl md:text-4xl font-bold text-[#004BA5] mb-8 text-center">
                                {content.title}
                            </h2>
                            <div className="space-y-6 text-lg text-slate-700 leading-relaxed font-light">
                                {content.about.split('\n\n').map((paragraph, idx) => (
                                    <p key={idx}>{paragraph}</p>
                                ))}
                            </div>
                        </RevealOnScroll>
                    </div>

                    {/* Image Column */}
                    <div className="flex-1 w-full">
                        <RevealOnScroll delay={200} className="h-full">
                            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-xl">
                                <Image
                                    src="/images/website/cisiamo.webp"
                                    alt="Chi Siamo Group"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* TEAM */}
            <section className="bg-slate-50 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <RevealOnScroll>
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">{content.teamTitle}</h2>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto">{content.teamSubtitle}</p>
                        </RevealOnScroll>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Katia */}
                        <RevealOnScroll delay={100}>
                            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="aspect-[4/3] relative overflow-hidden rounded-lg mb-4">
                                    <Image
                                        src="/images/website/katiaflores.webp"
                                        alt="Katia Flores"
                                        fill
                                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute bottom-4 left-0 bg-[#FE8008] text-white px-4 py-1 font-medium text-sm rounded-r-full shadow-md">
                                        Taquilla y Reservas
                                    </div>
                                </div>
                                <div className="text-center pb-2">
                                    <h3 className="text-2xl font-bold text-[#004BA5]">Katia Flores</h3>
                                </div>
                            </div>
                        </RevealOnScroll>

                        {/* Anthony */}
                        <RevealOnScroll delay={200}>
                            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="aspect-[4/3] relative overflow-hidden rounded-lg mb-4">
                                    <Image
                                        src="/images/website/anthonymiranda.webp"
                                        alt="Anthony Miranda"
                                        fill
                                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute bottom-4 left-0 bg-[#FE8008] text-white px-4 py-1 font-medium text-sm rounded-r-full shadow-md">
                                        Taquilla y Reservas
                                    </div>
                                </div>
                                <div className="text-center pb-2">
                                    <h3 className="text-2xl font-bold text-[#004BA5]">Anthony Miranda</h3>
                                </div>
                            </div>
                        </RevealOnScroll>

                        {/* Marco */}
                        <RevealOnScroll delay={300}>
                            <div className="bg-white p-4 rounded-xl shadow-md border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="aspect-[4/3] relative overflow-hidden rounded-lg mb-4">
                                    <Image
                                        src="/images/website/marcorivolta.webp"
                                        alt="Marco Rivolta"
                                        fill
                                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute bottom-4 left-0 bg-[#FE8008] text-white px-4 py-1 font-medium text-sm rounded-r-full shadow-md">
                                        Marketing y Publicidad
                                    </div>
                                </div>
                                <div className="text-center pb-2">
                                    <h3 className="text-2xl font-bold text-[#004BA5]">Marco Rivolta</h3>
                                </div>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* MISSION & VISION */}
            <section className="bg-white py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-7xl mx-auto">
                        {/* Mission */}
                        <RevealOnScroll delay={100} className="h-full">
                            <div
                                className="bg-blue-50/50 p-10 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden h-full border border-blue-100"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Target className="w-32 h-32 text-[#004BA5]" />
                                </div>
                                <h2 className="text-3xl font-bold text-[#004BA5] mb-6 flex items-center gap-3">
                                    {content.missionTitle}
                                </h2>
                                <p className="text-lg text-slate-700 leading-relaxed font-medium">
                                    {content.missionText}
                                </p>
                            </div>
                        </RevealOnScroll>

                        {/* Vision */}
                        <RevealOnScroll delay={300} className="h-full">
                            <div
                                className="bg-orange-50/50 p-10 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden h-full border border-orange-100"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Globe className="w-32 h-32 text-[#FE8008]" />
                                </div>
                                <h2 className="text-3xl font-bold text-[#FE8008] mb-6 flex items-center gap-3">
                                    {content.visionTitle}
                                </h2>
                                <p className="text-lg text-slate-700 leading-relaxed font-medium">
                                    {content.visionText}
                                </p>
                            </div>
                        </RevealOnScroll>
                    </div>
                </div>
            </section>

            {/* VALUES */}
            <section className="bg-slate-50 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <RevealOnScroll>
                            <h2 className="text-4xl font-bold text-slate-900 mb-4">{content.valuesTitle}</h2>
                            <div className="w-24 h-1 bg-[#FE8008] mx-auto rounded-full" />
                        </RevealOnScroll>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {content.values.map((value, index) => {
                            const Icon = value.icon
                            return (
                                <RevealOnScroll key={index} delay={index * 100}>
                                    <div
                                        className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1 h-full"
                                    >
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                                            <Icon className="w-7 h-7 text-[#004BA5]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                                        <p className="text-slate-600">
                                            {value.text}
                                        </p>
                                    </div>
                                </RevealOnScroll>
                            )
                        })}
                    </div>
                </div>
            </section>
        </main>
    )
}
