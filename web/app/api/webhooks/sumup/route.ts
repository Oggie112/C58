import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { getCheckoutStatus } from '@/lib/sumup'
import { failReservation } from '@/lib/failReservation'
import { generateTicketCode } from '@/lib/generateTicketCode'

// No signature on SumUp's side — the payload is just a "go check" nudge, not
// a claim to trust. Everything consequential is gated on getCheckoutStatus's
// own re-fetch, using our own API key, before anything is written.
const WebhookPayloadSchema = z.object({
	event_type: z.string(),
	// Not the real guard — the DB lookup below already only ever matches a
	// value our own server wrote (from SumUp's own checkout-creation
	// response), never attacker input. This is cheap, independent insurance
	// against that assumption weakening if this code is ever refactored.
	id: z.uuid(),
})

export async function POST(request: Request) {
	const rawBody = await request.text()

	let body: unknown
	try {
		body = JSON.parse(rawBody)
	} catch {
		return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
	}

	const parsed = WebhookPayloadSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
	}

	const { id: checkoutId } = parsed.data

	const [order] = await sql<{ id: string; status: string }[]>`
		select id, status from orders where provider_session_id = ${checkoutId}
	`
	if (!order) {
		console.warn(`SumUp webhook for unknown checkout id: ${checkoutId}`)
		return NextResponse.json({ success: true })
	}
	// Fast path only — avoids a SumUp round-trip for a duplicate delivery of
	// an already-resolved order. Not the actual guard; the atomic UPDATE
	// below is what prevents double-processing under a genuine race.
	if (order.status !== 'pending') {
		return NextResponse.json({ success: true })
	}

	let status
	try {
		status = await getCheckoutStatus(checkoutId)
	} catch (error) {
		console.error('Failed to fetch checkout status from SumUp:', error)
		return NextResponse.json({ error: 'Status lookup failed' }, { status: 500 })
	}

	try {
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
		} else if (status === 'FAILED' || status === 'EXPIRED') {
			await failReservation(order.id)
		}
	} catch (error) {
		console.error('Failed to process SumUp checkout status:', error)
		return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
	}

	return NextResponse.json({ success: true })
}
