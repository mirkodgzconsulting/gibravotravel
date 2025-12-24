import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="w-full bg-[#f4f7f9] pt-16 pb-8 border-t border-slate-200">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 gap-y-10 gap-x-6 md:grid-cols-3 lg:grid-cols-5">

                    {/* Col 1: Brand */}
                    <div className="col-span-2 lg:col-span-1">
                        <Link href="/" className="flex items-center gap-1 mb-6">
                            <Image
                                src="/Logo_gibravo.svg"
                                alt="Gibravo Travel Logo"
                                width={140}
                                height={40}
                                className="h-10 w-auto"
                            />
                        </Link>
                        <p className="text-sm font-medium text-slate-500 max-w-xs mb-6">
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

                    {/* Col 2: Destinazioni */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-[800] text-slate-900 text-lg">Destinazioni</h3>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Europa</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Asia</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Nord America</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Sud America</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Africa</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Medio Oriente</Link>
                    </div>

                    {/* Col 3: GiBravo Travel */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-[800] text-slate-900 text-lg">GiBravo Travel</h3>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Chi siamo</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Come funziona</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Coordinatori</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Lavora con noi</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">GiBravo Gift</Link>
                    </div>

                    {/* Col 4: Supporto */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-[800] text-slate-900 text-lg">Supporto</h3>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Area Personale</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">FAQ</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Contattaci</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Assicurazione</Link>
                    </div>

                    {/* Col 5: Note Legali */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-[800] text-slate-900 text-lg">Note Legali</h3>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Privacy Policy</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Cookie Policy</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Termini e Condizioni</Link>
                        <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-[#FE8008]">Condizioni di vendita</Link>
                    </div>
                </div>

                <div className="mt-16 border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-400 font-medium text-center md:text-left">
                        © 2024 Gibravo Travel. Tutti i diritti riservati. P.IVA 12345678901.
                    </p>
                    <div className="flex gap-6">

                    </div>
                </div>
            </div>
        </footer>
    )
}
