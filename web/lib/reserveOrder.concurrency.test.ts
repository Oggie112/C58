import fs from 'node:fs'
import path from 'node:path'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import type { SanityTier } from '@/types/sanity'

// The one deliberately committed DB-backed test in this project — every
// other Postgres-touching check has been ad-hoc and deleted after use, but
// this is the actual correctness guarantee the whole reservation design
// exists for (no overselling), not incidental dev verification. Spins up
// its own throwaway container via testcontainers rather than relying on an
// externally-provided DATABASE_POOLED_URL, so `npm test` stays self
// contained — Docker is the only requirement, same as every ad-hoc check
// this project has already relied on.
describe('reserveOrder concurrency', () => {
	let container: StartedPostgreSqlContainer
	let sql: typeof import('./db').sql
	let reserveOrder: typeof import('./reserveOrder').reserveOrder

	beforeAll(async () => {
		container = await new PostgreSqlContainer('postgres:16').start()
		process.env.DATABASE_POOLED_URL = container.getConnectionUri()

		// lib/db.ts reads DATABASE_POOLED_URL at module-load time, so these
		// must be imported dynamically, after the env var above is set — a
		// static top-level import would evaluate (and throw) too early.
		;({ sql } = await import('./db'))
		;({ reserveOrder } = await import('./reserveOrder'))

		const migrationsDir = path.resolve(__dirname, '../../supabase/migrations')
		const migrationFiles = fs
			.readdirSync(migrationsDir)
			.filter((file) => file.endsWith('.sql'))
			.sort()
		for (const file of migrationFiles) {
			await sql.file(path.join(migrationsDir, file))
		}
	}, 60_000)

	afterAll(async () => {
		await sql.end()
		await container.stop()
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
