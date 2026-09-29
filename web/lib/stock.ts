import type { SanityTier } from '@/types/sanity'

export interface TierAvailability {
	capacity: number
	reserved: number
}

export interface TierStock {
	remaining: number
	isOpen: boolean
}

// Pure function, no DB access — safe to import from client components.
// `isOpen` for a `previousSoldOut` tier depends on the *previous* tier's own
// computed remaining, which is why tiers must be processed in array order
// (Sanity's own ordering, per ADR/schema — "previous" has no other meaning).
export function computeRemainingStock(
	tiers: SanityTier[],
	availability: Record<string, TierAvailability>,
): Record<string, TierStock> {
	const result: Record<string, TierStock> = {}

	tiers.forEach((tier, index) => {
		// No entry means no synced tiers row exists yet (webhook hasn't run,
		// or hasn't caught up) — treat as unavailable, not as "assume Sanity's
		// capacity." The reservation transaction's own atomic UPDATE would
		// find zero matching rows and reject it regardless; showing it as
		// available here would just be a display promising something
		// enforcement can't actually honour.
		const { capacity = 0, reserved = 0 } = availability[tier._key] ?? {}
		const remaining = Math.max(0, capacity - reserved)

		let isOpen = true
		if (tier.releaseTrigger === 'previousSoldOut') {
			const previous = tiers[index - 1]
			isOpen = previous ? (result[previous._key]?.remaining ?? 0) <= 0 : false
		}

		result[tier._key] = { remaining, isOpen }
	})

	return result
}
