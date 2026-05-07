import {
    formatAttributionForMessage,
    readStoredAttribution,
} from "@/lib/website/marketing-attribution"

interface BuildWhatsAppUrlOptions {
    phoneNumber: string
    baseMessage: string
    section?: string
}

export function buildWhatsAppUrl({
    phoneNumber,
    baseMessage,
    section,
}: BuildWhatsAppUrlOptions): string {
    const cleanPhone = phoneNumber.replace(/\D/g, "")
    const attribution = readStoredAttribution()
    const attributionText = formatAttributionForMessage(attribution)

    let finalMessage = baseMessage.trim()
    if (section) {
        finalMessage += `\n\nSezione: ${section}`
    }
    if (attributionText) {
        finalMessage += `\nOrigine: ${attributionText}`
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMessage)}`
}
