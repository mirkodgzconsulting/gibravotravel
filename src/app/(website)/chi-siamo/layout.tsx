import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Chi siamo — Agenzia viaggi Milano",
    description:
        "GiBravo Travel è un'agenzia di viaggio a Milano: viaggi organizzati in gruppo, tour in pullman e in aereo verso Italia ed Europa. Team, valori e sede in via Eustachi.",
    alternates: {
        canonical: "https://www.gibravo.it/chi-siamo",
    },
    openGraph: {
        title: "Chi siamo | GiBravo Travel — Agenzia viaggi Milano",
        description:
            "Team giovane e professionale: viaggi organizzati da Milano in bus e aereo per piccoli gruppi.",
        url: "https://www.gibravo.it/chi-siamo",
        locale: "it_IT",
        type: "website",
    },
};

export default function ChiSiamoLayout({ children }: { children: ReactNode }) {
    return children;
}
