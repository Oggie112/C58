// The consent a buyer gives by ticking the marketing checkbox at checkout.
// One constant, shown in TierPicker and recorded on their Brevo contact
// (OPT_IN_WORDING), so the stored evidence of what they agreed to can never
// drift from what they actually saw. Changing it changes what future buyers
// consent to — earlier contacts keep the wording they agreed to.
export const MARKETING_OPT_IN_WORDING = 'Keep me posted about future C58 events and news.'

// Where the consent was captured (OPT_IN_SOURCE), in case more sign-up
// routes are added later.
export const MARKETING_OPT_IN_SOURCE = 'ticket purchase'

// Marketing opt-in is dormant until the privacy policy covers it (and ICO
// position is settled) — see docs/compliance-inventory.md, C6. Off unless
// MARKETING_OPT_IN_ENABLED is exactly "true": a missing or mistyped value
// stays off. While off, the checkbox isn't shown, createOrder records every
// order as not opted in whatever the request says, and nothing is synced to
// Brevo. Switching on: set the env var in Vercel and redeploy (the event
// page is prerendered, so it picks the value up at build time).
export function isMarketingOptInEnabled(): boolean {
	return process.env.MARKETING_OPT_IN_ENABLED === 'true'
}
