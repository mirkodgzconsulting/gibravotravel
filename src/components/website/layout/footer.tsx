import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="w-full bg-[#f4f7f9] pt-16 pb-8 border-t border-slate-200">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">

                    {/* Col 1: Brand & Social */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <Link href="/" className="flex items-center gap-1 mb-6">
                            <Image
                                src="/Logo_gibravo.svg"
                                alt="Gibravo Travel Logo"
                                width={160}
                                height={45}
                                className="h-12 w-auto"
                            />
                        </Link>
                        <p className="text-sm font-medium text-slate-500 max-w-xs mb-8 leading-relaxed">
                            Viaggi di gruppo on the road per giovani professionisti. Prepara lo zaino, al resto pensiamo noi.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-[#FE8008] hover:text-white transition-all">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-[#FE8008] hover:text-white transition-all">
                                <Facebook className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>

                    {/* Col 2: GiBravo Travel (Main Links) */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className="font-[800] text-slate-900 text-lg mb-6">GiBravo Travel</h3>
                        <div className="flex flex-col gap-3">
                            <Link href="/chi-siamo" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008] transition-colors">Chi siamo</Link>
                            <Link href="/partenze" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008] transition-colors">Tutte le partenze</Link>
                            <Link href="/destinazioni" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008] transition-colors">Destinazioni</Link>
                            <Link href="/tipi-di-viaggio/aereo" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008] transition-colors">Viaggi in Aereo</Link>
                            <Link href="/tipi-di-viaggio/autobus" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008] transition-colors">Viaggi in Bus</Link>
                        </div>
                    </div>

                    {/* Col 3: Supporto & Legal */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className="font-[800] text-slate-900 text-lg mb-6">Supporto</h3>
                        <div className="flex flex-col gap-3">
                            <Link href="/contatti" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008] transition-colors">Contattaci</Link>
                            <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008] transition-colors">Domande Frequenti (FAQ)</Link>
                            <div className="h-px w-10 bg-slate-200 my-2 mx-auto md:mx-0"></div>
                            <Link href="#" className="text-xs font-medium text-slate-400 hover:text-[#FE8008] transition-colors">Privacy Policy</Link>
                            <Link href="#" className="text-xs font-medium text-slate-400 hover:text-[#FE8008] transition-colors">Termini e Condizioni</Link>
                            <Link href="#" className="text-xs font-medium text-slate-400 hover:text-[#FE8008] transition-colors">Cookie Policy</Link>
                        </div>
                    </div>

                </div>

                <div className="mt-16 border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-400 font-medium text-center md:text-left">
                        © 2024 Gibravo Travel. Tutti i diritti riservati.
                    </p>
                </div>
            </div>
        </footer>
    )
}
