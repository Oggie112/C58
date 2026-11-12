import { formatEventDate, londonDate } from './dateFormat'

describe('londonDate', () => {
	it('gives the UK date in summer, a day ahead of UTC just after midnight BST', () => {
		// 00:30 BST on 2 July is still 1 July in UTC
		expect(londonDate(new Date('2026-07-01T23:30:00Z'))).toBe('2026-07-02')
	})

	it('matches UTC in winter, when the UK is on GMT', () => {
		expect(londonDate(new Date('2026-12-01T23:30:00Z'))).toBe('2026-12-01')
	})

	it('follows the clock change — the last moment of BST and the first of GMT', () => {
		// 2026-10-25: clocks go back at 01:00 UTC
		expect(londonDate(new Date('2026-10-24T23:30:00Z'))).toBe('2026-10-25')
		expect(londonDate(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-25')
	})
})

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
