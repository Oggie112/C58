const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface VerifyResponse {
	success: boolean
}

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

	if (!httpResponse.ok) return false

	const body = (await httpResponse.json()) as VerifyResponse
	return body.success
}
