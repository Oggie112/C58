import type { SanityTier } from '@/types/sanity'
import type { CheckoutStatus } from './sumup'
import type { ListContact } from './brevo'
import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'
import { londonDate } from './dateFormat'

jest.mock('./sumup', () => ({
	getCheckoutStatus: jest.fn(),
}))
jest.mock('./brevo', () => ({
	addContactToList: jest.fn(),
}))
jest.mock('@/sanity/fetch', () => ({
	getEventByDetailsId: jest.fn(),
}))
// sanity/fetchOptions imports next-sanity's cookie helper (ESM, request-only);
// stubbed so the real PUBLISHED_FETCH_OPTIONS constant can be asserted on.
jest.mock('next-sanity/live', () => ({
	resolvePerspectiveFromCookies: jest.fn(),
}))

describe('syncMarketingOptIn', () => {
	let db: TestDatabase
	let reserveOrder: typeof import('./reserveOrder').reserveOrder
	let attachCheckoutSession: typeof import('./attachCheckoutSession').attachCheckoutSession
	let confirmOrder: typeof import('./confirmOrder').confirmOrder
	let syncMarketingOptIn: typeof import('./syncMarketingOptIn').syncMarketingOptIn
	let MARKETING_OPT_IN_WORDING: string
	let getCheckoutStatus: jest.MockedFunction<(checkoutId: string) => Promise<CheckoutStatus>>
	let addContactToList: jest.MockedFunction<(contact: ListContact) => Promise<void>>
	let getEventByDetailsId: jest.Mock

	const eventId = 'marketing-sync-test-event'
	// Effectively unlimited — see the same note in sendOrderConfirmation.test.ts
	const CAPACITY = 100_000
	const tiers: SanityTier[] = [{ _key: 'ga', name: 'General Admission', price: 10, capacity: CAPACITY, releaseTrigger: 'scheduled' }]
	const originalEnv = process.env

	beforeAll(async () => {
		db = await startTestDatabase()
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ reserveOrder } = await import('./reserveOrder'))
		;({ attachCheckoutSession } = await import('./attachCheckoutSession'))
		;({ confirmOrder } = await import('./confirmOrder'))
		;({ syncMarketingOptIn } = await import('./syncMarketingOptIn'))
		;({ MARKETING_OPT_IN_WORDING } = await import('./marketingOptIn'))
		getCheckoutStatus = (await import('./sumup')).getCheckoutStatus as typeof getCheckoutStatus
		addContactToList = (await import('./brevo')).addContactToList as typeof addContactToList
		getEventByDetailsId = (await import('@/sanity/fetch')).getEventByDetailsId as jest.Mock

		await db.sql`insert into tiers (event_id, tier_key, capacity, reserved) values (${eventId}, 'ga', ${CAPACITY}, 0)`
	}, 60_000)

	afterAll(async () => {
		process.env = originalEnv
		await db.stop()
	})

	beforeEach(() => {
		// Switched on for these tests — the dormant default has its own test below
		process.env = { ...originalEnv, BREVO_LIST_ID: '3', MARKETING_OPT_IN_ENABLED: 'true' }
		addContactToList.mockReset().mockResolvedValue(undefined)
		getEventByDetailsId.mockReset().mockResolvedValue({ title: 'Beach Party', date: '2026-11-20' })
		jest.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	async function reserve(marketingOptIn: boolean, email = 'buyer@example.com') {
		const reserved = await reserveOrder(
			{ eventDetailsId: eventId, items: [{ tierKey: 'ga', quantity: 1 }], email, marketingOptIn },
			tiers,
		)
		if (reserved.status !== 'reserved') throw new Error(`Expected reserved, got ${reserved.status}`)
		return reserved
	}

	async function paidOrder(marketingOptIn = true) {
		const reserved = await reserve(marketingOptIn)
		const checkoutId = `checkout-${reserved.orderId}`
		await attachCheckoutSession(reserved.orderId, checkoutId)
		getCheckoutStatus.mockResolvedValueOnce('PAID')
		await confirmOrder({ id: reserved.orderId, providerSessionId: checkoutId })
		return reserved
	}

	async function syncedAt(orderId: string) {
		const [row] = await db.sql<{ marketing_synced_at: Date | null }[]>`select marketing_synced_at from orders where id = ${orderId}`
		return row.marketing_synced_at
	}

	it('adds an opted-in paid buyer to the list with attributes recording their consent', async () => {
		const order = await paidOrder()
		const [{ created_at: createdAt }] = await db.sql<{ created_at: Date }[]>`select created_at from orders where id = ${order.orderId}`

		expect(await syncMarketingOptIn(order.orderId)).toBe('synced')

		expect(addContactToList).toHaveBeenCalledWith({
			email: 'buyer@example.com',
			listId: 3,
			attributes: {
				OPT_IN_SOURCE: 'ticket purchase',
				// The UK date they ticked the box and submitted — not when the sync ran
				OPT_IN_DATE: londonDate(createdAt),
				// Exactly what the checkbox showed
				OPT_IN_WORDING: MARKETING_OPT_IN_WORDING,
				OPT_IN_ORDER: order.orderId,
				LAST_EVENT: 'Beach Party',
			},
		})
		expect(await syncedAt(order.orderId)).toBeInstanceOf(Date)
	})

	it('reads the event from Sanity as published, never drafts', async () => {
		const order = await paidOrder()

		await syncMarketingOptIn(order.orderId)

		expect(getEventByDetailsId).toHaveBeenCalledWith(eventId, { perspective: 'published', stega: false })
	})

	it.each([
		['unset', undefined],
		['anything but "true"', 'yes'],
	])('does nothing while marketing is switched off (%s) — no Brevo call, nothing claimed', async (_case, value) => {
		const order = await paidOrder()
		if (value === undefined) delete process.env.MARKETING_OPT_IN_ENABLED
		else process.env.MARKETING_OPT_IN_ENABLED = value

		expect(await syncMarketingOptIn(order.orderId)).toBe('skipped')
		expect(addContactToList).not.toHaveBeenCalled()
		// Left unclaimed, so it still syncs once marketing is switched on
		expect(await syncedAt(order.orderId)).toBeNull()
	})

	it('never adds a buyer who did not opt in', async () => {
		const order = await paidOrder(false)

		expect(await syncMarketingOptIn(order.orderId)).toBe('skipped')
		expect(addContactToList).not.toHaveBeenCalled()
		expect(await syncedAt(order.orderId)).toBeNull()
	})

	it('never adds a buyer whose order was not paid — abandoned checkouts stay off the list', async () => {
		const reserved = await reserve(true, 'abandoned@example.com')

		expect(await syncMarketingOptIn(reserved.orderId)).toBe('skipped')
		expect(addContactToList).not.toHaveBeenCalled()
	})

	it('adds a buyer once however many times, or however concurrently, it is called', async () => {
		const order = await paidOrder()

		const outcomes = await Promise.all(Array.from({ length: 5 }, () => syncMarketingOptIn(order.orderId)))
		outcomes.push(await syncMarketingOptIn(order.orderId))

		expect(addContactToList).toHaveBeenCalledTimes(1)
		expect(outcomes.filter((outcome) => outcome === 'synced')).toHaveLength(1)
	})

	it('releases the claim when Brevo fails, logging it, so the next call retries — without throwing', async () => {
		const order = await paidOrder()
		addContactToList.mockRejectedValueOnce(new Error('Brevo contact update failed: 500'))

		await expect(syncMarketingOptIn(order.orderId)).resolves.toBe('failed')
		expect(await syncedAt(order.orderId)).toBeNull()
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining(order.orderId), expect.any(Error))

		expect(await syncMarketingOptIn(order.orderId)).toBe('synced')
		expect(await syncedAt(order.orderId)).toBeInstanceOf(Date)
	})

	it('fails (and releases) rather than guessing when BREVO_LIST_ID is missing', async () => {
		const order = await paidOrder()
		delete process.env.BREVO_LIST_ID

		expect(await syncMarketingOptIn(order.orderId)).toBe('failed')
		expect(addContactToList).not.toHaveBeenCalled()
		expect(await syncedAt(order.orderId)).toBeNull()
	})

	it('still adds the buyer, without LAST_EVENT, when the event has gone from Sanity', async () => {
		const order = await paidOrder()
		getEventByDetailsId.mockResolvedValueOnce(null)

		expect(await syncMarketingOptIn(order.orderId)).toBe('synced')
		expect(addContactToList.mock.calls[0][0].attributes).not.toHaveProperty('LAST_EVENT')
	})
})
