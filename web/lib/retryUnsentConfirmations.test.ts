import type { ConfirmationOutcome } from './sendOrderConfirmation'
import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'

jest.mock('./sendOrderConfirmation', () => ({
	sendOrderConfirmation: jest.fn(),
}))

describe('retryUnsentConfirmations', () => {
	let db: TestDatabase
	let retryUnsentConfirmations: typeof import('./retryUnsentConfirmations').retryUnsentConfirmations
	let sendOrderConfirmation: jest.MockedFunction<(orderId: string) => Promise<ConfirmationOutcome>>

	beforeAll(async () => {
		db = await startTestDatabase()
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ retryUnsentConfirmations } = await import('./retryUnsentConfirmations'))
		sendOrderConfirmation = (await import('./sendOrderConfirmation')).sendOrderConfirmation as typeof sendOrderConfirmation
	}, 60_000)

	afterAll(async () => {
		await db.stop()
	})

	beforeEach(async () => {
		await db.sql`delete from orders`
		sendOrderConfirmation.mockReset().mockResolvedValue('sent')
	})

	// Inserted directly: only the columns the selection reads matter here —
	// sendOrderConfirmation itself is mocked (its own suite covers sending).
	async function insertOrder(options: { status?: string; confirmationSentAt?: Date | null; minutesAgo?: number } = {}) {
		const { status = 'paid', confirmationSentAt = null, minutesAgo = 60 } = options
		const [order] = await db.sql<{ id: string }[]>`
			insert into orders (event_id, provider, email, amount_total, status, confirmation_sent_at, created_at)
			values ('retry-test-event', 'sumup', 'buyer@example.com', 1000, ${status}, ${confirmationSentAt},
				now() - make_interval(mins => ${minutesAgo}))
			returning id
		`
		return order.id
	}

	it('retries only paid orders still missing a confirmation, oldest first, past the grace period', async () => {
		const oldest = await insertOrder({ minutesAgo: 120 })
		const newer = await insertOrder({ minutesAgo: 30 })
		await insertOrder({ minutesAgo: 2 }) // in-flight grace period
		await insertOrder({ status: 'pending' })
		await insertOrder({ status: 'failed' })
		await insertOrder({ confirmationSentAt: new Date() }) // already sent

		const summary = await retryUnsentConfirmations()

		expect(sendOrderConfirmation.mock.calls.map(([id]) => id)).toEqual([oldest, newer])
		expect(summary).toEqual({ found: 2, sent: 2, skipped: 0, failed: 0, stoppedEarly: false })
	})

	it('keeps going past scattered failures — one bad order mustn\'t block the queue', async () => {
		for (let i = 0; i < 6; i++) await insertOrder({ minutesAgo: 60 - i })
		const outcomes: ConfirmationOutcome[] = ['failed', 'sent', 'failed', 'failed', 'sent', 'skipped']
		for (const outcome of outcomes) sendOrderConfirmation.mockResolvedValueOnce(outcome)

		const summary = await retryUnsentConfirmations()

		expect(sendOrderConfirmation).toHaveBeenCalledTimes(6)
		expect(summary).toEqual({ found: 6, sent: 2, skipped: 1, failed: 3, stoppedEarly: false })
	})

	it('stops after three failures in a row — an account-wide problem — leaving the rest for the next run', async () => {
		for (let i = 0; i < 6; i++) await insertOrder({ minutesAgo: 60 - i })
		sendOrderConfirmation.mockResolvedValue('failed')

		const summary = await retryUnsentConfirmations()

		expect(sendOrderConfirmation).toHaveBeenCalledTimes(3)
		expect(summary).toEqual({ found: 6, sent: 0, skipped: 0, failed: 3, stoppedEarly: true })
	})

	it('handles at most 50 orders per run', async () => {
		await db.sql`
			insert into orders (event_id, provider, email, amount_total, status, created_at)
			select 'retry-test-event', 'sumup', 'buyer@example.com', 1000, 'paid', now() - interval '1 hour'
			from generate_series(1, 55)
		`

		const summary = await retryUnsentConfirmations()

		expect(summary.found).toBe(50)
		expect(sendOrderConfirmation).toHaveBeenCalledTimes(50)
	})

	it('does nothing when there is nothing to retry', async () => {
		await insertOrder({ confirmationSentAt: new Date() })

		expect(await retryUnsentConfirmations()).toEqual({ found: 0, sent: 0, skipped: 0, failed: 0, stoppedEarly: false })
		expect(sendOrderConfirmation).not.toHaveBeenCalled()
	})
})
