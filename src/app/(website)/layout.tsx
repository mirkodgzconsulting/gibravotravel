import React from "react";
import { Navbar } from "@/components/website/layout/navbar";
import { Footer } from "@/components/website/layout/footer";
import { StickyBanner } from "@/components/website/ui/sticky-banner";
import { WelcomeLoader } from "@/components/website/layout/welcome-loader";
import { WhatsAppButton } from "@/components/website/ui/whatsapp-button";

export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen font-[var(--font-montserrat)]">
            <WelcomeLoader />
            <WhatsAppButton />
            <div className="fixed top-0 z-50 w-full bg-transparent">
                <StickyBanner className="bg-[#003EA3] text-white py-1" hideOnScroll>
                    <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-medium w-full">
                        <span className="truncate">✨ PRENOTA PRIMA: Fino a 200€ di sconto!</span>
                        <button className="underline hover:no-underline whitespace-nowrap font-bold">
                            Scopri
                        </button>
                    </div>
                </StickyBanner>
                <Navbar />
            </div>
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}
