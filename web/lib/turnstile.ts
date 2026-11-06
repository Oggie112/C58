const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface VerifyResponse {
	success: boolean
	// Cloudflare's fixed reason codes, e.g. "invalid-input-secret",
	// "timeout-or-duplicate" — no token or visitor data
	'error-codes'?: string[]
}

// Every rejection is logged with Cloudflare's reason: a misconfigured secret
// or site key otherwise looks, from the buyer's side, like a challenge that
// keeps coming back — with nothing in the server logs to say why.
export async function verifyTurnstileToken(token: string, remoteIp: string): Promise<boolean> {
	const secret = process.env.TURNSTILE_SECRET_KEY
	if (!secret) throw new Error('TURNSTILE_SECRET_KEY is not set')

	const httpResponse = await fetch(TURNSTILE_VERIFY_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		// "response" here is Cloudflare's own required field name for the
		// solved token — not related to the httpResponse variable above.
		body: JSON.stringify({ secret, response: token, remoteip: remoteIp }),
	})

	if (!httpResponse.ok) {
		console.warn(`Turnstile verification unavailable: siteverify returned HTTP ${httpResponse.status}`)
		return false
	}

	const body = (await httpResponse.json()) as VerifyResponse
	if (!body.success) {
		console.warn(`Turnstile verification rejected: ${body['error-codes']?.join(', ') || 'no reason given'}`)
	}
	return body.success
}
