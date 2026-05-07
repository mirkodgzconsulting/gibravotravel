"use client"

import { useEffect } from "react"
import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { captureAttributionFromLocation } from "@/lib/website/marketing-attribution"

const ga4Id = process.env.NEXT_PUBLIC_GA4_ID
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

export function MarketingTracking() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        const currentPath = pathname || "/"
        const query = searchParams.toString()
        const search = query ? `?${query}` : ""

        captureAttributionFromLocation(currentPath, search)

        const fullPath = `${currentPath}${search}`
        if (ga4Id && typeof window.gtag === "function") {
            window.gtag("event", "page_view", {
                page_path: fullPath,
                page_location: window.location.href,
                page_title: document.title,
            })
        }

        if (metaPixelId && typeof window.fbq === "function") {
            window.fbq("track", "PageView")
        }
    }, [pathname, searchParams])

    return (
        <>
            {ga4Id ? (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
                        strategy="afterInteractive"
                    />
                    <Script id="ga4-init" strategy="afterInteractive">
                        {`
                          window.dataLayer = window.dataLayer || [];
                          function gtag(){dataLayer.push(arguments);}
                          window.gtag = gtag;
                          gtag('js', new Date());
                          gtag('config', '${ga4Id}', { send_page_view: false });
                        `}
                    </Script>
                </>
            ) : null}

            {metaPixelId ? (
                <Script id="meta-pixel-init" strategy="afterInteractive">
                    {`
                      !function(f,b,e,v,n,t,s){
                        if(f.fbq)return;
                        n=f.fbq=function(){n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;
                        n.push=n;
                        n.loaded=!0;
                        n.version='2.0';
                        n.queue=[];
                        t=b.createElement(e);t.async=!0;
                        t.src=v;
                        s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)
                      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
                      fbq('init', '${metaPixelId}');
                    `}
                </Script>
            ) : null}
        </>
    )
}
