import { sql } from './db'
import { sendOrderConfirmation } from './sendOrderConfirmation'

// Skip orders this young: their webhook/order-page send may still be in
// flight. Measured from created_at (reservation time) — there's no paid_at —
// so an order paid late in its checkout window can still overlap a live
// send; the sender's atomic claim makes that harmless (one 'skipped').
export const RETRY_GRACE_MINUTES = 5
// Bounds one run's duration; a larger backlog drains over successive runs.
export const RETRY_BATCH_SIZE = 50
// Failures in a row that mean "account-wide problem" (quota, outage, bad
// key) rather than one bad order — stop and leave the rest for the next run.
export const MAX_CONSECUTIVE_FAILURES = 3

export interface RetrySummary {
	found: number
	sent: number
	skipped: number
	failed: number
	stoppedEarly: boolean
}

// Scheduled retry (8API.4) for paid orders whose confirmation email never
// went out. Without it, a failed send is only retried when the buyer reopens
// their order page. Sequential on purpose: gentle on Brevo, and lets a run
// stop as soon as failures look account-wide. Counts only in the summary —
// it's printed in public GitHub Actions logs; per-order detail is in the
// sender's own (private) server logs.
export async function retryUnsentConfirmations(): Promise<RetrySummary> {
	const orders = await sql<{ id: string }[]>`
		select id from orders
		where status = 'paid'
			and confirmation_sent_at is null
			and created_at < now() - make_interval(mins => ${RETRY_GRACE_MINUTES})
		order by created_at
		limit ${RETRY_BATCH_SIZE}
	`

	const summary: RetrySummary = { found: orders.length, sent: 0, skipped: 0, failed: 0, stoppedEarly: false }
	let consecutiveFailures = 0

	for (const order of orders) {
		const outcome = await sendOrderConfirmation(order.id)
		summary[outcome] += 1

		consecutiveFailures = outcome === 'failed' ? consecutiveFailures + 1 : 0
		if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
			summary.stoppedEarly = true
			break
		}
	}

	return summary
}
