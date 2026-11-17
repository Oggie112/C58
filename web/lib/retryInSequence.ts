// Failures in a row that mean "account-wide problem" (quota, outage, bad
// key) rather than one bad order — stop and leave the rest for the next run.
export const MAX_CONSECUTIVE_FAILURES = 3

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
