import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import { Button } from "@/components/website/ui/button"
import { MapPin, Phone, Mail, Clock } from "lucide-react"
import Image from "next/image"
import Script from "next/script"

export default function ContactsPage() {
    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            {/* 1. HERO SECTION - Premium Split Design */}
            <section className="relative h-[60vh] min-h-[500px] w-full flex items-center overflow-hidden bg-black mb-16">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://res.cloudinary.com/dskliu1ig/image/upload/v1767393764/contattaci_ezcfzw.jpg"
                        alt="Contatti Hero"
                        fill
                        className="object-cover opacity-80"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                </div>

                <div className="container mx-auto px-4 z-20 relative">
                    <RevealOnScroll>
                        <div className="max-w-3xl">
                            <h1 className="text-5xl md:text-7xl font-[700] text-white tracking-tighter leading-[1.1] mb-8">
                                Parliamo del tuo <br />
                                <span className="text-[#FE8008]">Prossimo Viaggio</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed max-w-2xl">
                                Organizza il tuo viaggio ideale con GiBravo Travel. Siamo qui per trasformare i tuoi sogni in realtà.
                            </p>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            <div className="container mx-auto px-4 max-w-7xl">
                {/* Intro Text */}
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <span className="text-[#FE8008] font-bold tracking-wider text-sm uppercase mb-2 block font-outfit">
                            Siamo qui per te
                        </span>
                        <h2 className="section-title text-3xl md:text-4xl text-[#004BA5] mb-6">
                            Non hai trovato quello che cercavi?
                        </h2>
                        <p className="section-subtitle max-w-3xl mx-auto">
                            Non preoccuparti! Il nostro team ti aiuterà a creare un viaggio 100% personalizzato,
                            curando ogni dettaglio dalla A alla Z.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center mt-6">

                    {/* Left Col: Contact Info */}
                    <RevealOnScroll delay={100}>
                        <div className="flex flex-col gap-10">
                            <div>
                                <h3 className="text-2xl font-bold text-[#323232] mb-6">Contatti Diretti</h3>
                                <p className="body-text mb-8">
                                    Puoi contattarci direttamente via WhatsApp, telefono o email.
                                    Siamo a tua disposizione per qualsiasi dubbio o richiesta.
                                </p>
                            </div>

                            <div className="space-y-8">
                                {/* Phone */}
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0 text-[#004BA5]">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-[#323232]">Telefono</h4>
                                        <p className="text-[#004BA5] font-semibold text-xl mt-1">02 8219 7645</p>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0 text-[#004BA5]">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-[#323232]">Sede</h4>
                                        <p className="body-text mt-1">Via Bartolomeo Eustachi, 30<br />Milano (MI)</p>
                                    </div>
                                </div>

                                {/* Hours */}
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0 text-[#004BA5]">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-[#323232]">Orari di Apertura</h4>
                                        <div className="body-text mt-1 space-y-1">
                                            <p><span className="font-semibold text-slate-800">Lun - Ven:</span> 10:00 - 13:00 | 14:00 - 19:00</p>
                                            <p><span className="font-semibold text-slate-800">Sabato:</span> 10:00 - 13:00 | 14:00 - 18:00</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0 text-[#004BA5]">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-[#323232]">Email</h4>
                                        <p className="text-[#004BA5] font-semibold text-lg mt-1 decoration-1 underline underline-offset-4">info@gibravo.it</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Right Col: Form */}
                    <RevealOnScroll delay={200}>
                        <div className="p-0 overflow-hidden w-full max-w-full">
                            <div className="w-full overflow-hidden">
                                <div className="w-full relative" style={{ minHeight: "550px" }}>
                                    <iframe
                                        src="https://api.leadconnectorhq.com/widget/form/72A42sQgiiHmw4cwtZSf"
                                        style={{ width: "100%", height: "100%", minHeight: "550px", border: "none", borderRadius: "0px", overflow: "hidden" }}
                                        id="inline-72A42sQgiiHmw4cwtZSf"
                                        data-layout="{'id':'INLINE'}"
                                        data-trigger-type="alwaysShow"
                                        data-trigger-value=""
                                        data-activation-type="alwaysActivated"
                                        data-activation-value=""
                                        data-deactivation-type="neverDeactivate"
                                        data-deactivation-value=""
                                        data-form-name="Contact - pagina gibravo.it"
                                        data-height="550"
                                        data-layout-iframe-id="inline-72A42sQgiiHmw4cwtZSf"
                                        data-form-id="72A42sQgiiHmw4cwtZSf"
                                        title="Contact - pagina gibravo.it"
                                        scrolling="no"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>

                </div>
            </div>
        </main>
    )
}
