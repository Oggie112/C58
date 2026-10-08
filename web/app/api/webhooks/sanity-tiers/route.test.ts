// No real database needed — every case here is rejected (or fails fast on
// an unreachable DB) before any query runs, so this stays a plain, DB-free
// unit test rather than another throwaway-container exception. A fake
// connection string only satisfies lib/db.ts's module-load-time check.
process.env.DATABASE_POOLED_URL = 'postgres://fake:fake@localhost:1/fake'
process.env.SANITY_WEBHOOK_SECRET = 'test-secret'

import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { POST } from './route'

const VALID_BODY = JSON.stringify({ eventDetailsId: 'evt-1', tiers: [{ _key: 'tier-a', capacity: 10 }] })

async function signedRequest(body: string, timestamp: number, secret = 'test-secret') {
	const signature = await encodeSignatureHeader(body, timestamp, secret)
	return new Request('http://localhost/api/webhooks/sanity-tiers', {
		method: 'POST',
		headers: { [SIGNATURE_HEADER_NAME]: signature },
		body,
	})
}

describe('sanity-tiers webhook signature replay protection', () => {
	it('rejects a request with no signature header', async () => {
		const request = new Request('http://localhost/api/webhooks/sanity-tiers', { method: 'POST', body: VALID_BODY })
		const response = await POST(request)
		expect(response.status).toBe(401)
	})

	it('rejects a signature made with the wrong secret', async () => {
		const request = await signedRequest(VALID_BODY, Date.now(), 'wrong-secret')
		const response = await POST(request)
		expect(response.status).toBe(401)
	})

	it('rejects a validly-signed request whose timestamp is too old (replay)', async () => {
		const tenMinutesAgo = Date.now() - 10 * 60 * 1000
		const request = await signedRequest(VALID_BODY, tenMinutesAgo)
		const response = await POST(request)
		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ error: 'Signature expired' })
	})

	it('does not reject a validly-signed, fresh request on signature grounds', async () => {
		const request = await signedRequest(VALID_BODY, Date.now())
		const response = await POST(request)
		// Gets past both signature checks and only fails because the fake
		// DATABASE_POOLED_URL above can't actually be connected to — proves
		// the new staleness check doesn't also reject legitimate requests.
		expect(response.status).toBe(500)
		expect(await response.json()).toEqual({ error: 'Sync failed' })
	})
})
