import type { MarketingSyncOutcome } from './syncMarketingOptIn'
import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'

jest.mock('./syncMarketingOptIn', () => ({
	syncMarketingOptIn: jest.fn(),
}))
// Imported for its constants only; its sender must never run here
jest.mock('./sendOrderConfirmation', () => ({
	sendOrderConfirmation: jest.fn(),
}))

describe('retryUnsyncedOptIns', () => {
	let db: TestDatabase
	let retryUnsyncedOptIns: typeof import('./retryUnsyncedOptIns').retryUnsyncedOptIns
	let syncMarketingOptIn: jest.MockedFunction<(orderId: string) => Promise<MarketingSyncOutcome>>

	beforeAll(async () => {
		db = await startTestDatabase()
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ retryUnsyncedOptIns } = await import('./retryUnsyncedOptIns'))
		syncMarketingOptIn = (await import('./syncMarketingOptIn')).syncMarketingOptIn as typeof syncMarketingOptIn
	}, 60_000)

	afterAll(async () => {
		await db.stop()
	})

	beforeEach(async () => {
		await db.sql`delete from orders`
		syncMarketingOptIn.mockReset().mockResolvedValue('synced')
	})

	async function insertOrder(options: { status?: string; optIn?: boolean; syncedAt?: Date | null; minutesAgo?: number } = {}) {
		const { status = 'paid', optIn = true, syncedAt = null, minutesAgo = 60 } = options
		const [order] = await db.sql<{ id: string }[]>`
			insert into orders (event_id, provider, email, amount_total, status, marketing_opt_in, marketing_synced_at, created_at)
			values ('opt-in-retry-test', 'sumup', 'buyer@example.com', 1000, ${status}, ${optIn}, ${syncedAt},
				now() - make_interval(mins => ${minutesAgo}))
			returning id
		`
		return order.id
	}

	it('retries only paid, opted-in orders not yet on the list, oldest first, past the grace period', async () => {
		const oldest = await insertOrder({ minutesAgo: 120 })
		const newer = await insertOrder({ minutesAgo: 30 })
		await insertOrder({ minutesAgo: 2 }) // grace period
		await insertOrder({ optIn: false }) // never opted in
		await insertOrder({ status: 'pending' }) // abandoned checkout
		await insertOrder({ syncedAt: new Date() }) // already on the list

		const summary = await retryUnsyncedOptIns()

		expect(syncMarketingOptIn.mock.calls.map(([id]) => id)).toEqual([oldest, newer])
		expect(summary).toEqual({ found: 2, synced: 2, skipped: 0, failed: 0, stoppedEarly: false })
	})

	it('stops after three failures in a row', async () => {
		for (let i = 0; i < 5; i++) await insertOrder({ minutesAgo: 60 - i })
		syncMarketingOptIn.mockResolvedValue('failed')

		const summary = await retryUnsyncedOptIns()

		expect(syncMarketingOptIn).toHaveBeenCalledTimes(3)
		expect(summary).toEqual({ found: 5, synced: 0, skipped: 0, failed: 3, stoppedEarly: true })
	})
})
