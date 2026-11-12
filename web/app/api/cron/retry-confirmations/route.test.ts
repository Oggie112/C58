process.env.CRON_SECRET = 'cron-secret'

import { retryUnsentConfirmations } from '@/lib/retryUnsentConfirmations'
import { retryUnsyncedOptIns } from '@/lib/retryUnsyncedOptIns'
import { POST } from './route'

jest.mock('@/lib/retryUnsentConfirmations', () => ({
	retryUnsentConfirmations: jest.fn(),
}))
jest.mock('@/lib/retryUnsyncedOptIns', () => ({
	retryUnsyncedOptIns: jest.fn(),
}))

const CONFIRMATIONS = { found: 2, sent: 1, skipped: 0, failed: 1, stoppedEarly: false }
const MARKETING = { found: 1, synced: 1, skipped: 0, failed: 0, stoppedEarly: false }

function request(authorization?: string) {
	return new Request('http://localhost/api/cron/retry-confirmations', {
		method: 'POST',
		headers: authorization ? { authorization } : {},
	})
}

describe('retry-confirmations cron route', () => {
	beforeEach(() => {
		jest.mocked(retryUnsentConfirmations).mockReset().mockResolvedValue(CONFIRMATIONS)
		jest.mocked(retryUnsyncedOptIns).mockReset().mockResolvedValue(MARKETING)
		jest.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('runs both retries and returns both summaries for the right secret', async () => {
		const response = await POST(request('Bearer cron-secret'))

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ confirmations: CONFIRMATIONS, marketing: MARKETING })
		expect(retryUnsentConfirmations).toHaveBeenCalledTimes(1)
		expect(retryUnsyncedOptIns).toHaveBeenCalledTimes(1)
	})

	it.each([
		['no Authorization header', undefined],
		['a wrong secret', 'Bearer not-the-secret'],
		['the secret without the Bearer scheme', 'cron-secret'],
	])('rejects %s without running the retry', async (_case, authorization) => {
		const response = await POST(request(authorization))

		expect(response.status).toBe(401)
		expect(retryUnsentConfirmations).not.toHaveBeenCalled()
		expect(retryUnsyncedOptIns).not.toHaveBeenCalled()
	})

	it('fails closed when CRON_SECRET is not configured', async () => {
		const saved = process.env.CRON_SECRET
		delete process.env.CRON_SECRET
		try {
			const response = await POST(request('Bearer cron-secret'))
			expect(response.status).toBe(500)
			expect(retryUnsentConfirmations).not.toHaveBeenCalled()
			expect(retryUnsyncedOptIns).not.toHaveBeenCalled()
		} finally {
			process.env.CRON_SECRET = saved
		}
	})
})
