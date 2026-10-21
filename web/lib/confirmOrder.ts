import { sql } from './db'
import { getCheckoutStatus } from './sumup'
import { failReservation } from './failReservation'
import { generateTicketCode } from './generateTicketCode'

export type ConfirmOrderResult = 'paid' | 'failed' | 'pending'

export interface ConfirmableOrder {
	id: string
	providerSessionId: string
}

// Resolves a pending order against SumUp's own view of its checkout. Shared
// by the SumUp webhook and the post-payment order page (8UI.2) — the buyer
// can land back on the site before the webhook arrives, so either one may
// be first to confirm. Safe to call concurrently or repeatedly: the atomic
// claim below means tickets are only ever issued once.
//
// Never trusts the caller about payment — status always comes from a fresh
// getCheckoutStatus using our own API key. Throws if that lookup or the DB
// write fails; callers decide how to surface it.
export async function confirmOrder(order: ConfirmableOrder): Promise<ConfirmOrderResult> {
	const status = await getCheckoutStatus(order.providerSessionId)

	if (status === 'PAID') {
		await sql.begin(async (tx) => {
			const [claimed] = await tx<{ id: string }[]>`
				update orders set status = 'paid' where id = ${order.id} and status = 'pending'
				returning id
			`
			if (!claimed) return

			const items = await tx<{ id: string; quantity: number }[]>`
				select id, quantity from order_items where order_id = ${order.id}
			`
			for (const item of items) {
				for (let i = 0; i < item.quantity; i++) {
					await tx`insert into tickets (order_item_id, ticket_code) values (${item.id}, ${generateTicketCode()})`
				}
			}
		})
		return 'paid'
	}

	// SumUp's FAILED means "this attempt failed", not "this checkout is over" —
	// the buyer can retry on the same hosted page until valid_until. Verified
	// in the sandbox: a declined card fires a FAILED webhook, then a retry on
	// the same checkout turns it PAID. Releasing stock on FAILED would let that
	// retry land on an order already failed — paid, no tickets, seats resold.
	// Only EXPIRED is final; abandoned checkouts are left to the sweep.
	if (status === 'EXPIRED') {
		await failReservation(order.id)
		return 'failed'
	}

	return 'pending'
}
