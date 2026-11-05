import { renderConfirmationEmail, ticketAttachmentName } from './confirmationEmail'
import * as fixtures from '../tests/fixtures/confirmationEmail'

describe('renderConfirmationEmail', () => {
	it('uses the event title in the subject', () => {
		const { subject } = renderConfirmationEmail({ order: fixtures.twoTicketOrder, event: fixtures.event, orderUrl: fixtures.orderUrl })

		expect(subject).toBe('Your tickets for Beach Party')
	})

	it('falls back to a generic subject when the event no longer exists', () => {
		const { subject, html, text } = renderConfirmationEmail({ order: fixtures.twoTicketOrder, event: null, orderUrl: fixtures.orderUrl })

		expect(subject).toBe('Your C58 tickets')
		// The tickets still go out — they're what matters
		expect(html).toContain('C58-9F2E61D0A7B3C415')
		expect(text).toContain('C58-9F2E61D0A7B3C415')
	})

	it('lists every ticket code with its tier and position, in both HTML and text', () => {
		const { html, text } = renderConfirmationEmail({ order: fixtures.twoTicketOrder, event: fixtures.event, orderUrl: fixtures.orderUrl })

		for (const ticket of fixtures.twoTicketOrder.tickets) {
			expect(html).toContain(ticket.code)
			expect(text).toContain(ticket.code)
		}
		expect(text).toContain('Early Bird · 1 of 2: C58-9F2E61D0A7B3C415')
		expect(text).toContain('General · 2 of 2: C58-03BC7E1F88A24D6E')
	})

	it('links to the order page and shows the event details and total', () => {
		const { html, text } = renderConfirmationEmail({ order: fixtures.twoTicketOrder, event: fixtures.event, orderUrl: fixtures.orderUrl })

		expect(html).toContain(`href="${fixtures.orderUrl}"`)
		expect(text).toContain(fixtures.orderUrl)
		expect(text).toContain('20 November 2026 · Doors 22:00 · Market Square, St Neots')
		expect(html).toContain('£35.00')
		expect(text).toContain('Total: £35.00')
	})

	it('uses singular wording for one ticket', () => {
		const { html } = renderConfirmationEmail({ order: fixtures.singleTicketOrder, event: fixtures.event, orderUrl: fixtures.orderUrl })

		expect(html).toContain('Your ticket is below')
	})

	it('escapes Sanity content in the HTML', () => {
		const { html } = renderConfirmationEmail({ order: fixtures.twoTicketOrder, event: fixtures.hostileEvent, orderUrl: fixtures.orderUrl })

		expect(html).not.toContain('<script>')
		expect(html).not.toContain('<img src=x')
		expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;Friends&quot;')
	})

	it('keeps a multi-line title on one line in the subject', () => {
		const { subject } = renderConfirmationEmail({ order: fixtures.twoTicketOrder, event: fixtures.hostileEvent, orderUrl: fixtures.orderUrl })

		expect(subject).not.toMatch(/[\r\n]/)
	})
})

describe('ticketAttachmentName', () => {
	it('names the attachment after the ticket code, matching what the email tells buyers', () => {
		expect(ticketAttachmentName('C58-9F2E61D0A7B3C415')).toBe('C58-9F2E61D0A7B3C415.png')
	})
})
