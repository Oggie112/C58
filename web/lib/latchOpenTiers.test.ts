import type { SanityTier } from '@/types/sanity'
import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'

// Committed for the same reason as reserveOrder.concurrency.test.ts: whether
// a tier is open is enforced inside reserveOrder's transaction, and the
// failure mode (a tier closing on buyers mid-checkout) only shows up across
// a real reservation, a real sweep and a second reservation.
describe('previousSoldOut tier latch', () => {
	let db: TestDatabase
	let sql: TestDatabase['sql']
	let reserveOrder: typeof import('./reserveOrder').reserveOrder
	let sweepStaleReservations: typeof import('./sweepStaleReservations').sweepStaleReservations
	let RESERVATION_HOLD_MINUTES: number

	const tiers: SanityTier[] = [
		{ _key: 'early', name: 'Early Bird', price: 10, capacity: 2, releaseTrigger: 'scheduled' },
		{ _key: 'standard', name: 'Standard', price: 15, capacity: 5, releaseTrigger: 'previousSoldOut' },
	]

	beforeAll(async () => {
		db = await startTestDatabase()
		sql = db.sql
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ reserveOrder } = await import('./reserveOrder'))
		;({ sweepStaleReservations } = await import('./sweepStaleReservations'))
		;({ RESERVATION_HOLD_MINUTES } = await import('./reservationWindow'))
	}, 60_000)

	afterAll(async () => {
		await db.stop()
	})

	let eventId: string
	let eventCounter = 0

	// Fresh event per test, so tier rows and latches don't leak between them.
	beforeEach(async () => {
		eventId = `latch-test-event-${++eventCounter}`
		await sql`
			insert into tiers (event_id, tier_key, capacity, reserved)
			values (${eventId}, 'early', 2, 0), (${eventId}, 'standard', 5, 0)
		`
	})

	const buy = (tierKey: string, quantity: number, email: string) =>
		reserveOrder({ eventDetailsId: eventId, items: [{ tierKey, quantity }], email, marketingOptIn: false }, tiers)

	async function openedAt(tierKey: string) {
		const [row] = await sql<{ opened_at: Date | null }[]>`
			select opened_at from tiers where event_id = ${eventId} and tier_key = ${tierKey}
		`
		return row.opened_at
	}

	// Ages every pending order past the hold, then runs the real sweep —
	// the "buyer abandoned SumUp's page" path.
	async function abandonPendingOrders() {
		await sql`
			update orders set created_at = now() - make_interval(mins => ${RESERVATION_HOLD_MINUTES + 1})
			where event_id = ${eventId} and status = 'pending'
		`
		await sweepStaleReservations(sql, eventId)
	}

	it('keeps the next tier open after the hold that opened it is swept', async () => {
		await expect(buy('early', 2, 'abandoner@example.com')).resolves.toMatchObject({ status: 'reserved' })
		expect(await openedAt('standard')).not.toBeNull()

		await abandonPendingOrders()
		const [early] = await sql<{ reserved: number }[]>`
			select reserved from tiers where event_id = ${eventId} and tier_key = 'early'
		`
		expect(early.reserved).toBe(0) // Early Bird seats genuinely back on sale

		// Without the latch, reserveOrder's own sweep-then-gate re-check sees
		// Early Bird with stock again and rejects this as tier_not_open.
		await expect(buy('standard', 1, 'later-buyer@example.com')).resolves.toMatchObject({ status: 'reserved' })
		// And the released Early Birds are buyable alongside it.
		await expect(buy('early', 1, 'bargain@example.com')).resolves.toMatchObject({ status: 'reserved' })
	})

	it('does not latch the next tier while the previous tier still has stock', async () => {
		await expect(buy('early', 1, 'buyer@example.com')).resolves.toMatchObject({ status: 'reserved' })

		expect(await openedAt('standard')).toBeNull()
		await expect(buy('standard', 1, 'too-early@example.com')).resolves.toMatchObject({ status: 'tier_not_open' })
	})

	it('never moves the latch once set', async () => {
		await buy('early', 2, 'first@example.com')
		const firstLatch = await openedAt('standard')
		expect(firstLatch).not.toBeNull()

		await buy('standard', 1, 'second@example.com')

		expect(await openedAt('standard')).toEqual(firstLatch)
	})
})
