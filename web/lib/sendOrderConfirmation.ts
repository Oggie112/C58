import { sql } from './db'
import { emailOrderTickets } from './emailOrderTickets'

// Emails a paid order's tickets (8API.1). Run via after() from every place
// that sees a paid order — the SumUp webhook and the order page — so calling
// it repeatedly or concurrently is expected, and it never throws: a failed
// email must not fail a payment confirmation or a page render.
//
// Exactly-once comes from the claim: confirmation_sent_at is set before
// sending by a conditional UPDATE, so only one caller ever proceeds. If the
// send fails, the claim is released (reset to null) and the next caller —
// a re-delivered webhook or the buyer reloading their order page — retries.
// Brevo's idempotency key (the order id) covers a retry racing a send that
// actually succeeded. Known gap: a crash between claiming and sending leaves
// the order marked as sent; the resend form (8UI.3) is the fallback.
//
// The outcome is for the scheduled retry (8API.4), which stops after several
// failures in a row; the after() callers ignore it.
//   sent    — Brevo accepted it (or already had, for a duplicate key)
//   skipped — nothing to do: not paid, already sent or claimed, or unsendable
//   failed  — the send failed and the claim was released for a retry
export type ConfirmationOutcome = 'sent' | 'skipped' | 'failed'

export async function sendOrderConfirmation(orderId: string): Promise<ConfirmationOutcome> {
	const [claimed] = await sql<{ access_token: string | null }[]>`
		update orders set confirmation_sent_at = now()
		where id = ${orderId} and status = 'paid' and confirmation_sent_at is null
		returning access_token
	`
	if (!claimed) return 'skipped'

	// Every order since 8UI.2 has a token; older paid ones were backfilled as
	// sent. Without one there's no order page to link to, so leave the claim
	// in place rather than retry something that can never succeed.
	if (!claimed.access_token) {
		console.error(`Order ${orderId} is paid but has no access token — confirmation not sent`)
		return 'skipped'
	}

	try {
		const result = await emailOrderTickets(orderId, claimed.access_token, orderId)
		if (result === 'duplicate') {
			console.warn(`Order ${orderId}: Brevo had already accepted this confirmation — not sent again`)
		}
		return 'sent'
	} catch (error) {
		console.error(`Order ${orderId}: confirmation email failed — releasing the claim for a retry`, error)
		await sql`update orders set confirmation_sent_at = null where id = ${orderId}`.catch((resetError) => {
			console.error(`Order ${orderId}: could not release the confirmation claim`, resetError)
		})
		return 'failed'
	}
}
