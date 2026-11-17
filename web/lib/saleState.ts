import type { SanityTier, TicketingStatus } from '@/types/sanity'
import type { TierStock } from './stock'
import { londonDate } from './dateFormat'

// The rules for whether tickets can be bought (8API.5) — pure, no DB access,
// so the server action enforces exactly what the ticket picker displays.

export type TierWindow = 'open' | 'not_started' | 'ended'

// A tier's own sale window. saleEnd applies to every tier; saleStart only to
// 'scheduled' tiers — on a 'previousSoldOut' tier it's hidden in the Studio
// but may be stale from before the mode was switched, so it's ignored.
// Windows are stored as instants (UTC), so no timezone handling is needed.
export function tierWindow(tier: SanityTier, now: Date): TierWindow {
	if (tier.saleEnd && now >= new Date(tier.saleEnd)) return 'ended'
	if (tier.releaseTrigger === 'scheduled' && tier.saleStart && now < new Date(tier.saleStart)) return 'not_started'
	return 'open'
}

export type TierSaleState = 'on_sale' | 'sold_out' | 'awaiting_previous' | 'not_started' | 'ended'

export function tierSaleState(tier: SanityTier, stock: TierStock, now: Date): TierSaleState {
	const window = tierWindow(tier, now)
	if (window !== 'open') return window
	if (stock.remaining <= 0) return 'sold_out'
	if (!stock.isOpen) return 'awaiting_previous'
	return 'on_sale'
}

// Online sales stop at 00:00 UK time on the event's date — the last
// confirmations go out before the night, nobody buys online in the queue,
// and there's paying on the door. Event dates are plain calendar dates
// (YYYY-MM-DD), so this compares UK dates, not instants.
export function onlineSalesClosedForEventDate(eventDate: string, now: Date): boolean {
	return londonDate(now) >= eventDate
}

export type EventSaleState =
	| { status: 'on_sale' }
	| { status: 'not_open' }
	| { status: 'sold_out' }
	| { status: 'closed'; reason: 'status' | 'event_day' | 'windows_ended' }

export interface EventSaleInput {
	ticketingStatus: TicketingStatus
	eventDate?: string
	tiers: SanityTier[]
	// Live per-tier stock where known (the ticket picker). Without it — the
	// server action — capacity is left to the reservation's own atomic check.
	stock?: Record<string, TierStock>
	now: Date
}

export function eventSaleState({ ticketingStatus, eventDate, tiers, stock, now }: EventSaleInput): EventSaleState {
	// An editor's explicit status wins over anything computed — the Studio
	// describes it as a manual override, independent of tier dates/capacity
	if (ticketingStatus === 'closed') return { status: 'closed', reason: 'status' }
	if (ticketingStatus === 'not_open') return { status: 'not_open' }
	if (ticketingStatus === 'sold_out') return { status: 'sold_out' }

	if (eventDate && onlineSalesClosedForEventDate(eventDate, now)) return { status: 'closed', reason: 'event_day' }

	if (stock) {
		const states = tiers.map((tier) => tierSaleState(tier, stock[tier._key] ?? { remaining: 0, isOpen: false }, now))
		if (states.every((state) => state === 'sold_out')) return { status: 'sold_out' }
		// Nothing can be bought now or later: every tier sold out or past its window
		if (states.every((state) => state === 'sold_out' || state === 'ended')) {
			return { status: 'closed', reason: 'windows_ended' }
		}
	}

	return { status: 'on_sale' }
}
