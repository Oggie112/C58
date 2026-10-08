import { generateTicketCode } from './generateTicketCode'

describe('generateTicketCode', () => {
	it('matches the C58-XXXXXXXX format', () => {
		expect(generateTicketCode()).toMatch(/^C58-[0-9A-F]{16}$/)
	})

	it('is not the same on consecutive calls', () => {
		expect(generateTicketCode()).not.toBe(generateTicketCode())
	})
})
