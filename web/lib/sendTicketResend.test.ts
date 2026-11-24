import { randomBytes } from 'node:crypto'
import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'

// The email itself is covered by sendOrderConfirmation.test.ts — here only
// the claim, re-queue and cooldown bookkeeping matter
jest.mock('./emailOrderTickets', () => ({
	emailOrderTickets: jest.fn(),
}))

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

interface ResendColumns {
	resend_requested_at: Date | null
	last_resent_at: Date | null
	confirmation_sent_at: Date | null
}

describe('sendTicketResend', () => {
	let db: TestDatabase
	let sendTicketResend: typeof import('./sendTicketResend').sendTicketResend
	let emailOrderTickets: jest.Mock

	beforeAll(async () => {
		db = await startTestDatabase()
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ sendTicketResend } = await import('./sendTicketResend'))
		emailOrderTickets = (await import('./emailOrderTickets')).emailOrderTickets as jest.Mock
	}, 60_000)

	afterAll(async () => {
		await db.stop()
	})

	beforeEach(async () => {
		await db.sql`delete from orders`
		emailOrderTickets.mockReset().mockResolvedValue('sent')
		jest.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	const REQUESTED_AT = new Date('2026-11-20T10:00:00Z')
	const PREVIOUSLY_RESENT_AT = new Date('2026-11-19T09:00:00Z')

	// access_token is unique, so each order gets its own (generateAccessToken's shape)
	async function insertOrder(
		options: { queued?: boolean; accessToken?: string | null; confirmationSentAt?: Date | null; lastResentAt?: Date | null } = {},
	) {
		const {
			queued = true,
			accessToken = randomBytes(32).toString('base64url'),
			confirmationSentAt = null,
			lastResentAt = PREVIOUSLY_RESENT_AT,
		} = options
		const [order] = await db.sql<{ id: string }[]>`
			insert into orders (event_id, provider, email, amount_total, status, access_token,
				resend_requested_at, last_resent_at, confirmation_sent_at)
			values ('resend-test-event', 'sumup', 'buyer@example.com', 1000, 'paid', ${accessToken},
				${queued ? REQUESTED_AT : null}, ${lastResentAt}, ${confirmationSentAt})
			returning id
		`
		return order.id
	}

	async function columns(orderId: string) {
		const [row] = await db.sql<ResendColumns[]>`
			select resend_requested_at, last_resent_at, confirmation_sent_at from orders where id = ${orderId}
		`
		return row
	}

	it("sends with a fresh idempotency key — never the order id, which Brevo would treat as the first confirmation's duplicate", async () => {
		const token = randomBytes(32).toString('base64url')
		const order = await insertOrder({ accessToken: token })

		expect(await sendTicketResend(order)).toBe('sent')

		expect(emailOrderTickets).toHaveBeenCalledTimes(1)
		const [orderId, accessToken, idempotencyKey] = emailOrderTickets.mock.calls[0]
		expect(orderId).toBe(order)
		expect(accessToken).toBe(token)
		expect(idempotencyKey).toMatch(UUID_PATTERN)
		expect(idempotencyKey).not.toBe(order)
	})

	it('clears the request and starts the cooldown once sent', async () => {
		const order = await insertOrder()
		await sendTicketResend(order)

		const after = await columns(order)
		expect(after.resend_requested_at).toBeNull()
		expect(after.last_resent_at!.getTime()).toBeGreaterThan(PREVIOUSLY_RESENT_AT.getTime())
	})

	it('marks a never-sent first confirmation as sent, so the retry doesn\'t follow with a duplicate', async () => {
		const unconfirmed = await insertOrder()
		const confirmedAt = new Date('2026-11-18T12:00:00Z')
		const confirmed = await insertOrder({ confirmationSentAt: confirmedAt })

		await sendTicketResend(unconfirmed)
		await sendTicketResend(confirmed)

		expect((await columns(unconfirmed)).confirmation_sent_at).toBeInstanceOf(Date)
		expect((await columns(confirmed)).confirmation_sent_at).toEqual(confirmedAt)
	})

	it('re-queues a failed send as it was — the request kept for the retry, the cooldown not used up', async () => {
		emailOrderTickets.mockRejectedValue(new Error('Brevo: daily quota reached'))
		const order = await insertOrder()

		expect(await sendTicketResend(order)).toBe('failed')

		expect(await columns(order)).toEqual({
			resend_requested_at: REQUESTED_AT,
			last_resent_at: PREVIOUSLY_RESENT_AT,
			confirmation_sent_at: null,
		})
	})

	it('skips an order with nothing queued', async () => {
		const order = await insertOrder({ queued: false })

		expect(await sendTicketResend(order)).toBe('skipped')
		expect(emailOrderTickets).not.toHaveBeenCalled()
	})

	it('sends once when the form and the retry reach the same request together', async () => {
		let releaseSend!: () => void
		emailOrderTickets.mockImplementation(() => new Promise((resolve) => (releaseSend = () => resolve('sent'))))
		const order = await insertOrder()

		const first = sendTicketResend(order)
		const second = sendTicketResend(order)
		// Let both reach the claim before the first send completes
		await new Promise((resolve) => setTimeout(resolve, 50))
		releaseSend()

		expect([await first, await second].sort()).toEqual(['sent', 'skipped'])
		expect(emailOrderTickets).toHaveBeenCalledTimes(1)
	})

	it('drops, rather than retries for ever, a request for an order with no access token', async () => {
		const order = await insertOrder({ accessToken: null })

		expect(await sendTicketResend(order)).toBe('skipped')
		expect(emailOrderTickets).not.toHaveBeenCalled()
		expect((await columns(order)).resend_requested_at).toBeNull()
	})
})
