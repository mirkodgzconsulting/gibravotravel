import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

export default function CookiePolicyPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Mini Hero */}
            <section className="bg-gradient-to-r from-[#004ba5] to-[#003580] py-16 flex items-center min-h-[220px]">
                <div className="container mx-auto px-4 max-w-5xl">
                    <RevealOnScroll>
                        <h1 className="section-title text-white text-3xl md:text-4xl text-left">
                            Informativa Cookie
                        </h1>
                    </RevealOnScroll>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-20 lg:py-24">
                <div className="container mx-auto px-4 max-w-5xl">
                    <RevealOnScroll>
                        <div className="space-y-10">
                            <div>
                                <p className="body-text italic">Ultimo aggiornamento: 3 Gennaio 2026</p>
                                <p className="body-text mt-6">
                                    La presente Cookie Policy ha lo scopo di illustrare i tipi e le categorie di cookie, le finalità e le modalità di utilizzo dei cookie da parte di GIBRAVO TRAVEL, nonché di fornire indicazioni agli utenti su come rifiutare o eliminare i cookie presenti sul sito web.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">1. COSA SONO I COOKIE?</h2>
                                    <p className="body-text">
                                        I cookie sono stringhe di testo di piccole dimensioni che i siti visitati dall'utente inviano al suo terminale (solitamente al browser), dove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla successiva visita del medesimo utente. Nel corso della navigazione, l'utente può ricevere sul suo terminale anche cookie che vengono inviati da siti o da web server diversi (c.d. "terze parti").
                                    </p>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">2. TIPOLOGIE DI COOKIE UTILIZZATE</h2>
                                    <p className="body-text mb-6">Il sito di GIBRAVO TRAVEL utilizza le seguenti categorie di cookie:</p>

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-[600] text-[#004ba5] mb-2">A. Cookie Tecnici e di Funzionalità (Necessari)</h3>
                                            <p className="body-text">
                                                Questi cookie sono essenziali per il corretto funzionamento del sito. Includono, ad esempio:
                                                cookie di sessione per la gestione del login, cookie di sicurezza per prevenire frodi, cookie di Stripe per processare i pagamenti in modo sicuro, e cookie di preferenza per ricordare le scelte effettuate dall'utente.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-[600] text-[#004ba5] mb-2">B. Cookie Analitici e Statistici</h3>
                                            <p className="body-text">
                                                Utilizziamo cookie per raccogliere informazioni in forma aggregata e anonima su come gli utenti interagiscono con il sito (es. Google Analytics con IP anonimizzato). Questo ci permette di migliorare l'esperienza di navigazione monitorando le visite e gli errori tecnici.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-[600] text-[#004ba5] mb-2">C. Cookie di Terze Parti e Social Widget</h3>
                                            <p className="body-text">
                                                Alcune pagine contengono contenuti di fornitori esterni come Google Maps o widget social (Instagram/Facebook/TikTok) che installano i propri cookie per tracciare l'interesse verso i loro servizi.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-[600] text-[#004ba5] mb-2">D. Cookie di Profilazione e Marketing (Opzionali)</h3>
                                            <p className="body-text">
                                                Questi cookie sono volti a creare profili relativi all'utente per inviare messaggi pubblicitari in linea con le preferenze manifestate. Vengono installati solo previo Suo consenso esplicito tramite il banner.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">3. ELENCO DEI FORNITORI TERZI</h2>
                                    <ul className="list-disc pl-5 space-y-2 body-text">
                                        <li><strong>Stripe:</strong> Gestione pagamenti sicuri.</li>
                                        <li><strong>Google:</strong> Analytics e Maps.</li>
                                        <li><strong>Meta:</strong> Interazione social (Facebook/Instagram).</li>
                                    </ul>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">4. GESTIONE DEI COOKIE E CONSENSO</h2>
                                    <p className="body-text">
                                        L'utente può gestire le proprie preferenze sui cookie direttamente attraverso il banner presente al primo accesso o configurando il browser per accettare o rifiutare tutti i cookie.
                                    </p>
                                </div>

                                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">5. CONTATTI</h2>
                                    <p className="body-text font-[600]">GIBRAVO TRAVEL</p>
                                    <p className="body-text">Email: info@gibravo.it</p>
                                    <p className="body-text">Indirizzo: Via Bartolomeo Eustachi, 30, 20129 Milano (MI)</p>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
        </main>
    )
}
