import { after } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { requestTicketResend } from '@/lib/requestTicketResend'
import { sendTicketResend } from '@/lib/sendTicketResend'
import { resendTickets } from './actions'

jest.mock('next/headers', () => ({
	headers: jest.fn(async () => new Headers({ 'x-vercel-forwarded-for': '203.0.113.7' })),
}))
// after() runs its callback once the response has gone; here it's captured
// so each test decides when (and whether) the lookup and sends happen
jest.mock('next/server', () => ({ after: jest.fn() }))
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: jest.fn() }))
jest.mock('@/lib/turnstile', () => ({ verifyTurnstileToken: jest.fn() }))
jest.mock('@/lib/requestTicketResend', () => ({ requestTicketResend: jest.fn() }))
jest.mock('@/lib/sendTicketResend', () => ({ sendTicketResend: jest.fn() }))

const IDLE = { status: 'idle' } as const

async function runAfterCallback() {
	const [callback] = jest.mocked(after).mock.calls[0] as [() => Promise<void>]
	await callback()
}

describe('resendTickets', () => {
	beforeEach(() => {
		jest.mocked(after).mockReset()
		jest.mocked(checkRateLimit).mockReset().mockResolvedValue({ limited: false })
		jest.mocked(verifyTurnstileToken).mockReset()
		jest.mocked(requestTicketResend).mockReset().mockResolvedValue(['order-1', 'order-2'])
		jest.mocked(sendTicketResend).mockReset().mockResolvedValue('sent')
		jest.spyOn(console, 'warn').mockImplementation(() => {})
		jest.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('rejects an invalid address without counting it or looking anything up', async () => {
		expect(await resendTickets(IDLE, { email: 'not-an-email' })).toEqual({
			status: 'invalid',
			message: 'Enter a valid email address',
		})
		expect(checkRateLimit).not.toHaveBeenCalled()
		expect(after).not.toHaveBeenCalled()
	})

	it('replies before looking anything up — the same reply whether or not the address has orders', async () => {
		const withOrders = await resendTickets(IDLE, { email: 'buyer@example.com' })
		jest.mocked(requestTicketResend).mockResolvedValue([])
		const withoutOrders = await resendTickets(IDLE, { email: 'nobody@example.com' })

		expect(withOrders.status).toBe('requested')
		expect(withOrders).toEqual(withoutOrders)
		expect(withOrders.message).toContain('If we have paid orders')
		// Nothing looked up yet: both lookups wait for after()
		expect(requestTicketResend).not.toHaveBeenCalled()
	})

	it('then queues the address and sends each queued order, one at a time', async () => {
		await resendTickets(IDLE, { email: 'buyer@example.com' })
		await runAfterCallback()

		expect(requestTicketResend).toHaveBeenCalledWith('buyer@example.com')
		expect(jest.mocked(sendTicketResend).mock.calls).toEqual([['order-1'], ['order-2']])
	})

	it('logs, without the address, and never throws when the lookup fails', async () => {
		jest.mocked(requestTicketResend).mockRejectedValue(new Error('database unavailable'))
		await resendTickets(IDLE, { email: 'buyer@example.com' })

		await expect(runAfterCallback()).resolves.toBeUndefined()
		expect(console.error).toHaveBeenCalledWith('Ticket resend request failed', expect.any(Error))
		expect(JSON.stringify(jest.mocked(console.error).mock.calls)).not.toContain('buyer@example.com')
	})

	it('asks for a challenge once the rate limit is reached, without looking anything up', async () => {
		jest.mocked(checkRateLimit).mockResolvedValue({ limited: true })

		expect(await resendTickets(IDLE, { email: 'buyer@example.com' })).toEqual({ status: 'challenge_required' })
		expect(after).not.toHaveBeenCalled()
	})

	it('asks again for a token Turnstile rejects, and goes ahead with one it accepts', async () => {
		jest.mocked(checkRateLimit).mockResolvedValue({ limited: true })
		jest.mocked(verifyTurnstileToken).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

		expect(await resendTickets(IDLE, { email: 'buyer@example.com', turnstileToken: 'bad' })).toEqual({
			status: 'challenge_required',
		})
		expect((await resendTickets(IDLE, { email: 'buyer@example.com', turnstileToken: 'good' })).status).toBe('requested')
		expect(verifyTurnstileToken).toHaveBeenLastCalledWith('good', '203.0.113.7')
		expect(after).toHaveBeenCalledTimes(1)
	})
})
