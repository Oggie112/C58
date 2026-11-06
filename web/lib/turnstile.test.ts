import { verifyTurnstileToken } from './turnstile'

describe('verifyTurnstileToken', () => {
	const originalEnv = process.env
	const fetchMock = jest.fn()

	beforeEach(() => {
		process.env = { ...originalEnv, TURNSTILE_SECRET_KEY: 'turnstile-secret' }
		fetchMock.mockReset()
		global.fetch = fetchMock
		jest.spyOn(console, 'warn').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	afterAll(() => {
		process.env = originalEnv
	})

	it('accepts a token Cloudflare verifies, without logging', async () => {
		fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })

		expect(await verifyTurnstileToken('token', '203.0.113.7')).toBe(true)
		expect(console.warn).not.toHaveBeenCalled()

		const body = JSON.parse(fetchMock.mock.calls[0][1].body)
		expect(body).toEqual({ secret: 'turnstile-secret', response: 'token', remoteip: '203.0.113.7' })
	})

	it("rejects a token Cloudflare rejects, logging Cloudflare's reason", async () => {
		fetchMock.mockResolvedValue({
			ok: true,
			json: async () => ({ success: false, 'error-codes': ['invalid-input-secret'] }),
		})

		expect(await verifyTurnstileToken('token', '203.0.113.7')).toBe(false)
		expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('invalid-input-secret'))
	})

	it('never logs the token or the IP address', async () => {
		fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: false, 'error-codes': ['timeout-or-duplicate'] }) })

		await verifyTurnstileToken('secret-token-value', '203.0.113.7')

		const logged = jest.mocked(console.warn).mock.calls.flat().join(' ')
		expect(logged).not.toContain('secret-token-value')
		expect(logged).not.toContain('203.0.113.7')
	})

	it('rejects and logs when Cloudflare is unreachable', async () => {
		fetchMock.mockResolvedValue({ ok: false, status: 503 })

		expect(await verifyTurnstileToken('token', '203.0.113.7')).toBe(false)
		expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('503'))
	})

	it('throws when the secret key is not configured', async () => {
		delete process.env.TURNSTILE_SECRET_KEY

		await expect(verifyTurnstileToken('token', '203.0.113.7')).rejects.toThrow('TURNSTILE_SECRET_KEY is not set')
		expect(fetchMock).not.toHaveBeenCalled()
	})
})
