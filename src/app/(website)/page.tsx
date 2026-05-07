import type { Metadata } from "next";

import { HomeClient } from "./home-client";

/** Home statica ricostruibile (ISR): niente query DB qui = TTFB e payload server più bassi. */
export const revalidate = 120;

export const metadata: Metadata = {
    title: "Agenzia viaggi Milano — Viaggi organizzati bus e aereo",
    description:
        "GiBravo Travel: agenzia di viaggio a Milano per viaggi organizzati in gruppo. Partenze in pullman e in aereo verso Italia ed Europa. Scopri le prossime date.",
    alternates: {
        canonical: "https://www.gibravo.it/",
    },
    openGraph: {
        title: "GiBravo Travel | Agenzia viaggi Milano — Viaggi organizzati",
        description:
            "Viaggi organizzati da Milano in piccoli gruppi: tour in bus e aereo. Destinazioni in Italia e Europa.",
        url: "https://www.gibravo.it/",
        locale: "it_IT",
        type: "website",
    },
};

export default function HomePage() {
    return <HomeClient />
}