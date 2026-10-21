import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from '@/lib/db'
import { confirmOrder } from '@/lib/confirmOrder'

// No signature on SumUp's side — the payload is just a "go check" nudge, not
// a claim to trust. Everything consequential is gated on confirmOrder's own
// getCheckoutStatus re-fetch, using our own API key, before anything is written.
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
	// an already-resolved order. Not the actual guard; confirmOrder's atomic
	// claim is what prevents double-processing under a genuine race.
	if (order.status !== 'pending') {
		return NextResponse.json({ success: true })
	}

	try {
		await confirmOrder({ id: order.id, providerSessionId: checkoutId })
	} catch (error) {
		console.error('Failed to confirm order from SumUp webhook:', error)
		return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 })
	}

	return NextResponse.json({ success: true })
}
