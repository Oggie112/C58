process.env.CRON_SECRET = 'cron-secret'

import { retryUnsentConfirmations } from '@/lib/retryUnsentConfirmations'
import { retryUnsyncedOptIns } from '@/lib/retryUnsyncedOptIns'
import { retryRequestedResends } from '@/lib/retryRequestedResends'
import { POST } from './route'

jest.mock('@/lib/retryUnsentConfirmations', () => ({
	retryUnsentConfirmations: jest.fn(),
}))
jest.mock('@/lib/retryUnsyncedOptIns', () => ({
	retryUnsyncedOptIns: jest.fn(),
}))
jest.mock('@/lib/retryRequestedResends', () => ({
	retryRequestedResends: jest.fn(),
}))

const CONFIRMATIONS = { found: 2, sent: 1, skipped: 0, failed: 1, stoppedEarly: false }
const RESENDS = { found: 1, sent: 1, skipped: 0, failed: 0, stoppedEarly: false }
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
		jest.mocked(retryRequestedResends).mockReset().mockResolvedValue(RESENDS)
		jest.mocked(retryUnsyncedOptIns).mockReset().mockResolvedValue(MARKETING)
		jest.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('runs every retry and returns each summary for the right secret', async () => {
		const response = await POST(request('Bearer cron-secret'))

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ confirmations: CONFIRMATIONS, resends: RESENDS, marketing: MARKETING })
		expect(retryUnsentConfirmations).toHaveBeenCalledTimes(1)
		expect(retryRequestedResends).toHaveBeenCalledTimes(1)
		expect(retryUnsyncedOptIns).toHaveBeenCalledTimes(1)
	})

	it("retries first confirmations before resends — a new buyer's first email comes first when quota is tight", async () => {
		await POST(request('Bearer cron-secret'))

		const confirmationsOrder = jest.mocked(retryUnsentConfirmations).mock.invocationCallOrder[0]
		const resendsOrder = jest.mocked(retryRequestedResends).mock.invocationCallOrder[0]
		expect(confirmationsOrder).toBeLessThan(resendsOrder)
	})

	it.each([
		['no Authorization header', undefined],
		['a wrong secret', 'Bearer not-the-secret'],
		['the secret without the Bearer scheme', 'cron-secret'],
	])('rejects %s without running the retry', async (_case, authorization) => {
		const response = await POST(request(authorization))

		expect(response.status).toBe(401)
		expect(retryUnsentConfirmations).not.toHaveBeenCalled()
		expect(retryRequestedResends).not.toHaveBeenCalled()
		expect(retryUnsyncedOptIns).not.toHaveBeenCalled()
	})

	it('fails closed when CRON_SECRET is not configured', async () => {
		const saved = process.env.CRON_SECRET
		delete process.env.CRON_SECRET
		try {
			const response = await POST(request('Bearer cron-secret'))
			expect(response.status).toBe(500)
			expect(retryUnsentConfirmations).not.toHaveBeenCalled()
			expect(retryRequestedResends).not.toHaveBeenCalled()
			expect(retryUnsyncedOptIns).not.toHaveBeenCalled()
		} finally {
			process.env.CRON_SECRET = saved
		}
	})
})
