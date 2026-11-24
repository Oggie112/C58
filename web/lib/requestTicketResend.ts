import { sql } from './db'
import { londonDate } from './dateFormat'
import { getEventByDetailsId } from '@/sanity/fetch'
import { PUBLISHED_FETCH_OPTIONS } from '@/sanity/fetchOptions'

// A resend of an order is ignored this soon after the last one was sent —
// the form mustn't be usable to flood a buyer's inbox from many IPs
export const RESEND_COOLDOWN_MINUTES = 30
// Bounds the Brevo sends one request can cause
export const RESEND_MAX_ORDERS = 5

// Queues a resend of the tickets for every paid order at this address whose
// event hasn't happened yet (8UI.3), and returns the ids newly queued —
// for the caller to send straight away; anything it can't send stays
// queued for the hourly retry. Orders resent within the cooldown, or already
// queued, are left alone. Never reveals anything: the form's reply is the
// same whatever this finds.
export async function requestTicketResend(email: string, now: Date = new Date()): Promise<string[]> {
	const paidOrders = await sql<{ id: string; event_id: string }[]>`
		select id, event_id from orders
		where lower(email) = lower(${email}) and status = 'paid'
		order by created_at desc
	`
	if (paidOrders.length === 0) return []

	// Upcoming includes today: the event-day buyer queueing at the door is
	// exactly who needs it. Event dates live in Sanity; one lookup per event.
	const today = londonDate(now)
	const upcomingEventIds = new Set<string>()
	for (const eventId of new Set(paidOrders.map((order) => order.event_id))) {
		const event = await getEventByDetailsId(eventId, PUBLISHED_FETCH_OPTIONS)
		if (event && event.date >= today) upcomingEventIds.add(eventId)
	}

	const candidateIds = paidOrders
		.filter((order) => upcomingEventIds.has(order.event_id))
		.slice(0, RESEND_MAX_ORDERS)
		.map((order) => order.id)
	if (candidateIds.length === 0) return []

	const queued = await sql<{ id: string }[]>`
		update orders set resend_requested_at = now()
		where id = any(${candidateIds})
			and resend_requested_at is null
			and (last_resent_at is null or last_resent_at < now() - make_interval(mins => ${RESEND_COOLDOWN_MINUTES}))
		returning id
	`
	return queued.map((order) => order.id)
}
