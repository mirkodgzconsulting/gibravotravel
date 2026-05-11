"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Navbar } from "@/components/website/layout/navbar"
import { Footer } from "@/components/website/layout/footer"
import { StickyBanner } from "@/components/website/ui/sticky-banner"
import { WhatsAppButton } from "@/components/website/ui/whatsapp-button"

const LIGURIA_OFFER_PATH = "/offerta-summer-tour-liguria"

export function WebsiteChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const hideSiteShell = pathname === LIGURIA_OFFER_PATH

    if (hideSiteShell) {
        return <div className="flex min-h-screen flex-1 flex-col">{children}</div>
    }

    return (
        <>
            <WhatsAppButton />
            <div className="fixed top-0 z-50 w-full bg-transparent">
                <StickyBanner className="bg-[#003EA3] py-1 text-white" hideOnScroll>
                    <div className="flex w-full items-center justify-center gap-2 text-xs font-medium md:text-sm">
                        <span className="truncate">✨ PRENOTA PRIMA: Fino a 200€ di sconto!</span>
                        <Link
                            href="/partenze"
                            className="whitespace-nowrap font-bold underline hover:no-underline"
                        >
                            Scopri
                        </Link>
                    </div>
                </StickyBanner>
                <Navbar />
            </div>
            <main className="flex-1">{children}</main>
            <Footer />
        </>
    )
}
