"use client"

import Image from "next/image"
import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"
import Link from "next/link"
import { CreditCardIcon, UsersIcon } from 'lucide-react'
import FAQ from '@/components/shadcn-studio/blocks/faq-component-08/faq-component-08'

const tabsData = [
    {
        value: 'prenotazione',
        label: 'PRENOTAZIONE DEL VIAGGIO',
        icon: CreditCardIcon,
        faqs: [
            {
                question: 'Qual è il sistema di pagamento?',
                answer:
                    "Più di 45 giorni dalla partenza: Puoi pagare in due tranche. Un acconto del 30% al momento della prenotazione e il saldo del 70% entro i 45 giorni precedenti la partenza.\n\nMeno di 45 giorni dalla partenza: È richiesto il pagamento totale al momento della prenotazione."
            },
            {
                question: 'Quali metodi di pagamento accettate?',
                answer:
                    "Carta di Credito/Debito: Tramite il gateway sicuro Stripe.\n\nScalapay: Per pagare a rate senza interessi (ottimo per prenotazioni last-minute)."
            },
            {
                question: 'Cosa succede se il gruppo non parte?',
                answer:
                    "Se non raggiungiamo il numero minimo di partecipanti, ti offriremo un'alternativa di viaggio o il rimborso completo di quanto pagato."
            },
            {
                question: 'Come funziona la cancellazione?',
                answer:
                    "Invia una comunicazione a info@gibravo.it. Si applicano penali percentuali in base al preavviso (5%, 15% o 25% a seconda dei giorni mancanti). Nota: i voli già emessi spesso non sono rimborsabili. Ti consigliamo di aggiungere l'Opzione di Cancellazione in fase di acquisto."
            },
            {
                question: 'Come monitorare i viaggi confermati?',
                answer:
                    "Il sito mostra lo stato in tempo reale: Programmato, Quasi confermato, Confermato, ecc. Una volta effettuata la prenotazione e confermato il tour, verrai inserito nel gruppo WhatsApp dedicato per coordinarti con il resto dei partecipanti."
            }
        ]
    },
    {
        value: 'conoscersi',
        label: 'CONOSCERSI PRIMA DI PARTIRE',
        icon: UsersIcon,
        faqs: [
            {
                question: 'Posso sapere quali voli prenderanno i miei compagni di viaggio?',
                answer:
                    "Per motivi di privacy, non possiamo fornirti i dettagli dei voli degli altri partecipanti. Tuttavia, c'è un modo semplice per scoprirlo: unisciti alla nostra community su Facebook \"GiBravo Travel: Community di Viaggiatori\" e chiedi direttamente lì ai tuoi futuri compagni!"
            },
            {
                question: 'Come funziona la Community Facebook di GiBravo Travel?',
                answer:
                    "È il luogo ideale per restare informati su nuove destinazioni, turni confermati e consigli utili. Cerca il gruppo su Facebook e invia la richiesta; ti accetteremo subito.\n\nNota Bene: Non è necessario aver già acquistato un viaggio per far parte della nostra community."
            },
            {
                question: 'Posso incontrare i miei compagni di viaggio prima della partenza?',
                answer:
                    "Assolutamente sì! Puoi interagire con loro nel gruppo Facebook commentando i post del tuo turno di viaggio. Inoltre, circa 2 settimane prima della partenza, il coordinatore di GiBravo Travel creerà un gruppo WhatsApp ufficiale con tutti i partecipanti confermati per definire gli ultimi dettagli della grande avventura."
            },
            {
                question: 'Qual è l\'età media dei gruppi?',
                answer:
                    "Per noi la chimica del grupo è fondamentale. Per questo dividiamo i viaggi in fasce d'età (es. 25-35 o 30-45+ anni). Se hai dubbi sulla fascia d'età più adatta a te, scrivici a info@gibravo.it e ti aiuteremo a scegliere il gruppo perfetto."
            },
            {
                question: 'Com\'è composto il gruppo?',
                answer:
                    "La missione di GiBravo Travel è creare gruppi omogenei per età e interessi, cercando di mantenere, dove possibile, un equilibrio tra sesso e passioni, per garantirti la migliore esperienza di viaggio della tua vita."
            }
        ]
    }
]

export default function FAQPage() {
    return (
        <main className="min-h-screen bg-slate-50 pb-24">
            {/* 1. HERO SECTION - Identical to Contatti for consistency */}
            <section className="relative h-[60vh] min-h-[500px] w-full flex items-center overflow-hidden bg-black mb-12 md:mb-16">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="https://res.cloudinary.com/dskliu1ig/image/upload/v1768266059/img-faqhero_plcnio.jpg"
                        alt="FAQ Hero"
                        fill
                        className="object-cover opacity-80"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
                </div>

                <div className="container mx-auto px-4 z-20 relative pt-32">
                    <RevealOnScroll>
                        <div className="max-w-3xl">
                            <h1 className="text-5xl md:text-7xl font-[700] text-white tracking-tighter leading-[1.1] mb-8">
                                Tutto quello che <br />
                                <span className="text-[#FE8008]">Devi Sapere</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed max-w-2xl">
                                Dalle modalità di pagamento alla nostra community Facebook: qui trovi tutte le risposte alle tue domande.
                            </p>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* 2. FAQ BLOCK SECTION */}
            <FAQ tabsData={tabsData} />

            {/* 3. FINAL CTA */}
            <div className="container mx-auto px-4 max-w-6xl">
                <RevealOnScroll delay={300}>
                    <div className="mt-8 p-8 md:p-12 bg-gradient-to-br from-[#004BA5] to-[#003580] rounded-[2rem] md:rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-900/20">
                        <div className="text-center md:text-left">
                            <h3 className="text-3xl font-bold mb-3 tracking-tight">Hai ancora qualche dubbio?</h3>
                            <p className="text-xl opacity-90 font-medium">Il nostro team è pronto a risponderti in tempo reale su WhatsApp.</p>
                        </div>
                        <Link href="/contatti" className="px-10 py-5 bg-white text-[#004BA5] text-lg font-bold rounded-full hover:scale-110 transition-transform shadow-lg shadow-white/10 whitespace-nowrap">
                            Parla con noi ✈️
                        </Link>
                    </div>
                </RevealOnScroll>
            </div>
        </main>
    )
}
