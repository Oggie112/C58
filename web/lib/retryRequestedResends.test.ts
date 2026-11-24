import type { ResendOutcome } from './sendTicketResend'
import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'

jest.mock('./sendTicketResend', () => ({
	sendTicketResend: jest.fn(),
}))

describe('retryRequestedResends', () => {
	let db: TestDatabase
	let retryRequestedResends: typeof import('./retryRequestedResends').retryRequestedResends
	let RESEND_RETRY_BATCH_SIZE: number
	let sendTicketResend: jest.MockedFunction<(orderId: string) => Promise<ResendOutcome>>

	beforeAll(async () => {
		db = await startTestDatabase()
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ retryRequestedResends, RESEND_RETRY_BATCH_SIZE } = await import('./retryRequestedResends'))
		sendTicketResend = (await import('./sendTicketResend')).sendTicketResend as typeof sendTicketResend
	}, 60_000)

	afterAll(async () => {
		await db.stop()
	})

	beforeEach(async () => {
		await db.sql`delete from orders`
		sendTicketResend.mockReset().mockResolvedValue('sent')
	})

	async function insertOrder(options: { status?: string; requestedMinutesAgo?: number | null } = {}) {
		const { status = 'paid', requestedMinutesAgo = 60 } = options
		const [order] = await db.sql<{ id: string }[]>`
			insert into orders (event_id, provider, email, amount_total, status, resend_requested_at)
			values ('resend-retry-test-event', 'sumup', 'buyer@example.com', 1000, ${status},
				${requestedMinutesAgo === null ? null : db.sql`now() - make_interval(mins => ${requestedMinutesAgo})`})
			returning id
		`
		return order.id
	}

	it('retries queued requests oldest first, leaving ones the form may still be sending', async () => {
		const newer = await insertOrder({ requestedMinutesAgo: 30 })
		const older = await insertOrder({ requestedMinutesAgo: 90 })
		await insertOrder({ requestedMinutesAgo: 1 }) // inside the grace period
		await insertOrder({ requestedMinutesAgo: null }) // nothing queued
		await insertOrder({ status: 'refunded' })

		const summary = await retryRequestedResends()

		expect(sendTicketResend.mock.calls.map(([id]) => id)).toEqual([older, newer])
		expect(summary).toEqual({ found: 2, sent: 2, skipped: 0, failed: 0, stoppedEarly: false })
	})

	it('handles at most one batch per run', async () => {
		for (let i = 0; i < RESEND_RETRY_BATCH_SIZE + 3; i++) await insertOrder({ requestedMinutesAgo: 60 + i })

		const summary = await retryRequestedResends()

		expect(summary.found).toBe(RESEND_RETRY_BATCH_SIZE)
		expect(sendTicketResend).toHaveBeenCalledTimes(RESEND_RETRY_BATCH_SIZE)
	})

	it('stops after three failures in a row — an account-wide problem like the quota', async () => {
		for (let i = 0; i < 5; i++) await insertOrder({ requestedMinutesAgo: 60 + i })
		sendTicketResend.mockResolvedValue('failed')

		expect(await retryRequestedResends()).toEqual({ found: 5, sent: 0, skipped: 0, failed: 3, stoppedEarly: true })
	})
})
