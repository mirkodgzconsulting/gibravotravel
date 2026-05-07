import type { Metadata } from "next"
import { SummerTourLiguriaClient } from "./summer-tour-liguria-client"

export const metadata: Metadata = {
    title: "Summer Tour Liguria 2026 | Offerta Limitata GiBravo Travel",
    description:
        "Vivi l'estate al massimo con il Summer Tour Liguria di GiBravo Travel: bus GT A/R, coordinatore, 9 ore di mare e offerta limitata a 40EUR.",
    alternates: {
        canonical: "/offerta-summer-tour-liguria",
    },
    openGraph: {
        title: "Summer Tour Liguria | Offerta limitata a 40EUR",
        description:
            "Gruppi organizzati, mare, relax e divertimento. Prenota ora su WhatsApp: posti limitati.",
        url: "https://www.gibravo.it/offerta-summer-tour-liguria",
        type: "website",
        images: [
            {
                url: "https://res.cloudinary.com/dskliu1ig/image/upload/v1768252163/img-hero2_xx72si.jpg",
                width: 1200,
                height: 630,
                alt: "Summer Tour Liguria - GiBravo Travel",
            },
        ],
    },
}

export default function SummerTourLiguriaPage() {
    return <SummerTourLiguriaClient />
}
