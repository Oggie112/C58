import { NextResponse } from 'next/server'
import { decodeSignatureHeader, isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'

// isValidSignature only proves the signature matches the timestamp embedded
// in it — it never checks that timestamp is recent, so a captured valid
// (body, signature) pair is otherwise replayable forever. Sanity retries a
// failed delivery twice at 30s intervals with a 30s timeout per attempt
// (worst case ~150s after the original attempt); this gives a comfortable
// margin above that without leaving the window open indefinitely.
const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000

export type SanityWebhookVerification =
	| { ok: true; rawBody: string }
	| { ok: false; response: NextResponse }

// Shared by every Sanity webhook route, so signature and replay checks can't
// drift between them. Each webhook gets its own secret (named by
// secretEnvVar) so one can be rotated or revoked without touching the other.
// Returns the raw body on success because a Request body can only be read
// once, and the signature has to be checked against the exact raw bytes.
export async function verifySanityWebhook(request: Request, secretEnvVar: string): Promise<SanityWebhookVerification> {
	const secret = process.env[secretEnvVar]
	if (!secret) {
		console.error(`${secretEnvVar} is not set`)
		return { ok: false, response: NextResponse.json({ error: 'Webhook not configured' }, { status: 500 }) }
	}

	const rawBody = await request.text()
	const signature = request.headers.get(SIGNATURE_HEADER_NAME)

	if (!signature || !(await isValidSignature(rawBody, signature, secret))) {
		return { ok: false, response: NextResponse.json({ error: 'Invalid signature' }, { status: 401 }) }
	}

	// Safe to decode again without a try/catch — isValidSignature having
	// already returned true means it successfully decoded this exact header
	// internally, so decoding it a second time here can't throw.
	const { timestamp } = decodeSignatureHeader(signature)
	if (Date.now() - timestamp > SIGNATURE_MAX_AGE_MS) {
		return { ok: false, response: NextResponse.json({ error: 'Signature expired' }, { status: 401 }) }
	}

	return { ok: true, rawBody }
}
