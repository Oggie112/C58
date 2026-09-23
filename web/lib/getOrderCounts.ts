import { sql } from './db'
import type { OrderCounts } from './stock'

// Server-only — imports the Postgres client. Kept separate from stock.ts's
// pure computeRemainingStock so client components can import that without
// pulling the DB driver into the browser bundle.
//
// No join to `tickets` needed: those rows only exist post-payment (7API.4),
// and `order_items.quantity` already reflects units for both paid and
// pending orders by construction.
export async function getOrderCounts(eventDetailsId: string): Promise<Record<string, OrderCounts>> {
	const rows = await sql<{ tier_key: string; sold: string; pending: string }[]>`
		select order_items.tier_key,
			coalesce(sum(order_items.quantity) filter (where orders.status = 'paid'), 0) as sold,
			coalesce(sum(order_items.quantity) filter (
				where orders.status = 'pending' and orders.created_at > now() - interval '30 minutes'
			), 0) as pending
		from order_items
		join orders on orders.id = order_items.order_id
		where orders.event_id = ${eventDetailsId}
		group by order_items.tier_key
	`

	const counts: Record<string, OrderCounts> = {}
	for (const row of rows) {
		counts[row.tier_key] = { sold: Number(row.sold), pending: Number(row.pending) }
	}
	return counts
}
