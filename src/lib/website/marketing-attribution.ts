export interface MarketingAttribution {
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    utmContent?: string
    utmTerm?: string
    gclid?: string
    fbclid?: string
    landingPath?: string
    capturedAt?: string
}

const ATTRIBUTION_STORAGE_KEY = "gibravo_marketing_attribution_v1"

function sanitize(value: string | null, maxLength = 120): string | undefined {
    if (!value) return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    return trimmed.slice(0, maxLength)
}

function parseSearch(search: string): URLSearchParams {
    if (!search) return new URLSearchParams()
    if (search.startsWith("?")) return new URLSearchParams(search.slice(1))
    return new URLSearchParams(search)
}

export function getAttributionFromSearch(search: string): Partial<MarketingAttribution> {
    const params = parseSearch(search)

    return {
        utmSource: sanitize(params.get("utm_source")),
        utmMedium: sanitize(params.get("utm_medium")),
        utmCampaign: sanitize(params.get("utm_campaign")),
        utmContent: sanitize(params.get("utm_content")),
        utmTerm: sanitize(params.get("utm_term")),
        gclid: sanitize(params.get("gclid")),
        fbclid: sanitize(params.get("fbclid")),
    }
}

export function readStoredAttribution(): Partial<MarketingAttribution> {
    if (typeof window === "undefined") return {}

    try {
        const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw) as Partial<MarketingAttribution>
        return parsed ?? {}
    } catch {
        return {}
    }
}

export function storeAttribution(
    attribution: Partial<MarketingAttribution>,
): Partial<MarketingAttribution> {
    if (typeof window === "undefined") return attribution

    const existing = readStoredAttribution()
    const merged: Partial<MarketingAttribution> = {
        ...existing,
        ...attribution,
        capturedAt: new Date().toISOString(),
    }

    try {
        window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(merged))
    } catch {
        // no-op
    }

    return merged
}

export function captureAttributionFromLocation(pathname: string, search: string) {
    const fromSearch = getAttributionFromSearch(search)
    const hasCampaignData = Object.values(fromSearch).some(Boolean)

    if (!hasCampaignData) return readStoredAttribution()

    return storeAttribution({
        ...fromSearch,
        landingPath: pathname,
    })
}

export function formatAttributionForMessage(
    attribution: Partial<MarketingAttribution>,
): string | null {
    const parts: string[] = []
    if (attribution.utmCampaign) parts.push(`campaign=${attribution.utmCampaign}`)
    if (attribution.utmSource) parts.push(`source=${attribution.utmSource}`)
    if (attribution.utmMedium) parts.push(`medium=${attribution.utmMedium}`)
    if (attribution.utmContent) parts.push(`content=${attribution.utmContent}`)
    if (attribution.gclid) parts.push(`gclid=${attribution.gclid}`)
    if (attribution.fbclid) parts.push(`fbclid=${attribution.fbclid}`)
    return parts.length > 0 ? parts.join(" | ") : null
}
