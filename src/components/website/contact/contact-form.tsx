"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/website/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { TurnstileWidget, useTurnstileRequired } from "./turnstile-widget"

export function ContactForm({ className }: { className?: string }) {
    const [state, setState] = React.useState<"idle" | "loading" | "success" | "error">("idle")
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
    const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null)
    const turnstileRequired = useTurnstileRequired()
    const onTurnstileToken = React.useCallback((t: string | null) => {
        setTurnstileToken(t)
    }, [])

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setErrorMsg(null)

        if (turnstileRequired && !turnstileToken) {
            setErrorMsg("Completa la verifica di sicurezza prima di inviare.")
            return
        }

        setState("loading")

        const form = e.currentTarget
        const fd = new FormData(form)
        const payload = {
            name: String(fd.get("name") ?? "").trim(),
            email: String(fd.get("email") ?? "").trim(),
            phone: String(fd.get("phone") ?? "").trim(),
            message: String(fd.get("message") ?? "").trim(),
            newsletter: fd.get("newsletter") === "on",
            website: String(fd.get("website") ?? ""),
            cfTurnstileResponse: turnstileToken ?? "",
        }

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = (await res.json().catch(() => ({}))) as { error?: string }

            if (!res.ok) {
                setState("error")
                setErrorMsg(data.error ?? "Impossibile inviare. Riprova.")
                return
            }

            setState("success")
            form.reset()
            setTurnstileToken(null)
        } catch {
            setState("error")
            setErrorMsg("Errore di rete. Riprova.")
        }
    }

    if (state === "success") {
        return (
            <div
                className={cn(
                    "rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm",
                    className,
                )}
            >
                <p className="text-lg font-semibold text-emerald-900">Messaggio inviato</p>
                <p className="mt-2 text-emerald-800/90">
                    Ti risponderemo al più presto. Grazie per aver scelto GiBravo Travel.
                </p>
                <Button type="button" className="mt-6" onClick={() => setState("idle")}>
                    Invia un altro messaggio
                </Button>
            </div>
        )
    }

    return (
        <div
            id="modulo-contatti"
            className={cn(
                "rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8",
                className,
            )}
        >
            <h3 className="text-xl font-bold text-[#323232] mb-2">Scrivici</h3>
            <p className="text-sm text-slate-600 mb-6">
                Compila il modulo: riceverai una risposta via email. Per la newsletter indica la preferenza
                qui sotto.
            </p>

            <form onSubmit={onSubmit} className="relative flex flex-col gap-5">
                {/* Honeypot — lasciare vuoto */}
                <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
                    <label htmlFor="contact-website">Non compilare</label>
                    <input
                        type="text"
                        id="contact-website"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contact-name">Nome e cognome *</Label>
                    <Input
                        id="contact-name"
                        name="name"
                        required
                        minLength={2}
                        maxLength={120}
                        autoComplete="name"
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contact-email">Email *</Label>
                    <Input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contact-phone">Telefono (opzionale)</Label>
                    <Input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        maxLength={40}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contact-message">Messaggio *</Label>
                    <textarea
                        id="contact-message"
                        name="message"
                        required
                        minLength={10}
                        maxLength={8000}
                        rows={6}
                        className={cn(
                            "placeholder:text-muted-foreground border-input w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none",
                            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                            "md:text-sm",
                        )}
                        placeholder="Come possiamo aiutarti?"
                    />
                </div>

                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="contact-newsletter"
                        name="newsletter"
                        className="mt-1 size-4 rounded border-slate-300"
                    />
                    <Label htmlFor="contact-newsletter" className="font-normal leading-snug text-slate-600">
                        Desidero ricevere novità e offerte (newsletter).
                    </Label>
                </div>

                <p className="text-xs text-slate-500">
                    Inviando il modulo accetti il trattamento dei dati come da{" "}
                    <Link href="/informativa-privacy" className="text-[#003ea3] underline">
                        informativa privacy
                    </Link>
                    .
                </p>

                <TurnstileWidget onToken={onTurnstileToken} className="flex justify-center" />

                {state === "error" && errorMsg && (
                    <p className="text-sm text-red-600" role="alert">
                        {errorMsg}
                    </p>
                )}

                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={state === "loading"}>
                    {state === "loading" ? "Invio in corso…" : "Invia messaggio"}
                </Button>
            </form>
        </div>
    )
}
