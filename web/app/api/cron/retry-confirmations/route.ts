import { createHash, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { retryUnsentConfirmations } from '@/lib/retryUnsentConfirmations'
import { retryUnsyncedOptIns } from '@/lib/retryUnsyncedOptIns'
import { retryRequestedResends } from '@/lib/retryRequestedResends'

// Called hourly by a Supabase pg_cron job (8API.6, migration
// 20261123120000_schedule_follow_up_retry.sql) and daily by
// .github/workflows/retry-confirmations.yml, the watchdog that alerts (8API.4).
// Retries every paid-order follow-up — confirmation emails, ticket resends
// requested through /orders (8UI.3) and marketing-list sync (8API.3) —
// despite the path's name.
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

	// First confirmations, then resends — a new buyer's first email comes
	// before anyone's second, when the Brevo quota is tight — then the
	// mailing list. Counts only: printed in public GitHub Actions logs.
	const confirmations = await retryUnsentConfirmations()
	const resends = await retryRequestedResends()
	const marketing = await retryUnsyncedOptIns()
	return NextResponse.json({ confirmations, resends, marketing })
}

// Constant-time comparison so response timing can't reveal the secret byte
// by byte. Hashing first gives timingSafeEqual the equal-length inputs it
// requires without leaking the secret's length either.
function isAuthorised(header: string | null, secret: string): boolean {
	if (!header) return false
	const digest = (value: string) => createHash('sha256').update(value).digest()
	return timingSafeEqual(digest(header), digest(`Bearer ${secret}`))
}
