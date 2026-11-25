import { eventJsonLd, londonDateTime, organizationJsonLd } from './structuredData'
import * as fixtures from '../tests/fixtures/structuredData'

jest.mock('next-sanity', () => ({
	// The real one is ESM-only under Jest; plain text from spans is all it does here
	toPlainText: (blocks: Array<{ children?: Array<{ text: string }> }>) =>
		blocks.map((block) => (block.children ?? []).map((child) => child.text).join('')).join('\n\n'),
}))

const IMAGE = 'https://cdn.sanity.io/images/example.png'

describe('londonDateTime', () => {
	it('gives a summer time its BST offset', () => {
		expect(londonDateTime('2026-08-30', '15:00')).toBe('2026-08-30T15:00:00+01:00')
	})

	it('gives a winter time its GMT offset', () => {
		expect(londonDateTime('2026-12-12', '21:30')).toBe('2026-12-12T21:30:00+00:00')
	})
})

describe('eventJsonLd', () => {
	const event = eventJsonLd(fixtures.ownTicketingEvent, fixtures.siteUrl, IMAGE)

	it('describes the event with a full UK start time when doors open is set', () => {
		expect(event).toMatchObject({
			'@context': 'https://schema.org',
			'@type': 'Event',
			name: 'Beach Party',
			startDate: '2026-08-30T15:00:00+01:00',
			url: 'https://www.c58.uk/events/beach-party',
			image: IMAGE,
			description: 'Sand, sun and sound systems.',
		})
	})

	it('falls back to the date alone without a doors time', () => {
		const dateOnly = eventJsonLd({ ...fixtures.ownTicketingEvent, doorsTime: undefined }, fixtures.siteUrl, IMAGE)
		expect(dateOnly.startDate).toBe('2026-08-30')
	})

	it("places it at the venue's own address, on one line", () => {
		expect(event.location).toEqual({
			'@type': 'Place',
			name: 'Citizen Hub',
			address: 'Ground Floor, 58, Market Square, St. Neots PE19 2TE',
		})
	})

	it("never assumes the business's address for an event without a venue address", () => {
		const noAddress = eventJsonLd({ ...fixtures.ownTicketingEvent, venueAddress: undefined }, fixtures.siteUrl, IMAGE)
		expect(noAddress.location).toEqual({ '@type': 'Place', name: 'Citizen Hub' })
	})

	it('offers each tier at its price in pounds, linking to the event page', () => {
		expect(event.offers).toEqual([
			{
				'@type': 'Offer',
				name: 'Early Bird',
				price: 8,
				priceCurrency: 'GBP',
				url: 'https://www.c58.uk/events/beach-party',
				availability: 'https://schema.org/InStock',
				validFrom: '2026-07-01T09:00:00Z',
			},
			{
				'@type': 'Offer',
				name: 'General Admission',
				price: 12.5,
				priceCurrency: 'GBP',
				url: 'https://www.c58.uk/events/beach-party',
				availability: 'https://schema.org/InStock',
			},
		])
	})

	it.each([
		['sold_out', 'https://schema.org/SoldOut'],
		['not_open', 'https://schema.org/PreSale'],
	] as const)("marks offers by the editor's status — %s", (ticketingStatus, availability) => {
		const withStatus = eventJsonLd(
			{ ...fixtures.ownTicketingEvent, eventDetails: { ...fixtures.ownTicketingEvent.eventDetails!, ticketingStatus } },
			fixtures.siteUrl,
			IMAGE,
		)
		expect((withStatus.offers as Array<{ availability: string }>).map((offer) => offer.availability)).toEqual([
			availability,
			availability,
		])
	})

	it('offers nothing once sales are closed', () => {
		const closed = eventJsonLd(
			{ ...fixtures.ownTicketingEvent, eventDetails: { ...fixtures.ownTicketingEvent.eventDetails!, ticketingStatus: 'closed' } },
			fixtures.siteUrl,
			IMAGE,
		)
		expect(closed).not.toHaveProperty('offers')
	})

	it('links to an outside ticket seller without inventing a price from free-text cost', () => {
		const outside = eventJsonLd(fixtures.outsideTicketingEvent, fixtures.siteUrl, null)
		expect(outside.offers).toEqual([{ '@type': 'Offer', url: 'https://www.skiddle.com/e/123' }])
		expect(outside).not.toHaveProperty('image')
		expect(outside).not.toHaveProperty('description')
	})

	it('names Courtyard 58 as the organiser', () => {
		expect(event.organizer).toEqual({
			'@type': 'Organization',
			name: 'Courtyard 58',
			alternateName: 'C58',
			url: 'https://www.c58.uk',
		})
	})
})

describe('organizationJsonLd', () => {
	it('ties the names, site, address and social profiles together as one organisation', () => {
		expect(organizationJsonLd(fixtures.siteUrl, fixtures.settings)).toEqual({
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'Courtyard 58',
			alternateName: 'C58',
			url: 'https://www.c58.uk',
			logo: 'https://www.c58.uk/icon.png',
			email: 'hello@c58.uk',
			address: 'Ground Floor, 58, Market Square, St. Neots PE19 2TE',
			sameAs: ['https://www.instagram.com/c58_stneots'],
		})
	})

	it('leaves out what Site Settings lacks', () => {
		expect(organizationJsonLd(fixtures.siteUrl, null)).toEqual({
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'Courtyard 58',
			alternateName: 'C58',
			url: 'https://www.c58.uk',
			logo: 'https://www.c58.uk/icon.png',
		})
	})
})
