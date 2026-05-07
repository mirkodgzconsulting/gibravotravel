"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/website/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { TurnstileWidget, useTurnstileRequired } from "./turnstile-widget"

export function NewsletterSignupForm({ className }: { className?: string }) {
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

        const form = e.currentTarget
        const fd = new FormData(form)
        const privacy = fd.get("privacy") === "on"

        if (!privacy) {
            setErrorMsg("Per iscriverti devi accettare la privacy policy.")
            return
        }

        if (turnstileRequired && !turnstileToken) {
            setErrorMsg("Completa la verifica di sicurezza prima di inviare.")
            return
        }

        const payload = {
            email: String(fd.get("email") ?? "").trim(),
            privacy: true as const,
            website: String(fd.get("website") ?? ""),
            cfTurnstileResponse: turnstileToken ?? "",
        }

        setState("loading")

        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = (await res.json().catch(() => ({}))) as { error?: string }

            if (!res.ok) {
                setState("error")
                setErrorMsg(data.error ?? "Impossibile completare l'iscrizione.")
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
                    "w-full max-w-[460px] rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm text-center",
                    className,
                )}
            >
                <p className="text-lg font-semibold text-emerald-900">Iscrizione ricevuta</p>
                <p className="mt-2 text-sm text-emerald-800/90">
                    Grazie! Ti terremo aggiornato su novità e offerte GiBravo Travel.
                </p>
                <Button type="button" className="mt-6" onClick={() => setState("idle")}>
                    Iscrivi un&apos;altra email
                </Button>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "w-full max-w-[460px] rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-2",
                className,
            )}
        >
            <form onSubmit={onSubmit} className="relative flex flex-col gap-4">
                <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
                    <label htmlFor="nl-website">Non compilare</label>
                    <input type="text" id="nl-website" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="nl-email">La tua email</Label>
                    <Input
                        id="nl-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="nome@email.it"
                        className="h-11 bg-white"
                    />
                </div>

                <TurnstileWidget onToken={onTurnstileToken} className="flex justify-center sm:justify-start" />

                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="nl-privacy"
                        name="privacy"
                        required
                        className="mt-1 size-4 rounded border-slate-300"
                    />
                    <Label htmlFor="nl-privacy" className="font-normal leading-snug text-slate-600 text-sm">
                        Acconsento al trattamento dei dati per la newsletter come da{" "}
                        <Link href="/informativa-privacy" className="text-[#003ea3] underline">
                            informativa privacy
                        </Link>
                        .
                    </Label>
                </div>

                {state === "error" && errorMsg && (
                    <p className="text-sm text-red-600" role="alert">
                        {errorMsg}
                    </p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={state === "loading"}>
                    {state === "loading" ? "Invio…" : "Iscriviti alla newsletter"}
                </Button>

                
            </form>
        </div>
    )
}
