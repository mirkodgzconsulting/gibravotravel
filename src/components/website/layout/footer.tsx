"use client";
import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Send } from "lucide-react"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import Script from "next/script"
import { usePathname } from "next/navigation"

export function Footer() {
    const pathname = usePathname();
    const isContactsPage = pathname === "/contatti";

    return (
        <div className="w-full flex flex-col">
            {/* 1. NEWSLETTER SECTION - Modern White Header */}
            {!isContactsPage && (
                <section className="bg-white py-16 md:py-20 border-t border-slate-100">
                    <div className="container mx-auto px-4">
                        <RevealOnScroll>
                            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 max-w-6xl mx-auto">
                                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                                    <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-[#003ea3]">
                                        <Send className="h-7 w-7" />
                                    </div>
                                    <h2 className="section-title mb-4">
                                        Mettiti in viaggio con noi!
                                    </h2>
                                    <p className="section-subtitle">
                                        Iscriviti alla newsletter per ricevere in anteprima le nuove destinazioni,
                                        sconti esclusivi e i nostri migliori consigli di viaggio.
                                    </p>
                                </div>

                                <div className="w-full flex justify-center lg:justify-end overflow-hidden">
                                    <div className="w-full max-w-[460px] relative" style={{ minHeight: "280px" }}>
                                        <iframe
                                            src="https://api.leadconnectorhq.com/widget/form/XHgIpGv8wjIQyGF6ScOS"
                                            style={{ width: "100%", height: "100%", minHeight: "280px", border: "none", overflow: "hidden" }}
                                            id="inline-XHgIpGv8wjIQyGF6ScOS"
                                            data-layout="{'id':'INLINE'}"
                                            data-trigger-type="alwaysShow"
                                            data-trigger-value=""
                                            data-activation-type="alwaysActivated"
                                            data-activation-value=""
                                            data-deactivation-type="neverDeactivate"
                                            data-deactivation-value=""
                                            data-form-name="NEWSLETTER -VA"
                                            data-height="280"
                                            data-layout-iframe-id="inline-XHgIpGv8wjIQyGF6ScOS"
                                            data-form-id="XHgIpGv8wjIQyGF6ScOS"
                                            title="NEWSLETTER -VA"
                                        ></iframe>
                                    </div>
                                </div>
                            </div>
                        </RevealOnScroll>
                    </div>
                </section>
            )}

            {/* 2. MAIN FOOTER - Blue Gradient */}
            <footer className="w-full bg-[#003ea3] pt-16 pb-8 border-t border-white/10 text-white font-[var(--font-outfit)]">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">

                        {/* Col 1: Brand & Social */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <Link href="/" className="flex items-center gap-1 mb-6">
                                <Image
                                    src="/Logo_gibravo.svg"
                                    alt="Gibravo Travel Logo"
                                    width={160}
                                    height={45}
                                    className="h-12 w-auto brightness-0 invert"
                                    priority
                                />
                            </Link>
                            <p className="text-[16px] font-medium text-white/80 max-w-xs mb-8 leading-relaxed">
                                Viaggi di gruppo on the road per giovani professionisti. Prepara lo zaino, al resto pensiamo noi.
                            </p>
                            <div className="flex gap-4">
                                <Link href="https://www.instagram.com/gibravo.travel" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF7000] text-white hover:bg-white hover:text-[#FF7000] transition-all">
                                    <Instagram className="h-5 w-5" />
                                </Link>
                                <Link href="https://www.facebook.com/GiBravoTravelAgenzia" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF7000] text-white hover:bg-white hover:text-[#FF7000] transition-all">
                                    <Facebook className="h-5 w-5" />
                                </Link>
                                <Link href="https://www.tiktok.com/@gibravotravel" target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF7000] text-white hover:bg-white hover:text-[#FF7000] transition-all">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                    </svg>
                                </Link>
                            </div>
                        </div>

                        {/* Col 2: GiBravo Travel (Main Links) */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h3 className="font-[600] text-white text-lg mb-6 tracking-tight">Menu</h3>
                            <div className="flex flex-col gap-3">
                                <Link href="/chi-siamo" className="text-[16px] font-medium text-white/90 hover:text-white transition-colors">Chi siamo</Link>
                                <Link href="/partenze" className="text-[16px] font-medium text-white/90 hover:text-white transition-colors">Partenze</Link>
                            </div>
                        </div>

                        {/* Col 3: Supporto & Legal */}
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <h3 className="font-[600] text-white text-lg mb-6 tracking-tight">Supporto</h3>
                            <div className="flex flex-col gap-3">
                                <Link href="/contatti" className="text-[16px] font-medium text-white/90 hover:text-white transition-colors">Contattaci</Link>
                                <Link href="#" className="text-[16px] font-medium text-white/90 hover:text-white transition-colors">Domande Frequenti (FAQ)</Link>
                                <div className="h-px w-10 bg-white/20 my-2 mx-auto md:mx-0"></div>
                                <Link href="/informativa-privacy" className="text-[14px] font-medium text-white/70 hover:text-white transition-colors">Privacy Policy</Link>
                                <Link href="/termini-e-condizioni" className="text-[14px] font-medium text-white/70 hover:text-white transition-colors">Termini e Condizioni</Link>
                                <Link href="/informativa-cookie" className="text-[14px] font-medium text-white/70 hover:text-white transition-colors">Cookie Policy</Link>
                            </div>
                        </div>

                    </div>

                    <div className="mt-16 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[15px] text-white/70 font-medium text-center md:text-left">
                            © 2026 GiBravo Travel. Tutti i diritti riservati.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
