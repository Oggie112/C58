import type { SqlClient } from './db'
import type { SanityTier } from '@/types/sanity'
import { getTierAvailability } from './getTierAvailability'
import { computeRemainingStock } from './stock'

// Records `opened_at` on every `previousSoldOut` tier that is currently open
// but not yet latched, so it stays open from then on. Called by reserveOrder
// inside its transaction, straight after incrementing `reserved` — the only
// write that can sell a tier out, so it's the moment the next tier first
// opens. (A Studio capacity cut can also zero a tier, but that's caught here
// on the next reservation for the event.)
//
// The `opened_at is null` guard makes the latch write-once: concurrent
// reservations can both run this without clobbering the original timestamp.
export async function latchOpenTiers(sql: SqlClient, eventId: string, tiers: SanityTier[]): Promise<void> {
	const availability = await getTierAvailability(sql, eventId)
	const stock = computeRemainingStock(tiers, availability)

	const newlyOpen = tiers
		.filter((tier) => tier.releaseTrigger === 'previousSoldOut')
		.filter((tier) => stock[tier._key]?.isOpen && !availability[tier._key]?.opened)
		.map((tier) => tier._key)

	if (newlyOpen.length === 0) return

	await sql`
		update tiers set opened_at = now()
		where event_id = ${eventId} and tier_key in ${sql(newlyOpen)} and opened_at is null
	`
}
