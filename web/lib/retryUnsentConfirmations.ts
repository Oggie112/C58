import { sql } from './db'
import { sendOrderConfirmation } from './sendOrderConfirmation'
import { retryInSequence, RETRY_BATCH_SIZE, RETRY_GRACE_MINUTES, type RetrySummary } from './retryInSequence'

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
