const SUMUP_API_BASE = 'https://api.sumup.com'

export interface CheckoutSession {
	id: string
	hostedCheckoutUrl: string
}

interface SumUpCheckoutResponse {
	id: string
	hosted_checkout_url?: string
}

export async function createCheckoutSession(orderId: string, amountPence: number, description: string): Promise<CheckoutSession> {
	const apiKey = process.env.SUMUP_API_KEY
	const merchantCode = process.env.SUMUP_MERCHANT_CODE
	if (!apiKey || !merchantCode) {
		throw new Error('SUMUP_API_KEY or SUMUP_MERCHANT_CODE is not set')
	}

	const response = await fetch(`${SUMUP_API_BASE}/v0.1/checkouts`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
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
