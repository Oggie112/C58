process.env.SANITY_REVALIDATE_SECRET = 'revalidate-secret'

import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { revalidatePath } from 'next/cache'
import { POST } from './route'

jest.mock('next/cache', () => ({
	revalidatePath: jest.fn(),
}))

const BODY = JSON.stringify({ _id: 'page-about', _type: 'page' })

async function signedRequest(timestamp: number, secret = 'revalidate-secret') {
	const signature = await encodeSignatureHeader(BODY, timestamp, secret)
	return new Request('http://localhost/api/webhooks/sanity-revalidate', {
		method: 'POST',
		headers: { [SIGNATURE_HEADER_NAME]: signature, 'sanity-operation': 'update', 'sanity-document-id': 'page-about' },
		body: BODY,
	})
}

describe('sanity-revalidate webhook', () => {
	beforeEach(() => {
		jest.mocked(revalidatePath).mockClear()
	})

	it('revalidates the whole site for a valid, fresh signature', async () => {
		const response = await POST(await signedRequest(Date.now()))

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ revalidated: true })
		expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
	})

	it('rejects an unsigned request without revalidating', async () => {
		const response = await POST(
			new Request('http://localhost/api/webhooks/sanity-revalidate', { method: 'POST', body: BODY }),
		)

		expect(response.status).toBe(401)
		expect(revalidatePath).not.toHaveBeenCalled()
	})

	it("rejects a signature made with another webhook's secret", async () => {
		// Each webhook has its own secret — the tiers webhook's must not work here.
		const response = await POST(await signedRequest(Date.now(), 'tiers-webhook-secret'))

		expect(response.status).toBe(401)
		expect(revalidatePath).not.toHaveBeenCalled()
	})

	it('rejects a replayed (stale) signature without revalidating', async () => {
		const response = await POST(await signedRequest(Date.now() - 10 * 60 * 1000))

		expect(response.status).toBe(401)
		expect(await response.json()).toEqual({ error: 'Signature expired' })
		expect(revalidatePath).not.toHaveBeenCalled()
	})

	it('fails closed when the secret is not configured', async () => {
		const saved = process.env.SANITY_REVALIDATE_SECRET
		delete process.env.SANITY_REVALIDATE_SECRET
		try {
			const response = await POST(await signedRequest(Date.now()))
			expect(response.status).toBe(500)
			expect(revalidatePath).not.toHaveBeenCalled()
		} finally {
			process.env.SANITY_REVALIDATE_SECRET = saved
		}
	})
})
