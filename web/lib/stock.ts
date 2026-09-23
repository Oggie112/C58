import type { SanityTier } from '@/types/sanity'

export interface OrderCounts {
	sold: number
	pending: number
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
	counts: Record<string, OrderCounts>,
): Record<string, TierStock> {
	const result: Record<string, TierStock> = {}

	tiers.forEach((tier, index) => {
		const { sold = 0, pending = 0 } = counts[tier._key] ?? {}
		const remaining = Math.max(0, tier.capacity - sold - pending)

		let isOpen = true
		if (tier.releaseTrigger === 'previousSoldOut') {
			const previous = tiers[index - 1]
			isOpen = previous ? (result[previous._key]?.remaining ?? 0) <= 0 : false
		}

		result[tier._key] = { remaining, isOpen }
	})

	return result
}
