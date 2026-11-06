import { sql } from './db'
import { addContactToList } from './brevo'
import { MARKETING_OPT_IN_SOURCE, MARKETING_OPT_IN_WORDING } from './marketingOptIn'
import { londonDate } from './dateFormat'
import { getEventByDetailsId } from '@/sanity/fetch'
import { PUBLISHED_FETCH_OPTIONS } from '@/sanity/fetchOptions'

//   synced  — the buyer is on the marketing list
//   skipped — nothing to do: not paid, didn't opt in, or already synced/claimed
//   failed  — Brevo rejected it; the claim was released for a retry
export type MarketingSyncOutcome = 'synced' | 'skipped' | 'failed'

// Adds a paid buyer who ticked the marketing checkbox to the Brevo list
// (8API.3), with attributes recording their consent: how (OPT_IN_SOURCE),
// when (OPT_IN_DATE — the UK date of the order's creation, when they ticked
// the box and submitted), what they agreed to (OPT_IN_WORDING, the same constant the
// checkbox shows) and the record that proves it (OPT_IN_ORDER, whose row
// holds marketing_opt_in = true). Abandoned checkouts are never added.
//
// Same shape as sendOrderConfirmation: an atomic claim on
// marketing_synced_at so repeat and concurrent triggers add a buyer once;
// released on failure for the next trigger or the hourly retry; never
// throws, so it can't fail a payment webhook or an order page.
export async function syncMarketingOptIn(orderId: string): Promise<MarketingSyncOutcome> {
	const [claimed] = await sql<{ email: string; event_id: string; created_at: Date }[]>`
		update orders set marketing_synced_at = now()
		where id = ${orderId} and status = 'paid' and marketing_opt_in and marketing_synced_at is null
		returning email, event_id, created_at
	`
	if (!claimed) return 'skipped'

	try {
		const listId = Number(process.env.BREVO_LIST_ID)
		if (!Number.isInteger(listId) || listId <= 0) throw new Error('BREVO_LIST_ID is not set to a list id')

		const event = await getEventByDetailsId(claimed.event_id, PUBLISHED_FETCH_OPTIONS)

		await addContactToList({
			email: claimed.email,
			listId,
			attributes: {
				OPT_IN_SOURCE: MARKETING_OPT_IN_SOURCE,
				OPT_IN_DATE: londonDate(claimed.created_at),
				OPT_IN_WORDING: MARKETING_OPT_IN_WORDING,
				OPT_IN_ORDER: orderId,
				...(event && { LAST_EVENT: event.title }),
			},
		})
		return 'synced'
	} catch (error) {
		console.error(`Order ${orderId}: marketing list sync failed — releasing the claim for a retry`, error)
		await sql`update orders set marketing_synced_at = null where id = ${orderId}`.catch((resetError) => {
			console.error(`Order ${orderId}: could not release the marketing sync claim`, resetError)
		})
		return 'failed'
	}
}
