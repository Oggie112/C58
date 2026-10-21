import type { SanityTier } from '@/types/sanity'
import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'

// Committed rather than ad-hoc (the project's default for DB-touching
// checks): this is the actual correctness guarantee the whole reservation
// design exists for — no overselling — not incidental dev verification.
describe('reserveOrder concurrency', () => {
	let db: TestDatabase
	let sql: TestDatabase['sql']
	let reserveOrder: typeof import('./reserveOrder').reserveOrder

	beforeAll(async () => {
		db = await startTestDatabase()
		sql = db.sql
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ reserveOrder } = await import('./reserveOrder'))
	}, 60_000)

	afterAll(async () => {
		await db.stop()
	})

	it('resolves two simultaneous purchases against the last tier spot to exactly one reserved, one sold out', async () => {
		const eventId = 'concurrency-test-event'
		await sql`insert into tiers (event_id, tier_key, capacity, reserved) values (${eventId}, 'last-spot', 1, 0)`

		const tiers: SanityTier[] = [
			{ _key: 'last-spot', name: 'Last Spot', price: 10, capacity: 1, releaseTrigger: 'scheduled' },
		]

		const orderInput = (email: string) => ({
			eventDetailsId: eventId,
			items: [{ tierKey: 'last-spot', quantity: 1 }],
			email,
			marketingOptIn: false,
		})

		const [resultA, resultB] = await Promise.all([
			reserveOrder(orderInput('buyer-a@example.com'), tiers),
			reserveOrder(orderInput('buyer-b@example.com'), tiers),
		])

		expect([resultA.status, resultB.status].sort()).toEqual(['reserved', 'sold_out'])

		const [tier] = await sql<{ reserved: number }[]>`
			select reserved from tiers where event_id = ${eventId} and tier_key = 'last-spot'
		`
		expect(tier.reserved).toBe(1)
	})

	it('returns invalid_tier for an unknown tierKey instead of throwing', async () => {
		const result = await reserveOrder(
			{
				eventDetailsId: 'concurrency-test-event',
				items: [{ tierKey: 'does-not-exist', quantity: 1 }],
				email: 'buyer@example.com',
				marketingOptIn: false,
			},
			[],
		)

		expect(result).toEqual({ status: 'invalid_tier', tierKey: 'does-not-exist' })
	})
})
