import { formatEventDate } from './dateFormat'

describe('formatEventDate', () => {
	it('formats a standard date to British locale', () => {
		expect(formatEventDate('2025-06-14')).toBe('14 June 2025')
	})

	it('formats a January date correctly', () => {
		expect(formatEventDate('2025-01-01')).toBe('1 January 2025')
	})

	it('formats a December date correctly', () => {
		expect(formatEventDate('2025-12-25')).toBe('25 December 2025')
	})

	it('does not shift the date due to UTC midnight offset', () => {
		// Without the T00:00:00 fix, dates at UTC midnight can shift by one day
		// in UK timezone. This test confirms the fix holds.
		expect(formatEventDate('2025-03-30')).toBe('30 March 2025')
	})

	it('handles the end of a month correctly', () => {
		expect(formatEventDate('2025-01-31')).toBe('31 January 2025')
	})
})
