import { Bangers, Outfit } from "next/font/google"
import type { ReactNode } from "react"

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
})

const bangers = Bangers({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-bangers",
    display: "swap",
})

export default function OffertaLiguriaLayout({ children }: { children: ReactNode }) {
    return (
        <div className={`liguria-offer-page ${outfit.variable} ${bangers.variable}`}>{children}</div>
    )
}
