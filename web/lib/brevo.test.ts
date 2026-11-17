import { addContactToList, sendTransactionalEmail, type TransactionalEmail } from './brevo'

const EMAIL: TransactionalEmail = {
	to: 'buyer@example.com',
	subject: 'Your tickets for Test Event',
	html: '<p>Hello</p>',
	text: 'Hello',
	attachments: [{ name: 'C58-ABC.png', content: Buffer.from('png-bytes') }],
	idempotencyKey: '7b1d6c2e-8f4a-4c3b-9a2d-1e5f6a7b8c9d',
	tags: ['order-confirmation'],
}

describe('sendTransactionalEmail', () => {
	const originalEnv = process.env
	const fetchMock = jest.fn()

	beforeEach(() => {
		process.env = {
			...originalEnv,
			BREVO_API_KEY: 'test-key',
			BREVO_SENDER_EMAIL: 'tickets@c58.uk',
			BREVO_SENDER_NAME: 'C58',
			BREVO_REPLY_TO_EMAIL: 'hello@example.com',
		}
		fetchMock.mockReset().mockResolvedValue({ ok: true, status: 201, text: async () => '{"messageId":"<1@relay>"}' })
		global.fetch = fetchMock
		jest.spyOn(console, 'warn').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	afterAll(() => {
		process.env = originalEnv
	})

	it('sends the email with sender, reply-to, base64 attachments and the idempotency key', async () => {
		expect(await sendTransactionalEmail(EMAIL)).toBe('sent')

		const [url, init] = fetchMock.mock.calls[0]
		expect(url).toBe('https://api.brevo.com/v3/smtp/email')
		expect(init.headers['api-key']).toBe('test-key')

		const body = JSON.parse(init.body)
		expect(body.sender).toEqual({ email: 'tickets@c58.uk', name: 'C58' })
		expect(body.to).toEqual([{ email: 'buyer@example.com' }])
		expect(body.replyTo).toEqual({ email: 'hello@example.com' })
		expect(body.attachment).toEqual([{ name: 'C58-ABC.png', content: Buffer.from('png-bytes').toString('base64') }])
		expect(body.headers).toEqual({ idempotencyKey: EMAIL.idempotencyKey })
		expect(body.tags).toEqual(['order-confirmation'])
	})

	it('omits replyTo and warns when BREVO_REPLY_TO_EMAIL is not set', async () => {
		delete process.env.BREVO_REPLY_TO_EMAIL

		await sendTransactionalEmail(EMAIL)

		expect(JSON.parse(fetchMock.mock.calls[0][1].body).replyTo).toBeUndefined()
		expect(console.warn).toHaveBeenCalled()
	})

	it("reports a repeated idempotency key as a duplicate, not a failure — the email already went out", async () => {
		fetchMock.mockResolvedValue({
			ok: false,
			status: 400,
			text: async () => '{"code":"duplicate_parameter","message":"duplicate idempotencyKey"}',
		})

		expect(await sendTransactionalEmail(EMAIL)).toBe('duplicate')
	})

	it('throws on any other failure', async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => '{"code":"unauthorized","message":"Key not found"}' })

		await expect(sendTransactionalEmail(EMAIL)).rejects.toThrow('Brevo send failed: 401')
	})

	it('throws before calling Brevo when the API key is missing', async () => {
		delete process.env.BREVO_API_KEY

		await expect(sendTransactionalEmail(EMAIL)).rejects.toThrow('BREVO_API_KEY is not set')
		expect(fetchMock).not.toHaveBeenCalled()
	})
})

describe('addContactToList', () => {
	const originalEnv = process.env
	const fetchMock = jest.fn()
	const CONTACT = {
		email: 'buyer@example.com',
		listId: 3,
		attributes: { OPT_IN_SOURCE: 'ticket purchase', OPT_IN_DATE: '2026-11-06' },
	}

	beforeEach(() => {
		process.env = { ...originalEnv, BREVO_API_KEY: 'test-key' }
		fetchMock.mockReset().mockResolvedValue({ ok: true, status: 201, text: async () => '{"id":21}' })
		global.fetch = fetchMock
	})

	afterAll(() => {
		process.env = originalEnv
	})

	it('creates or updates the contact on the list, with its attributes', async () => {
		await addContactToList(CONTACT)

		const [url, init] = fetchMock.mock.calls[0]
		expect(url).toBe('https://api.brevo.com/v3/contacts')
		expect(init.headers['api-key']).toBe('test-key')
		expect(JSON.parse(init.body)).toEqual({
			email: 'buyer@example.com',
			listIds: [3],
			// A returning buyer is an update, not a 4xx
			updateEnabled: true,
			attributes: { OPT_IN_SOURCE: 'ticket purchase', OPT_IN_DATE: '2026-11-06' },
		})
	})

	it("never touches the contact's unsubscribe status", async () => {
		await addContactToList(CONTACT)

		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('emailBlacklisted')
	})

	it('throws on failure', async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => '{"code":"invalid_parameter"}' })

		await expect(addContactToList(CONTACT)).rejects.toThrow('Brevo contact update failed: 400')
	})
})
