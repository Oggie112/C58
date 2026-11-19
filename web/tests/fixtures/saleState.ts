import type { SanityTier } from '@/types/sanity'
import type { TierStock } from '@/lib/stock'

// A fixed "now" for every test: 14:00 UTC on 20 November 2026. November is
// on GMT, so UK time equals UTC here.
export const now = new Date('2026-11-20T14:00:00Z')

export const scheduledOpen: SanityTier = {
	_key: 'early',
	name: 'Early Bird',
	price: 10,
	capacity: 50,
	releaseTrigger: 'scheduled',
	saleStart: '2026-11-01T09:00:00Z',
}

export const scheduledNotStarted: SanityTier = {
	...scheduledOpen,
	_key: 'later',
	saleStart: '2026-11-21T19:00:00Z',
}

export const scheduledEnded: SanityTier = {
	...scheduledOpen,
	_key: 'ended',
	saleEnd: '2026-11-19T23:59:00Z',
}

// Hidden-but-stale saleStart in the future — must be ignored for this mode
export const previousSoldOutWithStaleStart: SanityTier = {
	_key: 'second',
	name: 'Second Release',
	price: 15,
	capacity: 50,
	releaseTrigger: 'previousSoldOut',
	saleStart: '2026-12-25T09:00:00Z',
}

export const available: TierStock = { remaining: 10, isOpen: true }
export const soldOut: TierStock = { remaining: 0, isOpen: true }
export const gated: TierStock = { remaining: 50, isOpen: false }
