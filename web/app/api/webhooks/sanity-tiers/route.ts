import { NextResponse } from 'next/server'
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { z } from 'zod'
import { sql } from '@/lib/db'

// Configure in Sanity's project settings, on eventDetails publish, with a
// GROQ projection matching this shape exactly:
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

	// isValidSignature needs the raw request body exactly as sent — a
	// re-encoded JSON string can mismatch even for byte-identical content, so
	// read text() first and JSON.parse it ourselves, rather than
	// request.json() (which discards the raw string entirely).
	const rawBody = await request.text()
	const signature = request.headers.get(SIGNATURE_HEADER_NAME)

	if (!signature || !(await isValidSignature(rawBody, signature, secret))) {
		return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
	}

	const parsed = WebhookPayloadSchema.safeParse(JSON.parse(rawBody))
	if (!parsed.success) {
		return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
	}

	const { eventDetailsId, tiers } = parsed.data
	const tierKeys = tiers.map((tier) => tier._key)

	try {
		// Known limitation, not fixed here: if a tier's capacity in Sanity is
		// reduced below its current `reserved` count, this upsert violates the
		// tiers table's `reserved <= capacity` check constraint. Since the
		// whole sync is one transaction, that fails every tier in this
		// payload, not just the offending one — capacity would silently stay
		// stale for the whole event until a correcting publish. Safe (no bad
		// data persisted), not graceful. Worth a partial-failure-tolerant
		// version if this turns out to matter in practice.
		await sql.begin(async (tx) => {
			for (const tier of tiers) {
				await tx`
					insert into tiers (event_id, tier_key, capacity)
					values (${eventDetailsId}, ${tier._key}, ${tier.capacity})
					on conflict (event_id, tier_key) do update set capacity = excluded.capacity
				`
			}

			// A tier removed from Sanity is never deleted — order_items may
			// already reference its tier_key. Setting capacity down to exactly
			// its current reserved count (not to 0) blocks any new reservation
			// — capacity - reserved becomes 0 either way — while staying valid
			// under the reserved <= capacity check constraint regardless of
			// what reserved currently is; a literal 0 would violate it for any
			// tier that already has real reservations against it, which is the
			// realistic case for a tier actually being removed.
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
