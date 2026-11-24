// Failures in a row that mean "account-wide problem" (quota, outage, bad
// key) rather than one bad order — stop and leave the rest for the next run.
export const MAX_CONSECUTIVE_FAILURES = 3

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

// One retry's outcome counts — printed in public GitHub Actions logs, so
// counts only, never order detail
export interface RetrySummary {
	found: number
	sent: number
	skipped: number
	failed: number
	stoppedEarly: boolean
}

export interface SequenceResult<Outcome extends string> {
	counts: Record<Outcome, number>
	stoppedEarly: boolean
}

// Shared by the scheduled retries (8API.4): attempts each id one at a time,
// tallying outcomes, and stops after MAX_CONSECUTIVE_FAILURES 'failed' in a
// row. Any other outcome resets the run of failures, so scattered failures
// never block the rest of the queue.
export async function retryInSequence<Outcome extends string>(
	ids: string[],
	outcomes: readonly Outcome[],
	attempt: (id: string) => Promise<Outcome>,
): Promise<SequenceResult<Outcome>> {
	const counts = Object.fromEntries(outcomes.map((outcome) => [outcome, 0])) as Record<Outcome, number>
	let consecutiveFailures = 0

	for (const id of ids) {
		const outcome = await attempt(id)
		counts[outcome] += 1

		consecutiveFailures = outcome === 'failed' ? consecutiveFailures + 1 : 0
		if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) return { counts, stoppedEarly: true }
	}

	return { counts, stoppedEarly: false }
}
