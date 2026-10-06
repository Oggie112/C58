import type { SqlClient } from './db'

// Frees capacity held by pending orders that are past the checkout-session
// window (30 min) without ever actually completing. Deliberately called
// from BOTH the reservation transaction and the stock-availability read
// path (app/api/stock/[eventDetailsId]/route.ts), not just at reservation
// time — see the "sweep has to run on read too" note in the plan for
// 7API.2. Sweeping only on write is a self-locking trap: once a tier's
// `reserved` reaches `capacity`, TierPicker's own quantity controls disable
// themselves, so nobody could ever trigger a new reservation attempt again
// to run the sweep, even after the stale orders actually expired.
//
// Takes a SqlClient rather than importing the `sql` singleton so callers can
// run it inside their own transaction (sweep-then-read, or sweep-then-reserve,
// atomically) instead of as a separate, unsynchronised write.
export async function sweepStaleReservations(sql: SqlClient, eventId: string): Promise<void> {
	const stale = await sql<{ order_id: string; tier_key: string; quantity: number }[]>`
		select orders.id as order_id, order_items.tier_key, order_items.quantity
		from order_items
		join orders on orders.id = order_items.order_id
		where orders.event_id = ${eventId}
			and orders.status = 'pending'
			and orders.created_at <= now() - interval '30 minutes'
	`

	if (stale.length === 0) return

	for (const row of stale) {
		await sql`
			update tiers set reserved = greatest(0, reserved - ${row.quantity})
			where event_id = ${eventId} and tier_key = ${row.tier_key}
		`
	}

	const staleOrderIds = [...new Set(stale.map((row) => row.order_id))]
	await sql`update orders set status = 'failed' where id in ${sql(staleOrderIds)}`
}
