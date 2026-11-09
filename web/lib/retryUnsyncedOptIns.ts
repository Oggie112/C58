import { sql } from './db'
import { syncMarketingOptIn } from './syncMarketingOptIn'
import { retryInSequence } from './retryInSequence'
import { RETRY_BATCH_SIZE, RETRY_GRACE_MINUTES } from './retryUnsentConfirmations'

export interface OptInRetrySummary {
	found: number
	synced: number
	skipped: number
	failed: number
	stoppedEarly: boolean
}

// The marketing-list half of the scheduled retry (8API.3/8API.4): paid,
// opted-in orders whose buyer never made it onto the Brevo list. Same
// grace period, batch size and stop-after-three rule as the confirmation
// retry; counts only, as the summary is printed in public GitHub logs.
export async function retryUnsyncedOptIns(): Promise<OptInRetrySummary> {
	const orders = await sql<{ id: string }[]>`
		select id from orders
		where status = 'paid'
			and marketing_opt_in
			and marketing_synced_at is null
			and created_at < now() - make_interval(mins => ${RETRY_GRACE_MINUTES})
		order by created_at
		limit ${RETRY_BATCH_SIZE}
	`

	const { counts, stoppedEarly } = await retryInSequence(
		orders.map((order) => order.id),
		['synced', 'skipped', 'failed'] as const,
		syncMarketingOptIn,
	)
	return { found: orders.length, ...counts, stoppedEarly }
}
