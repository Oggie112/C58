import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { retryUnsentConfirmations } from '@/lib/retryUnsentConfirmations'

// Called hourly by .github/workflows/retry-confirmations.yml (8API.4).
// POST, not GET: it has side effects, and is never prerendered or cached.
// It takes no input and only ever re-sends to an order's own buyer, but is
// still secret-protected so nobody else can spend the Brevo quota.
export async function POST(request: Request) {
	const secret = process.env.CRON_SECRET
	if (!secret) {
		console.error('CRON_SECRET is not set')
		return NextResponse.json({ error: 'Not configured' }, { status: 500 })
	}

	if (!isAuthorised(request.headers.get('authorization'), secret)) {
		return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
	}

	// Counts only — this response is printed in public GitHub Actions logs.
	return NextResponse.json(await retryUnsentConfirmations())
}

// Constant-time comparison so response timing can't reveal the secret byte
// by byte. Hashing first gives timingSafeEqual the equal-length inputs it
// requires without leaking the secret's length either.
function isAuthorised(header: string | null, secret: string): boolean {
	if (!header) return false
	const digest = (value: string) => createHash('sha256').update(value).digest()
	return timingSafeEqual(digest(header), digest(`Bearer ${secret}`))
}
