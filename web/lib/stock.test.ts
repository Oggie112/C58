import { computeRemainingStock } from './stock'
import type { SanityTier } from '@/types/sanity'

const scheduledTier: SanityTier = {
	_key: 'tier-scheduled',
	name: 'First Release',
	price: 15,
	capacity: 10,
	releaseTrigger: 'scheduled',
}

const previousSoldOutTier: SanityTier = {
	_key: 'tier-second',
	name: 'Second Release',
	price: 20,
	capacity: 5,
	releaseTrigger: 'previousSoldOut',
}

describe('computeRemainingStock', () => {
	it('computes remaining as capacity minus reserved', () => {
		const result = computeRemainingStock(
			[scheduledTier],
			{ [scheduledTier._key]: { capacity: 10, reserved: 5 } },
		)
		expect(result[scheduledTier._key].remaining).toBe(5)
	})

	it('treats a tier with no availability entry as unavailable, not fully available', () => {
		// No entry means no synced tiers row exists yet — the reservation
		// transaction's atomic UPDATE would find nothing to match and reject
		// it regardless, so showing it as available here would be dishonest.
		const result = computeRemainingStock([scheduledTier], {})
		expect(result[scheduledTier._key].remaining).toBe(0)
	})

	it('never returns negative remaining, even if oversold', () => {
		const result = computeRemainingStock(
			[scheduledTier],
			{ [scheduledTier._key]: { capacity: 10, reserved: 13 } },
		)
		expect(result[scheduledTier._key].remaining).toBe(0)
	})

	it('always marks a scheduled tier as open, regardless of stock', () => {
		const result = computeRemainingStock(
			[scheduledTier],
			{ [scheduledTier._key]: { capacity: 10, reserved: 10 } },
		)
		expect(result[scheduledTier._key].isOpen).toBe(true)
	})

	it('keeps a previousSoldOut tier closed while the previous tier has stock', () => {
		const result = computeRemainingStock(
			[scheduledTier, previousSoldOutTier],
			{ [scheduledTier._key]: { capacity: 10, reserved: 2 } }, // 8 remaining
		)
		expect(result[previousSoldOutTier._key].isOpen).toBe(false)
	})

	it('opens a previousSoldOut tier once the previous tier is fully reserved', () => {
		const result = computeRemainingStock(
			[scheduledTier, previousSoldOutTier],
			{ [scheduledTier._key]: { capacity: 10, reserved: 10 } }, // 0 remaining
		)
		expect(result[previousSoldOutTier._key].isOpen).toBe(true)
	})

	it('treats a misconfigured first-tier previousSoldOut as closed rather than throwing', () => {
		const result = computeRemainingStock(
			[previousSoldOutTier],
			{},
		)
		expect(result[previousSoldOutTier._key].isOpen).toBe(false)
	})
})
