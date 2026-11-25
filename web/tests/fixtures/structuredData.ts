import type { SanityEventWithDetails, SanitySiteSettings } from '@/types/sanity'

export const siteUrl = 'https://www.c58.uk'

// A summer event on our own ticketing, at the Citizen Hub
export const ownTicketingEvent: SanityEventWithDetails = {
	_id: 'event-beach-party',
	_type: 'event',
	title: 'Beach Party',
	slug: { current: 'beach-party' },
	date: '2026-08-30',
	time: '3-Late',
	doorsTime: '15:00',
	location: 'Citizen Hub',
	venueAddress: 'Ground Floor, 58\nMarket Square\nSt. Neots PE19 2TE',
	description: [
		{
			_type: 'block',
			_key: 'p1',
			style: 'normal',
			markDefs: [],
			children: [{ _type: 'span', _key: 's1', text: 'Sand, sun and sound systems.', marks: [] }],
		},
	],
	eventDetails: {
		_id: 'details-beach-party',
		ticketingStatus: 'on_sale',
		tiers: [
			{ _key: 'early', name: 'Early Bird', price: 8, capacity: 50, releaseTrigger: 'scheduled', saleStart: '2026-07-01T09:00:00Z' },
			{ _key: 'ga', name: 'General Admission', price: 12.5, capacity: 150, releaseTrigger: 'previousSoldOut' },
		],
	},
}

// Tickets sold elsewhere (Skiddle): a link, and a cost only as free text
export const outsideTicketingEvent: SanityEventWithDetails = {
	_id: 'event-open-decks',
	_type: 'event',
	title: 'Open Decks',
	slug: { current: 'open-decks' },
	date: '2026-01-16',
	location: 'Citizen Hub',
	cost: '£10',
	ticketUrl: 'https://www.skiddle.com/e/123',
}

export const settings: SanitySiteSettings = {
	_id: 'siteSettings',
	_type: 'siteSettings',
	email: 'hello@c58.uk',
	address: 'Ground Floor, 58\nMarket Square\nSt. Neots PE19 2TE',
	socialLinks: [{ platform: 'Instagram', url: 'https://www.instagram.com/c58_stneots' }],
}
