import React from "react";
import { LanguageProvider } from "@/context/website/language-context";
import { Navbar } from "@/components/website/layout/navbar";
import { Footer } from "@/components/website/layout/footer";

export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen font-[var(--font-montserrat)]">
            <LanguageProvider>
                <Navbar />
                <main className="flex-1">
                    {children}
                </main>
                <Footer />
            </LanguageProvider>
        </div>
    );
}
