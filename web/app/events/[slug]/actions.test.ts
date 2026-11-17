import { reserveOrder } from '@/lib/reserveOrder'
import { createOrder, type CreateOrderInput } from './actions'

jest.mock('next/headers', () => ({
	headers: jest.fn(async () => new Headers({ 'x-vercel-forwarded-for': '203.0.113.7' })),
}))
jest.mock('next/navigation', () => ({ redirect: jest.fn() }))
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: jest.fn(async () => ({ limited: false })) }))
jest.mock('@/lib/turnstile', () => ({ verifyTurnstileToken: jest.fn() }))
jest.mock('@/sanity/fetch', () => ({
	getEventDetailsById: jest.fn(async () => ({
		_id: 'details-1',
		tiers: [{ _key: 'ga', name: 'GA', price: 10, capacity: 100, releaseTrigger: 'scheduled' }],
	})),
}))
// sanity/fetchOptions imports next-sanity's cookie helper (ESM, request-only)
jest.mock('next-sanity/live', () => ({ resolvePerspectiveFromCookies: jest.fn() }))
// Stops the action before checkout — only what it reserves matters here
jest.mock('@/lib/reserveOrder', () => ({ reserveOrder: jest.fn(async () => ({ status: 'sold_out' })) }))
jest.mock('@/lib/sumup', () => ({ createCheckoutSession: jest.fn() }))
jest.mock('@/lib/attachCheckoutSession', () => ({ attachCheckoutSession: jest.fn() }))
jest.mock('@/lib/failReservation', () => ({ failReservation: jest.fn() }))

const OPTED_IN: CreateOrderInput = {
	eventDetailsId: 'details-1',
	items: [{ tierKey: 'ga', quantity: 1 }],
	email: 'buyer@example.com',
	marketingOptIn: true,
}

describe('createOrder — marketing opt-in switch', () => {
	const originalEnv = process.env

	beforeEach(() => {
		process.env = { ...originalEnv }
		jest.mocked(reserveOrder).mockClear()
	})

	afterAll(() => {
		process.env = originalEnv
	})

	it.each([
		['unset', undefined],
		['anything but "true"', '1'],
	])('records the order as not opted in while marketing is switched off (%s), whatever the request says', async (_case, value) => {
		if (value === undefined) delete process.env.MARKETING_OPT_IN_ENABLED
		else process.env.MARKETING_OPT_IN_ENABLED = value

		// A hand-crafted request claiming consent the page never offered
		await createOrder({ status: 'idle' }, OPTED_IN)

		expect(jest.mocked(reserveOrder).mock.calls[0][0].marketingOptIn).toBe(false)
	})

	it("passes the buyer's choice through once marketing is switched on", async () => {
		process.env.MARKETING_OPT_IN_ENABLED = 'true'

		await createOrder({ status: 'idle' }, OPTED_IN)
		await createOrder({ status: 'idle' }, { ...OPTED_IN, marketingOptIn: false })

		expect(jest.mocked(reserveOrder).mock.calls.map(([input]) => input.marketingOptIn)).toEqual([true, false])
	})
})
