import { sendOrderConfirmation } from './sendOrderConfirmation'
import { syncMarketingOptIn } from './syncMarketingOptIn'

// Everything that should happen once an order is paid, run via after() from
// each place that sees it paid (SumUp webhook, order page). Independent and
// concurrent: each has its own claim and never throws, so a Brevo contacts
// failure can't hold up or break the ticket email, or the reverse — and
// calling this repeatedly is safe.
export async function runPaidOrderFollowUps(orderId: string): Promise<void> {
	await Promise.all([sendOrderConfirmation(orderId), syncMarketingOptIn(orderId)])
}
