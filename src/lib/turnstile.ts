/** Cloudflare Turnstile server-side verification */

export function isTurnstileEnforced(): boolean {
    return !!process.env.TURNSTILE_SECRET_KEY?.trim()
}

export async function verifyTurnstileToken(
    token: string | undefined,
    req: Request,
): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
    if (!secret) {
        return true
    }

    if (!token || typeof token !== "string" || token.length < 10) {
        return false
    }

    const ip =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()

    const body = new URLSearchParams()
    body.set("secret", secret)
    body.set("response", token)
    if (ip) {
        body.set("remoteip", ip)
    }

    try {
        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
        })
        const json = (await res.json()) as { success?: boolean }
        return json.success === true
    } catch {
        return false
    }
}
