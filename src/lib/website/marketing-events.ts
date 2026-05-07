import { readStoredAttribution } from "@/lib/website/marketing-attribution"

declare global {
    interface Window {
        dataLayer?: Record<string, unknown>[]
        gtag?: (...args: unknown[]) => void
        fbq?: (...args: unknown[]) => void
    }
}

export interface WhatsAppClickPayload {
    section: string
    placement: string
    ctaText?: string
    href?: string
}

export function trackWhatsAppClick(payload: WhatsAppClickPayload) {
    if (typeof window === "undefined") return

    const attribution = readStoredAttribution()
    const eventPayload = {
        ...payload,
        pagePath: window.location.pathname,
        utmSource: attribution.utmSource ?? null,
        utmMedium: attribution.utmMedium ?? null,
        utmCampaign: attribution.utmCampaign ?? null,
        utmContent: attribution.utmContent ?? null,
        gclid: attribution.gclid ?? null,
        fbclid: attribution.fbclid ?? null,
        eventTime: Date.now(),
    }

    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push({
        event: "whatsapp_click",
        ...eventPayload,
    })

    if (typeof window.gtag === "function") {
        window.gtag("event", "whatsapp_click", eventPayload)
    }

    if (typeof window.fbq === "function") {
        window.fbq("trackCustom", "WhatsAppClick", eventPayload)
    }
}
