import React from "react";
import { Navbar } from "@/components/website/layout/navbar";
import { Footer } from "@/components/website/layout/footer";
import { StickyBanner } from "@/components/website/ui/sticky-banner";

export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen font-[var(--font-montserrat)]">
            <div className="sticky top-0 z-50 w-full">
                <StickyBanner className="bg-gradient-to-r from-[#004ba5] to-[#003580] text-white py-1">
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
