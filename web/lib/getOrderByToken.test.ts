import type { SanityTier } from '@/types/sanity'
import type { CheckoutStatus } from './sumup'
import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'

jest.mock('./sumup', () => ({
	getCheckoutStatus: jest.fn(),
}))

// The order page's whole access model is "whoever has the token": every
// reservation must get its own, and lookups must only ever match it exactly.
describe('order access tokens', () => {
	let db: TestDatabase
	let reserveOrder: typeof import('./reserveOrder').reserveOrder
	let getOrderByToken: typeof import('./getOrderByToken').getOrderByToken
	let confirmOrder: typeof import('./confirmOrder').confirmOrder
	let getCheckoutStatus: jest.MockedFunction<(checkoutId: string) => Promise<CheckoutStatus>>

	const eventId = 'order-token-test-event'
	const tiers: SanityTier[] = [
		{ _key: 'ga', name: 'General Admission', price: 12.5, capacity: 100, releaseTrigger: 'scheduled' },
		{ _key: 'vip', name: 'VIP', price: 30, capacity: 100, releaseTrigger: 'scheduled' },
	]

	beforeAll(async () => {
		db = await startTestDatabase()
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ reserveOrder } = await import('./reserveOrder'))
		;({ getOrderByToken } = await import('./getOrderByToken'))
		;({ confirmOrder } = await import('./confirmOrder'))
		getCheckoutStatus = (await import('./sumup')).getCheckoutStatus as typeof getCheckoutStatus

		await db.sql`insert into tiers (event_id, tier_key, capacity, reserved) values (${eventId}, 'ga', 100, 0), (${eventId}, 'vip', 100, 0)`
	}, 60_000)

	afterAll(async () => {
		await db.stop()
	})

	async function reserve(email: string) {
		const result = await reserveOrder(
			{
				eventDetailsId: eventId,
				items: [
					{ tierKey: 'vip', quantity: 1 },
					{ tierKey: 'ga', quantity: 2 },
				],
				email,
				marketingOptIn: false,
			},
			tiers,
		)
		if (result.status !== 'reserved') throw new Error(`Expected reserved, got ${result.status}`)
		return result
	}

	it('gives each reservation its own token, stored on the order', async () => {
		const first = await reserve('first@example.com')
		const second = await reserve('second@example.com')

		expect(first.accessToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
		expect(first.accessToken).not.toBe(second.accessToken)

		const [row] = await db.sql<{ access_token: string }[]>`select access_token from orders where id = ${first.orderId}`
		expect(row.access_token).toBe(first.accessToken)
	})

	it('looks up the order and its lines by token, cheapest line first', async () => {
		const reserved = await reserve('buyer@example.com')

		await expect(getOrderByToken(reserved.accessToken)).resolves.toEqual({
			id: reserved.orderId,
			eventId,
			status: 'pending',
			email: 'buyer@example.com',
			amountTotal: 5500,
			providerSessionId: null,
			lines: [
				{ tierName: 'General Admission', quantity: 2, unitPrice: 1250 },
				{ tierName: 'VIP', quantity: 1, unitPrice: 3000 },
			],
			tickets: [],
		})
	})

	it('returns the tickets confirmOrder issued, one per admission, in line order', async () => {
		const reserved = await reserve('paid@example.com')
		const providerSessionId = 'checkout-for-paid-order'
		await db.sql`update orders set provider_session_id = ${providerSessionId} where id = ${reserved.orderId}`
		getCheckoutStatus.mockResolvedValueOnce('PAID')

		await confirmOrder({ id: reserved.orderId, providerSessionId })

		const order = await getOrderByToken(reserved.accessToken)
		expect(order?.status).toBe('paid')
		expect(order?.tickets.map((ticket) => [ticket.tierName, ticket.status])).toEqual([
			['General Admission', 'valid'],
			['General Admission', 'valid'],
			['VIP', 'valid'],
		])
		for (const ticket of order?.tickets ?? []) {
			expect(ticket.code).toMatch(/^C58-[0-9A-F]{16}$/)
		}
		expect(new Set(order?.tickets.map((ticket) => ticket.code)).size).toBe(3)
	})

	it('returns null for a well-formed token that matches no order', async () => {
		await expect(getOrderByToken('A'.repeat(43))).resolves.toBeNull()
	})

	it('returns null for malformed tokens, including a real token with a character dropped', async () => {
		const reserved = await reserve('another@example.com')

		await expect(getOrderByToken(reserved.accessToken.slice(1))).resolves.toBeNull()
		await expect(getOrderByToken(reserved.orderId)).resolves.toBeNull()
		await expect(getOrderByToken('')).resolves.toBeNull()
	})
})
