import { RevealOnScroll } from "@/components/website/ui/reveal-on-scroll"

export default function TerminiCondizioniPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Mini Hero */}
            <section className="bg-gradient-to-r from-[#004ba5] to-[#003580] py-16 flex items-center min-h-[220px]">
                <div className="container mx-auto px-4 max-w-5xl">
                    <RevealOnScroll>
                        <h1 className="section-title text-white text-3xl md:text-4xl text-left">
                            Termini e Condizioni di Vendita
                        </h1>
                    </RevealOnScroll>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-20 lg:py-24">
                <div className="container mx-auto px-4 max-w-5xl">
                    <RevealOnScroll>
                        <div className="space-y-10">
                            <h2 className="text-xl font-bold text-[#323232] uppercase tracking-tight">
                                GIBRAVO TRAVEL - CONTRATTO DI VIAGGIO
                            </h2>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-[700] text-[#323232] mb-3">1. OGGETTO DEL CONTRATTO</h3>
                                    <p className="body-text">
                                        Le presenti condizioni generali disciplinano l'acquisto di pacchetti turistici e servizi di viaggio effettuati tramite il sito o presso la sede di GIBRAVO TRAVEL, con sede in Via Bartolomeo Eustachi, 30, 20129 Milano.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-[700] text-[#323232] mb-3">2. PRENOTAZIONI E CONCLUSIONE DEL CONTRATTO</h3>
                                    <p className="body-text">
                                        La prenotazione si considera perfezionata solo nel momento in cui GIBRAVO TRAVEL invia la conferma scritta al cliente e riceve il pagamento (acconto o saldo). Il cliente deve verificare la correttezza dei dati sui documenti di viaggio immediatamente dopo la ricezione.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-[700] text-[#323232] mb-3">3. PAGAMENTI E SICUREZZA (STRIPE)</h3>
                                    <p className="body-text mb-4">
                                        Per garantire la massima sicurezza ai nostri clienti, GIBRAVO TRAVEL utilizza la piattaforma Stripe per la gestione dei pagamenti elettronici.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-3 body-text">
                                        <li><strong>Modalità:</strong> Accettiamo le principali carte di credito, debito e altri metodi di pagamento supportati da Stripe.</li>
                                        <li><strong>Sicurezza:</strong> GIBRAVO TRAVEL non archivia nei propri sistemi i dati sensibili della carta di credito. Tutte le transazioni sono criptate e gestite direttamente dai server sicuri di Stripe in conformità con gli standard PCI-DSS.</li>
                                        <li><strong>Tempistiche:</strong> Il saldo del viaggio deve essere effettuato entro i termini indicati nella conferma di prenotazione. Il mancato pagamento entro le scadenze comporta la risoluzione del contratto.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-[700] text-[#323232] mb-3">4. PREZZI E REVISIONE</h3>
                                    <p className="body-text">
                                        Il prezzo del pacchetto turistico è determinato nel contratto. Il prezzo può essere variato fino a 20 giorni precedenti la partenza soltanto in conseguenza alle variazioni di:
                                    </p>
                                    <ul className="list-disc pl-5 mt-4 space-y-2 body-text">
                                        <li>Costo del trasporto (es. carburante aereo).</li>
                                        <li>Diritti e tasse su servizi turistici (es. tasse aeroportuali).</li>
                                        <li>Tassi di cambio applicati al pacchetto.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-[700] text-[#323232] mb-3">5. RECESSO E CANCELLAZIONE</h3>
                                    <ul className="list-disc pl-5 space-y-3 body-text">
                                        <li><strong>Recesso del Cliente:</strong> In caso di cancellazione da parte del cliente, verranno applicate le penali indicate nella scheda tecnica del viaggio o nelle condizioni del tour operator partner.</li>
                                        <li><strong>Recesso per Forza Maggiore:</strong> GIBRAVO TRAVEL non è responsabile per inadempimenti causati da eventi di forza maggiore, calamità naturali o restrizioni governative improvvise.</li>
                                    </ul>
                                </div>

                                <div>
                                    <h3 className="text-lg font-[700] text-[#323232] mb-3">6. ASSICURAZIONI</h3>
                                    <p className="body-text">
                                        Salvo diversamente indicato, le polizze assicurative per annullamento o spese mediche sono facoltative ma caldamente raccomandate. GIBRAVO TRAVEL offre soluzioni assicurative tramite partner selezionati al momento della prenotazione.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-[700] text-[#323232] mb-3">7. RESPONSABILITÀ DEL TOUR OPERATOR</h3>
                                    <p className="body-text">
                                        GIBRAVO TRAVEL opera come organizzatore o intermediario di viaggi ai sensi del Codice del Turismo. La responsabilità nei confronti del viaggiatore è regolata dalle convenzioni internazionali e dalle leggi vigenti in Italia.
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-[700] text-[#323232] mb-3">8. LEGGE APPLICABILE E FORO COMPETENTE</h3>
                                    <p className="body-text">
                                        Il presente contratto è regolato dalla legge italiana. Per qualsiasi controversia sarà competente in via esclusiva il Foro di Milano.
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
