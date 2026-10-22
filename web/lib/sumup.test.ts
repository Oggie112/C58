import { createCheckoutSession } from './sumup'

describe('createCheckoutSession', () => {
	const originalEnv = process.env
	const fetchMock = jest.fn()

	beforeEach(() => {
		process.env = {
			...originalEnv,
			SUMUP_API_KEY: 'test-key',
			SUMUP_MERCHANT_CODE: 'MTEST',
			NEXT_PUBLIC_SITE_URL: 'https://www.c58.uk',
		}
		fetchMock.mockReset().mockResolvedValue({
			ok: true,
			json: async () => ({ id: 'checkout-1', status: 'PENDING', hosted_checkout_url: 'https://checkout.sumup.com/pay/c-1' }),
		})
		global.fetch = fetchMock
	})

	afterAll(() => {
		process.env = originalEnv
	})

	it('sends the order page as redirect_url and the webhook as return_url', async () => {
		await createCheckoutSession('order-1', 2500, 'C58 order order-1', 'https://www.c58.uk/orders/abc')

		const body = JSON.parse(fetchMock.mock.calls[0][1].body)
		expect(body.redirect_url).toBe('https://www.c58.uk/orders/abc')
		expect(body.return_url).toBe('https://www.c58.uk/api/webhooks/sumup')
		expect(body.checkout_reference).toBe('order-1')
		expect(body.amount).toBe(25)
	})
})
