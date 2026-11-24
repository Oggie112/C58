import { randomUUID } from 'node:crypto'
import { sql } from './db'
import { emailOrderTickets } from './emailOrderTickets'

// Sends one queued resend (8UI.3). Called straight after the request (via
// after()) and by the hourly retry, possibly at once, so it claims first:
// the request is cleared and last_resent_at set in one statement, and only
// one caller gets the row. If the send fails — Brevo quota, outage — both
// are restored, so the request stays queued for the next retry and the
// cooldown isn't used up by an email that never went. Never throws.
//
// A fresh idempotency key each time: Brevo rejects a repeated key for 30
// minutes, so reusing the order id (the first confirmation's key) would
// silently drop a resend made soon after it. Accepted, as for confirmations:
// a crash mid-send leaves it looking sent (the buyer can ask again after the
// cooldown), and a send Brevo took but we saw fail is sent twice.
export type ResendOutcome = 'sent' | 'skipped' | 'failed'

interface ClaimedResend {
	access_token: string | null
	requested_at: Date
	previous_resent_at: Date | null
}

export async function sendTicketResend(orderId: string): Promise<ResendOutcome> {
	const [claimed] = await sql<ClaimedResend[]>`
		with queued as (
			select id, resend_requested_at, last_resent_at from orders
			where id = ${orderId} and status = 'paid' and resend_requested_at is not null
			for update skip locked
		)
		update orders set resend_requested_at = null, last_resent_at = now()
		from queued where orders.id = queued.id
		returning orders.access_token, queued.resend_requested_at as requested_at, queued.last_resent_at as previous_resent_at
	`
	if (!claimed) return 'skipped'

	// Paid orders before 8UI.2 have no token, so no order page to link to —
	// unsendable, so the request is dropped rather than retried for ever
	if (!claimed.access_token) {
		console.error(`Order ${orderId}: resend requested but the order has no access token — not sent`)
		return 'skipped'
	}

	try {
		await emailOrderTickets(orderId, claimed.access_token, randomUUID())
		// The tickets have now reached the buyer, so the first confirmation —
		// if it never went — mustn't follow on later as a duplicate
		await sql`update orders set confirmation_sent_at = coalesce(confirmation_sent_at, now()) where id = ${orderId}`
		return 'sent'
	} catch (error) {
		console.error(`Order ${orderId}: ticket resend failed — left queued for a retry`, error)
		await sql`
			update orders set resend_requested_at = ${claimed.requested_at}, last_resent_at = ${claimed.previous_resent_at}
			where id = ${orderId}
		`.catch((resetError) => {
			console.error(`Order ${orderId}: could not re-queue the resend`, resetError)
		})
		return 'failed'
	}
}
