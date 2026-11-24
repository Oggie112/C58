import { sql } from './db'
import { sendTicketResend } from './sendTicketResend'
import { retryInSequence, RETRY_GRACE_MINUTES, type RetrySummary } from './retryInSequence'

// Fewer than the confirmations' 20: both run in the same endpoint call,
// within pg_net's 60s timeout, at ~1s per send — and first confirmations
// come first, so resends never take quota from new buyers
export const RESEND_RETRY_BATCH_SIZE = 10

// Scheduled retry (8UI.3) for queued resends a failed send left behind
// (Brevo quota, outage). Skips requests younger than the grace period —
// the form's own send may still be in flight; the claim makes an overlap
// harmless anyway. Counts only: printed in public GitHub Actions logs.
export async function retryRequestedResends(): Promise<RetrySummary> {
	const orders = await sql<{ id: string }[]>`
		select id from orders
		where status = 'paid'
			and resend_requested_at is not null
			and resend_requested_at < now() - make_interval(mins => ${RETRY_GRACE_MINUTES})
		order by resend_requested_at
		limit ${RESEND_RETRY_BATCH_SIZE}
	`

	const { counts, stoppedEarly } = await retryInSequence(
		orders.map((order) => order.id),
		['sent', 'skipped', 'failed'] as const,
		sendTicketResend,
	)
	return { found: orders.length, ...counts, stoppedEarly }
}
