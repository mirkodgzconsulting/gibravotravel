import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import { Button } from "@/components/website/ui/button"
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react"

export default function ContactsPage() {
    return (
        <main className="min-h-screen bg-slate-50 pt-32 pb-24">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <RevealOnScroll>
                    <div className="text-center mb-16">
                        <span className="text-[#FE8008] font-bold tracking-wider text-sm uppercase mb-2 block">
                            Siamo qui per te
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-[#004BA5] mb-6 tracking-tight">
                            Parliamo del tuo prossimo viaggio
                        </h1>
                        <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
                            Organizza il tuo viaggio ideale con GiBravo Travel.
                            Non hai trovato la data o la destinazione che cercavi?
                            Non preoccuparti! Il nostro team ti aiuterà a creare un viaggio 100% personalizzato.
                        </p>
                    </div>
                </RevealOnScroll>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">

                    {/* Left Col: Contact Info */}
                    <RevealOnScroll delay={100}>
                        <div className="flex flex-col gap-10">
                            <div>
                                <h3 className="text-2xl font-bold text-[#323232] mb-6">Contatti Diretti</h3>
                                <p className="text-slate-600 mb-8 leading-relaxed">
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
                                        <p className="text-slate-600 mt-1">Via Bartolomeo Eustachi, 30<br />Milano (MI)</p>
                                    </div>
                                </div>

                                {/* Hours */}
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0 text-[#004BA5]">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-[#323232]">Orari di Apertura</h4>
                                        <div className="text-slate-600 mt-1 space-y-1">
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
                        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-slate-100">
                            <h3 className="text-2xl font-bold text-[#323232] mb-2">Scrivici un messaggio</h3>
                            <p className="text-slate-500 mb-8">Compila il modulo per richiedere un viaggio su misura.</p>

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-bold text-slate-700">Nome</label>
                                        <input
                                            type="text"
                                            id="name"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#004BA5] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="Il tuo nome"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-bold text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#004BA5] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                            placeholder="tua@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-bold text-slate-700">Telefono</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#004BA5] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="+39 000 000 0000"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-bold text-slate-700">Come possiamo aiutarti?</label>
                                    <textarea
                                        id="message"
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#004BA5] focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                        placeholder="Raccontaci la tua idea di viaggio ideale..."
                                    />
                                </div>

                                <Button className="w-full bg-[#FE8008] hover:bg-[#e67300] text-white font-[800] py-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                                    Invia Richiesta
                                </Button>

                                <p className="text-xs text-slate-400 text-center">
                                    Cliccando su Invia accetti la nostra Privacy Policy.
                                </p>
                            </form>
                        </div>
                    </RevealOnScroll>

                </div>
            </div>
        </main>
    )
}
