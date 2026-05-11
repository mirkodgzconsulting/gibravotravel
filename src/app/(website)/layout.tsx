import React, { Suspense } from "react";
import { OrganizationJsonLd } from "@/components/website/seo/organization-json-ld";
import { WelcomeLoader } from "@/components/website/layout/welcome-loader";
import { MarketingTracking } from "@/components/website/analytics/marketing-tracking";
import { WebsiteChrome } from "@/components/website/website-chrome";

export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen font-[var(--font-montserrat)]">
            <Suspense fallback={null}>
                <MarketingTracking />
            </Suspense>
            <OrganizationJsonLd />
            <WelcomeLoader />
            <WebsiteChrome>{children}</WebsiteChrome>
        </div>
    );
}
