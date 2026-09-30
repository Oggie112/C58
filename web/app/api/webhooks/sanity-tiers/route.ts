import { NextResponse } from 'next/server'
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { z } from 'zod'
import { sql } from '@/lib/db'

// Configure in Sanity's project settings, on eventDetails create/update/delete,
// with a GROQ projection matching this shape exactly:
//   {"eventDetailsId": _id, "tiers": tiers[]{_key, capacity}}
const WebhookPayloadSchema = z.object({
	eventDetailsId: z.string().min(1),
	tiers: z.array(z.object({ _key: z.string().min(1), capacity: z.number().int().min(0) })),
})

export async function POST(request: Request) {
	const secret = process.env.SANITY_WEBHOOK_SECRET
	if (!secret) {
		console.error('SANITY_WEBHOOK_SECRET is not set')
		return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
	}

	const rawBody = await request.text()
	const signature = request.headers.get(SIGNATURE_HEADER_NAME)

	if (!signature || !(await isValidSignature(rawBody, signature, secret))) {
		return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
	}

	// A deleted/unpublished document has no current state for the projection
	// to read tiers[] from, so delete is handled from headers, not the body.
	if (request.headers.get('sanity-operation') === 'delete') {
		const eventDetailsId = request.headers.get('sanity-document-id')
		if (!eventDetailsId) {
			return NextResponse.json({ error: 'Missing sanity-document-id' }, { status: 400 })
		}

		try {
			await sql`update tiers set capacity = reserved where event_id = ${eventDetailsId}`
			return NextResponse.json({ success: true })
		} catch (error) {
			console.error('Failed to pin tiers for deleted event:', error)
			return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
		}
	}

	const parsed = WebhookPayloadSchema.safeParse(JSON.parse(rawBody))
	if (!parsed.success) {
		return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
	}

	const { eventDetailsId, tiers } = parsed.data
	const tierKeys = tiers.map((tier) => tier._key)

	try {
		await sql.begin(async (tx) => {
			for (const tier of tiers) {
				await tx`
					insert into tiers (event_id, tier_key, capacity)
					values (${eventDetailsId}, ${tier._key}, ${tier.capacity})
					on conflict (event_id, tier_key) do update set capacity = excluded.capacity
				`
			}

			if (tierKeys.length > 0) {
				await tx`
					update tiers set capacity = reserved
					where event_id = ${eventDetailsId} and tier_key not in ${tx(tierKeys)}
				`
			} else {
				await tx`update tiers set capacity = reserved where event_id = ${eventDetailsId}`
			}
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Failed to sync tiers from webhook:', error)
		return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
	}
}
