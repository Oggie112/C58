import { sql } from './db'

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface OrderLine {
	tierName: string
	quantity: number
	unitPrice: number // pence
}

export type TicketStatus = 'valid' | 'used' | 'voided'

export interface Ticket {
	code: string
	tierName: string
	status: TicketStatus
}

export interface OrderSummary {
	id: string
	eventId: string // Sanity eventDetails _id
	status: OrderStatus
	email: string
	amountTotal: number // pence
	providerSessionId: string | null
	lines: OrderLine[]
	// Empty until confirmOrder issues them on payment — one per admission.
	tickets: Ticket[]
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
		order by unit_price, tier_name, id
	`

	// Same ordering as the lines, so tickets group in the same sequence as the
	// order summary. order_items.id keeps each line's tickets together even if
	// two tiers share a name and price; tickets.id as the final tie-break keeps
	// a reload stable (no ordering on insert time — tickets has no created_at).
	const tickets = await sql<{ ticket_code: string; tier_name: string; status: TicketStatus }[]>`
		select tickets.ticket_code, order_items.tier_name, tickets.status
		from tickets
		join order_items on order_items.id = tickets.order_item_id
		where order_items.order_id = ${order.id}
		order by order_items.unit_price, order_items.tier_name, order_items.id, tickets.id
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
		tickets: tickets.map((ticket) => ({
			code: ticket.ticket_code,
			tierName: ticket.tier_name,
			status: ticket.status,
		})),
	}
}
