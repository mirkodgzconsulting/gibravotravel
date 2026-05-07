"use client"

import * as React from "react"
import { Turnstile } from "@marsidev/react-turnstile"

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/** Widget Cloudflare Turnstile (solo si è configurato NEXT_PUBLIC_TURNSTILE_SITE_KEY). */
export function TurnstileWidget({
    onToken,
    className,
}: {
    onToken: (token: string | null) => void
    className?: string
}) {
    if (!siteKey) {
        return null
    }

    return (
        <div className={className}>
            <Turnstile
                siteKey={siteKey}
                onSuccess={(token) => onToken(token)}
                onExpire={() => onToken(null)}
                onError={() => onToken(null)}
                options={{ theme: "light", language: "it" }}
            />
        </div>
    )
}

export function useTurnstileRequired(): boolean {
    return React.useMemo(() => !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY, [])
}
