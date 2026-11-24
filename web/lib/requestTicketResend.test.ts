import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'

jest.mock('@/sanity/fetch', () => ({
	getEventByDetailsId: jest.fn(),
}))
// sanity/fetchOptions imports next-sanity's cookie helper (ESM, request-only)
jest.mock('next-sanity/live', () => ({ resolvePerspectiveFromCookies: jest.fn() }))

// Fixed clock: event dates are compared against the UK date of `now`
const NOW = new Date('2026-11-20T14:00:00Z')
const EVENT_DATES: Record<string, string> = {
	'past-event': '2026-11-19',
	'today-event': '2026-11-20',
	'future-event': '2026-12-31',
}

describe('requestTicketResend', () => {
	let db: TestDatabase
	let requestTicketResend: typeof import('./requestTicketResend').requestTicketResend
	let RESEND_MAX_ORDERS: number
	let getEventByDetailsId: jest.Mock

	beforeAll(async () => {
		db = await startTestDatabase()
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ requestTicketResend, RESEND_MAX_ORDERS } = await import('./requestTicketResend'))
		getEventByDetailsId = (await import('@/sanity/fetch')).getEventByDetailsId as jest.Mock
	}, 60_000)

	afterAll(async () => {
		await db.stop()
	})

	beforeEach(async () => {
		await db.sql`delete from orders`
		getEventByDetailsId.mockReset().mockImplementation(async (eventId: string) =>
			EVENT_DATES[eventId] ? { title: eventId, date: EVENT_DATES[eventId] } : null,
		)
	})

	// Inserted directly: only the columns the request reads matter here
	async function insertOrder(
		options: { email?: string; eventId?: string; status?: string; lastResentMinutesAgo?: number; createdMinutesAgo?: number } = {},
	) {
		const { email = 'buyer@example.com', eventId = 'future-event', status = 'paid', lastResentMinutesAgo, createdMinutesAgo = 60 } = options
		const lastResentAt = lastResentMinutesAgo === undefined ? null : new Date(Date.now() - lastResentMinutesAgo * 60_000)
		const [order] = await db.sql<{ id: string }[]>`
			insert into orders (event_id, provider, email, amount_total, status, last_resent_at, created_at)
			values (${eventId}, 'sumup', ${email}, 1000, ${status}, ${lastResentAt},
				now() - make_interval(mins => ${createdMinutesAgo}))
			returning id
		`
		return order.id
	}

	async function requestedAt(orderId: string) {
		const [row] = await db.sql<{ resend_requested_at: Date | null }[]>`select resend_requested_at from orders where id = ${orderId}`
		return row.resend_requested_at
	}

	it('queues every paid order at the address for an upcoming event, whatever the case of the email', async () => {
		const first = await insertOrder({ email: 'Buyer@Example.com' })
		const second = await insertOrder({ eventId: 'today-event' })

		const queued = await requestTicketResend('BUYER@example.COM', NOW)

		expect(queued.sort()).toEqual([first, second].sort())
		expect(await requestedAt(first)).toBeInstanceOf(Date)
	})

	it("skips events that have passed, but not one that's on today — the event-day buyer needs it most", async () => {
		const past = await insertOrder({ eventId: 'past-event' })
		const today = await insertOrder({ eventId: 'today-event' })

		expect(await requestTicketResend('buyer@example.com', NOW)).toEqual([today])
		expect(await requestedAt(past)).toBeNull()
	})

	it("skips an order whose event can't be found in Sanity", async () => {
		await insertOrder({ eventId: 'deleted-event' })
		expect(await requestTicketResend('buyer@example.com', NOW)).toEqual([])
	})

	it('ignores unpaid orders and other addresses', async () => {
		await insertOrder({ status: 'pending' })
		await insertOrder({ status: 'failed' })
		await insertOrder({ email: 'someone-else@example.com' })

		expect(await requestTicketResend('buyer@example.com', NOW)).toEqual([])
	})

	it('looks nothing up in Sanity for an address with no paid orders', async () => {
		expect(await requestTicketResend('nobody@example.com', NOW)).toEqual([])
		expect(getEventByDetailsId).not.toHaveBeenCalled()
	})

	it('queues at most the most recent few orders in one request', async () => {
		const ids: string[] = []
		for (let minutesAgo = 10; minutesAgo > 10 - (RESEND_MAX_ORDERS + 2); minutesAgo--) {
			ids.push(await insertOrder({ createdMinutesAgo: minutesAgo }))
		}
		const mostRecent = ids.slice(-RESEND_MAX_ORDERS)

		expect((await requestTicketResend('buyer@example.com', NOW)).sort()).toEqual(mostRecent.sort())
	})

	it('ignores an order resent within the cooldown, and queues it again once the cooldown has passed', async () => {
		const recent = await insertOrder({ lastResentMinutesAgo: 10 })
		const older = await insertOrder({ lastResentMinutesAgo: 45 })

		expect(await requestTicketResend('buyer@example.com', NOW)).toEqual([older])
		expect(await requestedAt(recent)).toBeNull()
	})

	it("doesn't queue an order twice — repeated presses add nothing while it's waiting", async () => {
		const order = await insertOrder()
		const firstRequest = await requestedAt(order)

		expect(await requestTicketResend('buyer@example.com', NOW)).toEqual([order])
		const queuedAt = await requestedAt(order)
		expect(firstRequest).toBeNull()

		expect(await requestTicketResend('buyer@example.com', NOW)).toEqual([])
		expect(await requestedAt(order)).toEqual(queuedAt)
	})
})
