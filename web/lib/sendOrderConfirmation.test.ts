import type { SanityTier } from '@/types/sanity'
import type { CheckoutStatus } from './sumup'
import type { SendResult, TransactionalEmail } from './brevo'
import { startTestDatabase, type TestDatabase } from '@/tests/helpers/testDatabase'

jest.mock('./sumup', () => ({
	getCheckoutStatus: jest.fn(),
}))
jest.mock('./brevo', () => ({
	sendTransactionalEmail: jest.fn(),
}))
jest.mock('@/sanity/fetch', () => ({
	getEventByDetailsId: jest.fn(),
}))
// sanity/fetchOptions imports next-sanity's cookie helper (ESM, request-only);
// stubbed so the real PUBLISHED_FETCH_OPTIONS constant can be asserted on.
jest.mock('next-sanity/live', () => ({
	resolvePerspectiveFromCookies: jest.fn(),
}))
// Real PNG rendering takes ~30ms in Node but ~2.5s per image inside Jest's
// sandbox; PNG validity is covered by ticketQrCode.test.ts. Here a stand-in
// tagged with its code proves each attachment is its own ticket's image.
jest.mock('./ticketQrCode', () => ({
	ticketQrPng: jest.fn(async (code: string) => Buffer.from(`png-for-${code}`)),
}))

