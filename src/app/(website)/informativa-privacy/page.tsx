import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Mini Hero */}
            <section className="bg-gradient-to-r from-[#004ba5] to-[#003580] py-16 flex items-center min-h-[220px]">
                <div className="container mx-auto px-4 max-w-5xl">
                    <RevealOnScroll>
                        <h1 className="section-title text-white text-3xl md:text-4xl text-left">
                            Informativa Privacy
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
                                    La presente Informativa, resa ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR), descrive le modalità con cui GIBRAVO TRAVEL raccoglie, utilizza e protegge i dati personali degli utenti.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">1. TITOLARE DEL TRATTAMENTO E CONTATTI</h2>
                                    <div className="body-text space-y-1">
                                        <p><strong>Ragione Sociale:</strong> GIBRAVO TRAVEL</p>
                                        <p><strong>Sede Legale:</strong> Via Bartolomeo Eustachi, 30, 20129 Milano (MI)</p>
                                        <p><strong>Email:</strong> info@gibravo.it</p>
                                        <p><strong>Telefono:</strong> 0282197645</p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">2. TIPOLOGIA DI DATI TRATTATI</h2>
                                    <ul className="list-disc pl-5 space-y-3 body-text">
                                        <li><strong>Dati Anagrafici:</strong> Nome, cognome, data e luogo di nascita, codice fiscale, indirizzo.</li>
                                        <li><strong>Dati di Contatto:</strong> Indirizzo email, numero di telefono.</li>
                                        <li><strong>Dati Documentali:</strong> Estremi del passaporto o carta d’identità (per voli e visti).</li>
                                        <li><strong>Dati Particolari:</strong> Informazioni relative allo stato di salute (es. allergie o necessità speciali) raccolte solo previo consenso per la sicurezza del viaggiatore.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">3. FINALITÀ E BASI GIURIDICHE DEL TRATTAMENTO</h2>
                                    <ul className="list-disc pl-5 space-y-3 body-text">
                                        <li><strong>Esecuzione del Contratto:</strong> Gestione prenotazioni e pacchetti turistici.</li>
                                        <li><strong>Obblighi Legali:</strong> Adempimenti fiscali e amministrativi.</li>
                                        <li><strong>Legittimo Interesse:</strong> Difesa dei diritti e invio di comunicazioni promozionali su servizi analoghi.</li>
                                        <li><strong>Marketing e Newsletter:</strong> Solo previo consenso esplicito.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">4. DESTINATARI E TRASFERIMENTO DATI</h2>
                                    <p className="body-text">
                                        I dati possono essere comunicati a fornitori di servizi turisti (compagnie aeree, hotel), assicurazioni e partner tecnici. Qualora il viaggio sia fuori dallo Spazio Economico Europeo, i dati verranno trasferiti solo per consentire la conclusione del contratto di viaggio.
                                    </p>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">5. PERIODO DI CONSERVAZIONE</h2>
                                    <p className="body-text">
                                        I dati contrattuali vengono conservati per 10 anni dalla conclusione del contratto per obblighi di legge. I dati per marketing fino alla revoca del consenso.
                                    </p>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-[#323232] mb-4">6. DIRITTI DELL'INTERESSATO</h2>
                                    <p className="body-text mb-4">
                                        Ai sensi del GDPR, l'utente ha diritto di accesso, rettifica, cancellazione, limitazione, portabilità e opposizione al trattamento.
                                    </p>
                                    <p className="body-text">Per esercitare tali diritti: <strong>info@gibravo.it</strong></p>
                                </div>

                                <div className="p-8 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <h2 className="text-xl font-bold text-[#323232] mb-2">7. RECLAMO</h2>
                                    <p className="body-text text-slate-700">
                                        L'interessato ha il diritto di proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
        </main>
    )
}
