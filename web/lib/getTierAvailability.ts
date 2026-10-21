import type { SqlClient } from './db'
import type { TierAvailability } from './stock'

// Replaces the original getOrderCounts (which aggregated orders/order_items
// by a time window on every read). Now a plain read of the mirrored tiers
// table — no joins, no interval filtering, since the mirror is kept live by
// writes (reservation + sweepStaleReservations) rather than recomputed from
// scratch each time.
export async function getTierAvailability(
	sql: SqlClient,
	eventId: string,
): Promise<Record<string, TierAvailability>> {
	const rows = await sql<{ tier_key: string; capacity: number; reserved: number; opened: boolean }[]>`
		select tier_key, capacity, reserved, opened_at is not null as opened from tiers where event_id = ${eventId}
	`

	const availability: Record<string, TierAvailability> = {}
	for (const row of rows) {
		availability[row.tier_key] = { capacity: row.capacity, reserved: row.reserved, opened: row.opened }
	}
	return availability
}