describe('sendOrderConfirmation', () => {
	let db: TestDatabase
	let reserveOrder: typeof import('./reserveOrder').reserveOrder
	let attachCheckoutSession: typeof import('./attachCheckoutSession').attachCheckoutSession
	let confirmOrder: typeof import('./confirmOrder').confirmOrder
	let sendOrderConfirmation: typeof import('./sendOrderConfirmation').sendOrderConfirmation
	let getCheckoutStatus: jest.MockedFunction<(checkoutId: string) => Promise<CheckoutStatus>>
	let sendTransactionalEmail: jest.MockedFunction<(email: TransactionalEmail) => Promise<SendResult>>
	let getEventByDetailsId: jest.Mock

	const eventId = 'confirmation-email-test-event'
	// Effectively unlimited: every test reserves tickets from this one tier, so
	// a small capacity would eventually fail paidOrder() with sold_out as tests
	// are added — failing for test volume, not for the code under test.
	const CAPACITY = 100_000
	const tiers: SanityTier[] = [{ _key: 'ga', name: 'General Admission', price: 12.5, capacity: CAPACITY, releaseTrigger: 'scheduled' }]

	beforeAll(async () => {
		process.env.NEXT_PUBLIC_SITE_URL = 'https://www.c58.uk'
		db = await startTestDatabase()
		// Dynamic, after startTestDatabase — see its note on lib/db.ts.
		;({ reserveOrder } = await import('./reserveOrder'))
		;({ attachCheckoutSession } = await import('./attachCheckoutSession'))
		;({ confirmOrder } = await import('./confirmOrder'))
		;({ sendOrderConfirmation } = await import('./sendOrderConfirmation'))
		getCheckoutStatus = (await import('./sumup')).getCheckoutStatus as typeof getCheckoutStatus
		sendTransactionalEmail = (await import('./brevo')).sendTransactionalEmail as typeof sendTransactionalEmail
		getEventByDetailsId = (await import('@/sanity/fetch')).getEventByDetailsId as jest.Mock

		await db.sql`insert into tiers (event_id, tier_key, capacity, reserved) values (${eventId}, 'ga', ${CAPACITY}, 0)`
	}, 60_000)

	afterAll(async () => {
		await db.stop()
	})

	beforeEach(() => {
		sendTransactionalEmail.mockReset().mockResolvedValue('sent')
		getEventByDetailsId.mockReset().mockResolvedValue({ title: 'Beach Party', date: '2026-11-20', time: '22:00' })
		jest.spyOn(console, 'error').mockImplementation(() => {})
		jest.spyOn(console, 'warn').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	// A real paid order with two tickets, through the real reserve → attach →
	// confirm path (SumUp mocked to report PAID).
	async function paidOrder(email = 'buyer@example.com') {
		const reserved = await reserveOrder(
			{ eventDetailsId: eventId, items: [{ tierKey: 'ga', quantity: 2 }], email, marketingOptIn: false },
			tiers,
		)
		if (reserved.status !== 'reserved') throw new Error(`Expected reserved, got ${reserved.status}`)
		const checkoutId = `checkout-${reserved.orderId}`
		await attachCheckoutSession(reserved.orderId, checkoutId)
		getCheckoutStatus.mockResolvedValueOnce('PAID')
		await confirmOrder({ id: reserved.orderId, providerSessionId: checkoutId })
		return reserved
	}

	async function confirmationSentAt(orderId: string) {
		const [row] = await db.sql<{ confirmation_sent_at: Date | null }[]>`select confirmation_sent_at from orders where id = ${orderId}`
		return row.confirmation_sent_at
	}

	it('emails the buyer one PNG QR per ticket, keyed by the order id, and records the send', async () => {
		const order = await paidOrder()

		expect(await sendOrderConfirmation(order.orderId)).toBe('sent')

		expect(sendTransactionalEmail).toHaveBeenCalledTimes(1)
		const email = sendTransactionalEmail.mock.calls[0][0]
		expect(email.to).toBe('buyer@example.com')
		expect(email.subject).toBe('Your tickets for Beach Party')
		expect(email.idempotencyKey).toBe(order.orderId)
		expect(email.html).toContain(`https://www.c58.uk/orders/${order.accessToken}`)

		const tickets = await db.sql<{ ticket_code: string }[]>`
			select tickets.ticket_code from tickets join order_items on order_items.id = tickets.order_item_id
			where order_items.order_id = ${order.orderId}
		`
		expect(email.attachments).toHaveLength(2)
		expect(email.attachments?.map((attachment) => attachment.name).sort()).toEqual(
			tickets.map((ticket) => `${ticket.ticket_code}.png`).sort(),
		)
		// Each attachment is the image rendered for the code in its own name
		for (const attachment of email.attachments ?? []) {
			expect(attachment.content.toString()).toBe(`png-for-${attachment.name.replace(/\.png$/, '')}`)
		}

		expect(await confirmationSentAt(order.orderId)).toBeInstanceOf(Date)
	})

	it('reads the event from Sanity as published, never drafts', async () => {
		const order = await paidOrder()

		await sendOrderConfirmation(order.orderId)

		expect(getEventByDetailsId).toHaveBeenCalledWith(eventId, { perspective: 'published', stega: false })
	})

	it('sends once however many times it is called', async () => {
		const order = await paidOrder()

		expect(await sendOrderConfirmation(order.orderId)).toBe('sent')
		expect(await sendOrderConfirmation(order.orderId)).toBe('skipped')

		expect(sendTransactionalEmail).toHaveBeenCalledTimes(1)
	})

	it('sends once when called concurrently — the webhook and order page racing', async () => {
		const order = await paidOrder()

		const outcomes = await Promise.all(Array.from({ length: 5 }, () => sendOrderConfirmation(order.orderId)))

		expect(sendTransactionalEmail).toHaveBeenCalledTimes(1)
		expect(outcomes.filter((outcome) => outcome === 'sent')).toHaveLength(1)
		expect(outcomes.filter((outcome) => outcome === 'skipped')).toHaveLength(4)
	})

	it('does nothing for an order that is not paid', async () => {
		const reserved = await reserveOrder(
			{ eventDetailsId: eventId, items: [{ tierKey: 'ga', quantity: 1 }], email: 'pending@example.com', marketingOptIn: false },
			tiers,
		)
		if (reserved.status !== 'reserved') throw new Error(`Expected reserved, got ${reserved.status}`)

		expect(await sendOrderConfirmation(reserved.orderId)).toBe('skipped')

		expect(sendTransactionalEmail).not.toHaveBeenCalled()
		expect(await confirmationSentAt(reserved.orderId)).toBeNull()
	})

	it('releases the claim when Brevo fails, so the next call retries — without throwing', async () => {
		const order = await paidOrder()
		sendTransactionalEmail.mockRejectedValueOnce(new Error('Brevo send failed: 500'))

		await expect(sendOrderConfirmation(order.orderId)).resolves.toBe('failed')
		expect(await confirmationSentAt(order.orderId)).toBeNull()
		// Logs are the only signal a confirmation failed — it must never be silent
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining(order.orderId), expect.any(Error))

		expect(await sendOrderConfirmation(order.orderId)).toBe('sent')
		expect(sendTransactionalEmail).toHaveBeenCalledTimes(2)
		expect(await confirmationSentAt(order.orderId)).toBeInstanceOf(Date)
	})

	it('keeps the claim when Brevo reports a duplicate — that email already went out', async () => {
		const order = await paidOrder()
		sendTransactionalEmail.mockResolvedValueOnce('duplicate')

		expect(await sendOrderConfirmation(order.orderId)).toBe('sent')

		expect(await confirmationSentAt(order.orderId)).toBeInstanceOf(Date)
		expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(order.orderId))
	})

	it('logs and keeps the claim for a paid order with no access token — nothing to link to, nothing to retry', async () => {
		const order = await paidOrder()
		await db.sql`update orders set access_token = null where id = ${order.orderId}`

		expect(await sendOrderConfirmation(order.orderId)).toBe('skipped')

		expect(sendTransactionalEmail).not.toHaveBeenCalled()
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining(order.orderId))
		expect(await confirmationSentAt(order.orderId)).toBeInstanceOf(Date)
	})

	it('still sends the tickets when the event has gone from Sanity', async () => {
		const order = await paidOrder()
		getEventByDetailsId.mockResolvedValueOnce(null)

		await sendOrderConfirmation(order.orderId)

		expect(sendTransactionalEmail.mock.calls[0][0].subject).toBe('Your C58 tickets')
		expect(sendTransactionalEmail.mock.calls[0][0].attachments).toHaveLength(2)
	})
})
