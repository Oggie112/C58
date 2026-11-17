import { sql } from './db'
import { sendOrderConfirmation } from './sendOrderConfirmation'
import { retryInSequence } from './retryInSequence'

// Skip orders this young: their webhook/order-page send may still be in
// flight. Measured from created_at (reservation time) — there's no paid_at —
// so an order paid late in its checkout window can still overlap a live
// send; the sender's atomic claim makes that harmless (one 'skipped').
export const RETRY_GRACE_MINUTES = 5
// Bounds one run's duration (~1s per send), keeping it well inside any
// platform function timeout: a run killed mid-send would leave that order
// claimed but never sent. A larger backlog drains over successive runs;
// 20/hour already exceeds the Free plan's daily quota.
export const RETRY_BATCH_SIZE = 20

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

	const { counts, stoppedEarly } = await retryInSequence(
		orders.map((order) => order.id),
		['sent', 'skipped', 'failed'] as const,
		sendOrderConfirmation,
	)
	return { found: orders.length, ...counts, stoppedEarly }
}
