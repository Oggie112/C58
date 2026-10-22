import { sql } from './db'

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface OrderLine {
	tierName: string
	quantity: number
	unitPrice: number // pence
}

export interface OrderSummary {
	id: string
	eventId: string // Sanity eventDetails _id
	status: OrderStatus
	email: string
	amountTotal: number // pence
	providerSessionId: string | null
	lines: OrderLine[]
}

// generateAccessToken's output shape — anything else can't be a real token,
// so it's rejected without a DB round-trip.
const ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export async function getOrderByToken(token: string): Promise<OrderSummary | null> {
	if (!ACCESS_TOKEN_PATTERN.test(token)) return null

	const [order] = await sql<
		{ id: string; event_id: string; status: OrderStatus; email: string; amount_total: number; provider_session_id: string | null }[]
	>`
		select id, event_id, status, email, amount_total, provider_session_id
		from orders where access_token = ${token}
	`
	if (!order) return null

	const lines = await sql<{ tier_name: string; quantity: number; unit_price: number }[]>`
		select tier_name, quantity, unit_price from order_items
		where order_id = ${order.id}
		order by unit_price, tier_name
	`

	return {
		id: order.id,
		eventId: order.event_id,
		status: order.status,
		email: order.email,
		amountTotal: order.amount_total,
		providerSessionId: order.provider_session_id,
		lines: lines.map((line) => ({
			tierName: line.tier_name,
			quantity: line.quantity,
			unitPrice: line.unit_price,
		})),
	}
}
