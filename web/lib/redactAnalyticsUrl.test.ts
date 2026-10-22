import { redactAnalyticsUrl } from './redactAnalyticsUrl'

describe('redactAnalyticsUrl', () => {
	const token = 'q8Xb2mN0vR4tY7wZ1aC3eG5iK9oP6sU8xD0fH2jL4nQ'

	it('replaces the order token in a full URL', () => {
		expect(redactAnalyticsUrl(`https://www.c58.uk/orders/${token}`)).toBe('https://www.c58.uk/orders/[token]')
	})

	it('keeps any query string or fragment after the token', () => {
		expect(redactAnalyticsUrl(`https://www.c58.uk/orders/${token}?utm=email#tickets`)).toBe(
			'https://www.c58.uk/orders/[token]?utm=email#tickets',
		)
	})

	it('leaves URLs without an order token untouched', () => {
		expect(redactAnalyticsUrl('https://www.c58.uk/events/open-decks')).toBe('https://www.c58.uk/events/open-decks')
		expect(redactAnalyticsUrl('https://www.c58.uk/orders')).toBe('https://www.c58.uk/orders')
	})
})
