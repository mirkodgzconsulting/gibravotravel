import { NextResponse } from "next/server"

import { sendNewsletterSignupNotification } from "@/lib/email"
import { verifyTurnstileToken } from "@/lib/turnstile"

/** POST: iscrizione newsletter (footer) → email interna via Resend */
export async function POST(req: Request) {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 })
    }

    if (!body || typeof body !== "object") {
        return NextResponse.json({ error: "Dati mancanti" }, { status: 400 })
    }

    const o = body as Record<string, unknown>

    const trap = o.website
    if (typeof trap === "string" && trap.trim().length > 0) {
        return NextResponse.json({ ok: true })
    }

    if (o.privacy !== true) {
        return NextResponse.json({ error: "È necessario accettare la privacy policy" }, { status: 400 })
    }

    const email = typeof o.email === "string" ? o.email.trim() : ""
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailOk || email.length > 254) {
        return NextResponse.json({ error: "Email non valida" }, { status: 400 })
    }

    const turnstileToken =
        typeof o.cfTurnstileResponse === "string" ? o.cfTurnstileResponse : undefined
    if (!(await verifyTurnstileToken(turnstileToken, req))) {
        return NextResponse.json(
            { error: "Verifica di sicurezza non superata. Riprova." },
            { status: 403 },
        )
    }

    const result = await sendNewsletterSignupNotification(email)
    if (!result.ok) {
        if (result.reason === "missing_key") {
            return NextResponse.json(
                { error: "Servizio temporaneamente non disponibile" },
                { status: 503 },
            )
        }
        return NextResponse.json({ error: "Invio non riuscito. Riprova più tardi." }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
}
