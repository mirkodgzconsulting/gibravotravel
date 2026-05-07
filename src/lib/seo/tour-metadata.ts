const SITE_ORIGIN = "https://www.gibravo.it"

/** Testo plano per meta description (campi CMS possono contenere HTML). */
export function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export function truncateMetaDescription(text: string, max = 158): string {
    const t = text.replace(/\s+/g, " ").trim()
    if (t.length <= max) return t
    return `${t.slice(0, max - 1).trimEnd()}…`
}

export function formatDepartureIt(date: Date | null | undefined): string | null {
    if (!date) return null
    try {
        return new Intl.DateTimeFormat("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(new Date(date))
    } catch {
        return null
    }
}

/** Immagine assoluta per Open Graph (metadataBase copre path relativi, ma i tour usano spesso URL completi). */
export function absoluteOgImage(url: string | null | undefined): string | undefined {
    if (!url?.trim()) return undefined
    const u = url.trim()
    if (u.startsWith("http://") || u.startsWith("https://")) return u
    const path = u.startsWith("/") ? u : `/${u}`
    return `${SITE_ORIGIN}${path}`
}

export type TourMetaFields = {
    titulo: string
    subtitulo?: string | null
    descripcion?: string | null
    type: "aereo" | "bus"
    fechaViaje?: Date | null
    etiquetas?: string[]
}

export function buildTourMetaDescription(tour: TourMetaFields): string {
    if (tour.subtitulo?.trim()) {
        return truncateMetaDescription(tour.subtitulo.trim())
    }
    if (tour.descripcion?.trim()) {
        return truncateMetaDescription(stripHtml(tour.descripcion))
    }

    const modePhrase =
        tour.type === "bus"
            ? "Viaggio organizzato in pullman da Milano"
            : "Viaggio organizzato in aereo da Milano"
    const dep = formatDepartureIt(tour.fechaViaje)
    const mid = `${modePhrase}: ${tour.titulo.trim()}.`
    const tail = dep ? ` Partenza ${dep}.` : ""
    return truncateMetaDescription(
        `${mid}${tail} Gruppi ristretti, assistenza GiBravo Travel.`,
    )
}

/** Segmento titolo per il template globale `%s | GiBravo Travel` (circa 50–60 caratteri). */
const TITLE_SOFT_MAX = 56

export function buildTourTitleSegment(tour: TourMetaFields): string {
    const modeLabel = tour.type === "bus" ? "Pullman" : "Aereo"
    const raw = `${tour.titulo.trim()} · Da Milano (${modeLabel})`
    if (raw.length <= TITLE_SOFT_MAX) return raw
    const tit = tour.titulo.trim()
    if (tit.length <= TITLE_SOFT_MAX) return tit
    return `${tit.slice(0, TITLE_SOFT_MAX - 1).trimEnd()}…`
}

export function buildTourKeywords(tour: TourMetaFields): string[] {
    const core = [
        "viaggi organizzati",
        "viaggi organizzati da Milano",
        "GiBravo Travel",
        tour.type === "bus" ? "viaggio in pullman" : "viaggio in aereo",
        tour.type === "bus" ? "tour bus Milano" : "tour aereo Milano",
        "agenzia viaggi Milano",
    ]
    const tags = (tour.etiquetas ?? []).filter(Boolean).slice(0, 8)
    return [...new Set([...tags, ...core])]
}
