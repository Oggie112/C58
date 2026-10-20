import { sql } from './db'
import { sweepStaleReservations } from './sweepStaleReservations'
import { getTierAvailability } from './getTierAvailability'
import { computeRemainingStock } from './stock'
import type { SanityTier } from '@/types/sanity'

// Deliberately not imported from actions.ts's CreateOrderInput — lib/ is the
// lower-level layer app/ depends on, not the reverse. actions.ts's
// Zod-validated CreateOrderInput satisfies this structurally, no cast needed.
export interface ReserveOrderInput {
	eventDetailsId: string
	items: { tierKey: string; quantity: number }[]
	email: string
	marketingOptIn: boolean
}

export type ReserveResult =
	| { status: 'reserved'; orderId: string; amountTotal: number }
	| { status: 'sold_out'; tierKey: string }
	| { status: 'tier_not_open'; tierKey: string }
	| { status: 'invalid_tier'; tierKey: string }

class SoldOutError extends Error {
	constructor(public tierKey: string) {
		super(`Sold out: ${tierKey}`)
	}
}

class TierNotOpenError extends Error {
	constructor(public tierKey: string) {
		super(`Tier not open: ${tierKey}`)
	}
}

// The one place capacity actually gets committed. `tiers` is Sanity's own
// current data for this event, fetched by the caller (createOrder) before
// this runs — kept outside the transaction deliberately, so the transaction
// never holds a DB lock open across an external HTTP call to Sanity.
export async function reserveOrder(input: ReserveOrderInput, tiers: SanityTier[]): Promise<ReserveResult> {
	// An unknown tierKey is a bad-input problem, not a concurrency one — fail
	// before opening the transaction at all, not partway through it. Returned,
	// not thrown: a client probing with a bogus tierKey shouldn't produce an
	// uncaught exception on every attempt.
	const resolvedItems: { tierKey: string; quantity: number; tierName: string; unitPrice: number }[] = []
	for (const item of input.items) {
		const tier = tiers.find((t) => t._key === item.tierKey)
		if (!tier) return { status: 'invalid_tier', tierKey: item.tierKey }
		resolvedItems.push({
			tierKey: item.tierKey,
			quantity: item.quantity,
			tierName: tier.name,
			// Pence, converted here — the actual first use of the Milestone 6
			// fetch-boundary decision. Sanity stores pounds; Postgres money
			// columns are pence throughout.
			unitPrice: Math.round(tier.price * 100),
		})
	}
	const amountTotal = resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

	try {
		const orderId = await sql.begin(async (tx) => {
			await sweepStaleReservations(tx, input.eventDetailsId)

			// previousSoldOut gating, re-checked against post-sweep availability
			// — a client can't bypass "opens once the previous tier sells out"
			// by just calling the server action directly for a still-gated tier.
			const availability = await getTierAvailability(tx, input.eventDetailsId)
			const stock = computeRemainingStock(tiers, availability)
			for (const item of resolvedItems) {
				if (!stock[item.tierKey]?.isOpen) throw new TierNotOpenError(item.tierKey)
			}

			// Sorted tier_key order across all calls — not required for
			// correctness (Postgres's own deadlock detector aborts and a retry
			// would succeed regardless), but avoids wasted aborts under real
			// contention when two multi-tier orders share tiers.
			const sortedItems = [...resolvedItems].sort((a, b) => a.tierKey.localeCompare(b.tierKey))

			for (const item of sortedItems) {
				// The atomic check-and-reserve itself: Postgres's own row-level
				// locking on this UPDATE is the entire concurrency guarantee —
				// no advisory locks, no manual locking scheme. Zero rows
				// returned means the WHERE clause's capacity check failed
				// (including "no tiers row exists at all" — same outcome).
				const [updated] = await tx`
					update tiers set reserved = reserved + ${item.quantity}
					where event_id = ${input.eventDetailsId} and tier_key = ${item.tierKey}
						and capacity - reserved >= ${item.quantity}
					returning tier_key
				`
				if (!updated) throw new SoldOutError(item.tierKey)
			}

			const [order] = await tx<{ id: string }[]>`
				insert into orders (event_id, provider, provider_session_id, email, marketing_opt_in, amount_total, status)
				values (
					${input.eventDetailsId}, 'sumup', null, ${input.email},
					${input.marketingOptIn}, ${amountTotal}, 'pending'
				)
				returning id
			`

			for (const item of resolvedItems) {
				await tx`
					insert into order_items (order_id, tier_key, tier_name, unit_price, quantity)
					values (${order.id}, ${item.tierKey}, ${item.tierName}, ${item.unitPrice}, ${item.quantity})
				`
			}

			return order.id as string
		})

		return { status: 'reserved', orderId, amountTotal }
	} catch (err) {
		if (err instanceof SoldOutError) return { status: 'sold_out', tierKey: err.tierKey }
		if (err instanceof TierNotOpenError) return { status: 'tier_not_open', tierKey: err.tierKey }
		throw err
	}
}
