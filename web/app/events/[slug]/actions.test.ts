import { reserveOrder } from '@/lib/reserveOrder'
import { getEventDetailsById } from '@/sanity/fetch'
import { londonDate } from '@/lib/dateFormat'
import { createOrder, type CreateOrderInput } from './actions'

jest.mock('next/headers', () => ({
	headers: jest.fn(async () => new Headers({ 'x-vercel-forwarded-for': '203.0.113.7' })),
}))
jest.mock('next/navigation', () => ({ redirect: jest.fn() }))
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: jest.fn(async () => ({ limited: false })) }))
jest.mock('@/lib/turnstile', () => ({ verifyTurnstileToken: jest.fn() }))
// An event comfortably on sale; individual tests override what they need
const ON_SALE_DETAILS = {
	_id: 'details-1',
	ticketingStatus: 'on_sale',
	eventDate: '2099-12-31',
	tiers: [{ _key: 'ga', name: 'GA', price: 10, capacity: 100, releaseTrigger: 'scheduled' }],
}
jest.mock('@/sanity/fetch', () => ({
	getEventDetailsById: jest.fn(),
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
		jest.mocked(getEventDetailsById).mockResolvedValue(ON_SALE_DETAILS as never)
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

describe('createOrder — sale state (8API.5)', () => {
	beforeEach(() => {
		jest.mocked(reserveOrder).mockClear()
		jest.mocked(getEventDetailsById).mockResolvedValue(ON_SALE_DETAILS as never)
	})

	it.each([
		['an editor closed it', { ticketingStatus: 'closed' }, 'Tickets for this event are no longer on sale.'],
		["it isn't on sale yet", { ticketingStatus: 'not_open' }, "Tickets for this event aren't on sale yet."],
		['an editor marked it sold out', { ticketingStatus: 'sold_out' }, 'Sorry, this event has sold out.'],
		// Today, in UK time — online sales stop at 00:00 on the event date
		['it is the event day', { eventDate: londonDate(new Date()) }, 'Online sales have closed — tickets are available on the door.'],
		['the event has passed', { eventDate: '2020-01-01' }, 'Online sales have closed — tickets are available on the door.'],
	])('refuses a purchase when %s, without reserving anything — whatever the page showed', async (_case, override, message) => {
		jest.mocked(getEventDetailsById).mockResolvedValue({ ...ON_SALE_DETAILS, ...override } as never)

		expect(await createOrder({ status: 'idle' }, OPTED_IN)).toEqual({ status: 'unavailable', message })
		expect(reserveOrder).not.toHaveBeenCalled()
	})

	it('passes one clock to reserveOrder for its tier windows', async () => {
		await createOrder({ status: 'idle' }, OPTED_IN)

		expect(jest.mocked(reserveOrder).mock.calls[0][2]).toBeInstanceOf(Date)
	})

	it("explains a tier that's outside its sale window", async () => {
		jest.mocked(reserveOrder).mockResolvedValueOnce({ status: 'tier_not_on_sale', tierKey: 'ga' })

		expect(await createOrder({ status: 'idle' }, OPTED_IN)).toEqual({
			status: 'unavailable',
			message: "One of the selected tiers isn't on sale right now.",
		})
	})
})
