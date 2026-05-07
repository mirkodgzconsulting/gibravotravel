import { NextResponse } from "next/server"

import { sendContactFormEmail } from "@/lib/email"
import { verifyTurnstileToken } from "@/lib/turnstile"

const MAX_MESSAGE = 8000
const MAX_NAME = 120
const MAX_PHONE = 40

/** POST pubblico: modulo Contatti → email tramite Resend (vedi RESEND_API_KEY). */
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

    // Honeypot anti-bot: non compilare nel frontend
    const trap = o.website
    if (typeof trap === "string" && trap.trim().length > 0) {
        return NextResponse.json({ ok: true })
    }

    const turnstileToken =
        typeof o.cfTurnstileResponse === "string" ? o.cfTurnstileResponse : undefined
    if (!(await verifyTurnstileToken(turnstileToken, req))) {
        return NextResponse.json(
            { error: "Verifica di sicurezza non superata. Riprova." },
            { status: 403 },
        )
    }

    const name = typeof o.name === "string" ? o.name.trim() : ""
    const email = typeof o.email === "string" ? o.email.trim() : ""
    const phone =
        typeof o.phone === "string" && o.phone.trim().length > 0
            ? o.phone.trim().slice(0, MAX_PHONE)
            : undefined
    const message = typeof o.message === "string" ? o.message.trim() : ""
    const newsletter = o.newsletter === true

    if (name.length < 2 || name.length > MAX_NAME) {
        return NextResponse.json({ error: "Nome non valido" }, { status: 400 })
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!emailOk || email.length > 254) {
        return NextResponse.json({ error: "Email non valida" }, { status: 400 })
    }

    if (message.length < 10 || message.length > MAX_MESSAGE) {
        return NextResponse.json(
            { error: "Messaggio troppo breve o troppo lungo" },
            { status: 400 },
        )
    }

    const result = await sendContactFormEmail({
        name,
        email,
        phone,
        message,
        newsletter,
    })

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
