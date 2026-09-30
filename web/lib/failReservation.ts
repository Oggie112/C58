import { sql } from './db'

// Releases a single order's held stock immediately, rather than leaving it
// for the 30-minute sweep — used when checkout-session creation fails right
// after a successful reservation, so a buyer hitting a SumUp error isn't
// stuck watching the tier they just failed to check out for stay unavailable.
export async function failReservation(orderId: string): Promise<void> {
	await sql.begin(async (tx) => {
		// The conditional UPDATE claims the order atomically — if it's already
		// been resolved (paid, or already swept/failed), status won't match
		// 'pending' and this is a no-op, same guard idiom as reserveOrder's
		// own atomic increment.
		const [order] = await tx<{ event_id: string }[]>`
			update orders set status = 'failed' where id = ${orderId} and status = 'pending'
			returning event_id
		`
		if (!order) return

		const items = await tx<{ tier_key: string; quantity: number }[]>`
			select tier_key, quantity from order_items where order_id = ${orderId}
		`
		for (const item of items) {
			await tx`
				update tiers set reserved = greatest(0, reserved - ${item.quantity})
				where event_id = ${order.event_id} and tier_key = ${item.tier_key}
			`
		}
	})
}
