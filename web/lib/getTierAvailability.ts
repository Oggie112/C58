import type { SqlClient } from './db'

export interface TierAvailability {
	capacity: number
	reserved: number
}

// Replaces the original getOrderCounts (which aggregated orders/order_items
// by a time window on every read). Now a plain read of the mirrored tiers
// table — no joins, no interval filtering, since the mirror is kept live by
// writes (reservation + sweepStaleReservations) rather than recomputed from
// scratch each time.
export async function getTierAvailability(
	sql: SqlClient,
	eventId: string,
): Promise<Record<string, TierAvailability>> {
	const rows = await sql<{ tier_key: string; capacity: number; reserved: number }[]>`
		select tier_key, capacity, reserved from tiers where event_id = ${eventId}
	`

	const availability: Record<string, TierAvailability> = {}
	for (const row of rows) {
		availability[row.tier_key] = { capacity: row.capacity, reserved: row.reserved }
	}
	return availability
}
