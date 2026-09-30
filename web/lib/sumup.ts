const SUMUP_API_BASE = 'https://api.sumup.com'

// Deliberately shorter than sweepStaleReservations's 30-minute window, not a
// mismatch — the sweep is lazy (only runs on the next read/write, never
// early but possibly late), so a payment SumUp accepts right at the 30-min
// mark could still be settling when the sweep releases the same seat. This
// margin guarantees SumUp has closed the checkout before the sweep is even
// eligible to touch it.
const CHECKOUT_VALID_MINUTES = 25

export interface CheckoutSession {
	id: string
	hostedCheckoutUrl: string
}

export type CheckoutStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED'

interface SumUpCheckoutResponse {
	id: string
	status: CheckoutStatus
	hosted_checkout_url?: string
}

function authHeaders() {
	const apiKey = process.env.SUMUP_API_KEY
	if (!apiKey) throw new Error('SUMUP_API_KEY is not set')
	return { Authorization: `Bearer ${apiKey}` }
}

export async function createCheckoutSession(orderId: string, amountPence: number, description: string): Promise<CheckoutSession> {
	const merchantCode = process.env.SUMUP_MERCHANT_CODE
	if (!merchantCode) throw new Error('SUMUP_MERCHANT_CODE is not set')

	const validUntil = new Date(Date.now() + CHECKOUT_VALID_MINUTES * 60 * 1000)

	const response = await fetch(`${SUMUP_API_BASE}/v0.1/checkouts`, {
		method: 'POST',
		headers: {
			...authHeaders(),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			checkout_reference: orderId,
			// SumUp takes pounds as a decimal, not pence — toFixed(2) then
			// reparse avoids float noise (e.g. 1033/100) surviving into JSON.
			amount: Number((amountPence / 100).toFixed(2)),
			currency: 'GBP',
			merchant_code: merchantCode,
			description,
			hosted_checkout: { enabled: true },
			return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/sumup`,
			valid_until: validUntil.toISOString(),
		}),
	})

	if (!response.ok) {
		throw new Error(`SumUp checkout creation failed: ${response.status} ${await response.text()}`)
	}

	const body = (await response.json()) as SumUpCheckoutResponse
	if (!body.hosted_checkout_url) {
		throw new Error('SumUp response missing hosted_checkout_url')
	}

	return { id: body.id, hostedCheckoutUrl: body.hosted_checkout_url }
}

export async function getCheckoutStatus(checkoutId: string): Promise<CheckoutStatus> {
	const response = await fetch(`${SUMUP_API_BASE}/v0.1/checkouts/${checkoutId}`, {
		headers: authHeaders(),
	})

	if (!response.ok) {
		throw new Error(`SumUp checkout lookup failed: ${response.status} ${await response.text()}`)
	}

	const body = (await response.json()) as SumUpCheckoutResponse
	return body.status
}
