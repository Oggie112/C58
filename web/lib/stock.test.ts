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
	it('computes remaining as capacity minus sold minus pending', () => {
		const result = computeRemainingStock(
			[scheduledTier],
			{ [scheduledTier._key]: { sold: 3, pending: 2 } },
		)
		expect(result[scheduledTier._key].remaining).toBe(5)
	})

	it('treats a tier with no counts entry as fully available', () => {
		const result = computeRemainingStock([scheduledTier], {})
		expect(result[scheduledTier._key].remaining).toBe(10)
	})

	it('never returns negative remaining, even if oversold', () => {
		const result = computeRemainingStock(
			[scheduledTier],
			{ [scheduledTier._key]: { sold: 8, pending: 5 } },
		)
		expect(result[scheduledTier._key].remaining).toBe(0)
	})

	it('always marks a scheduled tier as open, regardless of stock', () => {
		const result = computeRemainingStock(
			[scheduledTier],
			{ [scheduledTier._key]: { sold: 10, pending: 0 } },
		)
		expect(result[scheduledTier._key].isOpen).toBe(true)
	})

	it('keeps a previousSoldOut tier closed while the previous tier has stock', () => {
		const result = computeRemainingStock(
			[scheduledTier, previousSoldOutTier],
			{ [scheduledTier._key]: { sold: 2, pending: 0 } }, // 8 remaining
		)
		expect(result[previousSoldOutTier._key].isOpen).toBe(false)
	})

	it('opens a previousSoldOut tier once the previous tier is fully sold', () => {
		const result = computeRemainingStock(
			[scheduledTier, previousSoldOutTier],
			{ [scheduledTier._key]: { sold: 10, pending: 0 } }, // 0 remaining
		)
		expect(result[previousSoldOutTier._key].isOpen).toBe(true)
	})

	it('opens a previousSoldOut tier once the previous tier is sold out via pending holds too', () => {
		const result = computeRemainingStock(
			[scheduledTier, previousSoldOutTier],
			{ [scheduledTier._key]: { sold: 4, pending: 6 } }, // 0 remaining
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
