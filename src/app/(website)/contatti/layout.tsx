import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Contatti — Scrivici",
    description:
        "Contatta GiBravo Travel a Milano: telefono 02 8219 7645, sede in via Eustachi 30, email info@gibravo.it. Modulo online per richieste e preventivi.",
    alternates: {
        canonical: "https://www.gibravo.it/contatti",
    },
    openGraph: {
        title: "Contatti | GiBravo Travel Milano",
        description: "Sede, orari e modulo di contatto dell'agenzia viaggi GiBravo Travel.",
        url: "https://www.gibravo.it/contatti",
        locale: "it_IT",
        type: "website",
    },
};

export default function ContattiLayout({ children }: { children: ReactNode }) {
    return children;
}
