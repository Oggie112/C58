import {
	eventSaleState,
	onlineSalesClosedForEventDate,
	saleStatusLabel,
	saleUnavailableMessage,
	tierSaleState,
	tierWindow,
} from './saleState'
import * as fixtures from '../tests/fixtures/saleState'

describe('tierWindow', () => {
	it('is open between a scheduled tier’s start and end', () => {
		expect(tierWindow(fixtures.scheduledOpen, fixtures.now)).toBe('open')
	})

	it('is not started before a scheduled tier’s saleStart', () => {
		expect(tierWindow(fixtures.scheduledNotStarted, fixtures.now)).toBe('not_started')
	})

	it('has ended once saleEnd has passed', () => {
		expect(tierWindow(fixtures.scheduledEnded, fixtures.now)).toBe('ended')
	})

	it('ignores a stale saleStart on a previousSoldOut tier', () => {
		expect(tierWindow(fixtures.previousSoldOutWithStaleStart, fixtures.now)).toBe('open')
	})

	it('still applies saleEnd to a previousSoldOut tier', () => {
		const tier = { ...fixtures.previousSoldOutWithStaleStart, saleEnd: '2026-11-19T00:00:00Z' }
		expect(tierWindow(tier, fixtures.now)).toBe('ended')
	})

	it('treats the exact end instant as ended and the exact start instant as open', () => {
		expect(tierWindow({ ...fixtures.scheduledOpen, saleEnd: fixtures.now.toISOString() }, fixtures.now)).toBe('ended')
		expect(tierWindow({ ...fixtures.scheduledOpen, saleStart: fixtures.now.toISOString() }, fixtures.now)).toBe('open')
	})
})

describe('tierSaleState', () => {
	it('is on sale with stock inside its window', () => {
		expect(tierSaleState(fixtures.scheduledOpen, fixtures.available, fixtures.now)).toBe('on_sale')
	})

	it('is sold out with no stock left', () => {
		expect(tierSaleState(fixtures.scheduledOpen, fixtures.soldOut, fixtures.now)).toBe('sold_out')
	})

	it('awaits the previous tier when gated', () => {
		expect(tierSaleState(fixtures.previousSoldOutWithStaleStart, fixtures.gated, fixtures.now)).toBe('awaiting_previous')
	})

	it('reports its window before stock — an ended tier says "ended", not "sold out"', () => {
		expect(tierSaleState(fixtures.scheduledEnded, fixtures.soldOut, fixtures.now)).toBe('ended')
		expect(tierSaleState(fixtures.scheduledNotStarted, fixtures.available, fixtures.now)).toBe('not_started')
	})
})

describe('onlineSalesClosedForEventDate', () => {
	it('stays open until midnight UK time before the event date', () => {
		// 23:59 GMT on the 19th — the event is on the 20th
		expect(onlineSalesClosedForEventDate('2026-11-20', new Date('2026-11-19T23:59:00Z'))).toBe(false)
	})

	it('closes from 00:00 UK time on the event date', () => {
		expect(onlineSalesClosedForEventDate('2026-11-20', new Date('2026-11-20T00:00:00Z'))).toBe(true)
	})

	it('uses UK time in summer — closes at 23:00 UTC, which is midnight BST', () => {
		expect(onlineSalesClosedForEventDate('2026-07-15', new Date('2026-07-14T22:59:00Z'))).toBe(false)
		expect(onlineSalesClosedForEventDate('2026-07-15', new Date('2026-07-14T23:00:00Z'))).toBe(true)
	})

	it('stays closed after the event', () => {
		expect(onlineSalesClosedForEventDate('2026-11-10', fixtures.now)).toBe(true)
	})
})

describe('eventSaleState', () => {
	const base = {
		ticketingStatus: 'on_sale' as const,
		eventDate: '2026-11-28',
		tiers: [fixtures.scheduledOpen, fixtures.previousSoldOutWithStaleStart],
		now: fixtures.now,
	}

	it('is on sale with stock and the event still ahead', () => {
		const stock = { early: fixtures.available, second: fixtures.gated }
		expect(eventSaleState({ ...base, stock })).toEqual({ status: 'on_sale' })
	})

	it.each([
		['closed', { status: 'closed', reason: 'status' }],
		['not_open', { status: 'not_open' }],
		['sold_out', { status: 'sold_out' }],
	] as const)('lets an editor’s explicit "%s" win over plenty of stock', (ticketingStatus, expected) => {
		const stock = { early: fixtures.available, second: fixtures.gated }
		expect(eventSaleState({ ...base, ticketingStatus, stock })).toEqual(expected)
	})

	it('lets an explicit "closed" win over a computed sold out', () => {
		const stock = { early: fixtures.soldOut, second: fixtures.soldOut }
		expect(eventSaleState({ ...base, ticketingStatus: 'closed', stock })).toEqual({ status: 'closed', reason: 'status' })
	})

	it('closes online sales from the event date, even with stock', () => {
		const stock = { early: fixtures.available, second: fixtures.gated }
		expect(eventSaleState({ ...base, eventDate: '2026-11-20', stock })).toEqual({ status: 'closed', reason: 'event_day' })
	})

	it('is sold out when every tier has sold out — including the last release', () => {
		const stock = { early: fixtures.soldOut, second: fixtures.soldOut }
		expect(eventSaleState({ ...base, stock })).toEqual({ status: 'sold_out' })
	})

	it('stays on sale while a later release is still to open', () => {
		// First tier gone, second now open with stock
		const stock = { early: fixtures.soldOut, second: { remaining: 50, isOpen: true } }
		expect(eventSaleState({ ...base, stock })).toEqual({ status: 'on_sale' })
	})

	it('stays on sale while a tier is yet to start', () => {
		const stock = { early: fixtures.soldOut, later: fixtures.available }
		const tiers = [fixtures.scheduledOpen, fixtures.scheduledNotStarted]
		expect(eventSaleState({ ...base, tiers, stock })).toEqual({ status: 'on_sale' })
	})

	it('is closed when nothing is left to buy — the rest sold out or past their windows', () => {
		const stock = { early: fixtures.soldOut, ended: fixtures.available }
		const tiers = [fixtures.scheduledOpen, fixtures.scheduledEnded]
		expect(eventSaleState({ ...base, tiers, stock })).toEqual({ status: 'closed', reason: 'windows_ended' })
	})

	it('without stock (the server), leaves capacity to the reservation and reports on sale', () => {
		expect(eventSaleState(base)).toEqual({ status: 'on_sale' })
	})
})

describe('saleUnavailableMessage', () => {
	it.each([
		[{ status: 'sold_out' as const }, 'This event has sold out.'],
		[{ status: 'not_open' as const }, "Tickets for this event aren't on sale yet."],
		[{ status: 'closed' as const, reason: 'status' as const }, 'Tickets for this event are no longer on sale.'],
		[{ status: 'closed' as const, reason: 'windows_ended' as const }, 'Tickets for this event are no longer on sale.'],
		// Only the event-day close points to the door — the others may mean no event at all
		[{ status: 'closed' as const, reason: 'event_day' as const }, 'Online sales have closed — tickets are available on the door.'],
	])('explains %j to the buyer', (state, message) => {
		expect(saleUnavailableMessage(state)).toBe(message)
	})
})

describe('saleStatusLabel', () => {
	it.each([
		[{ status: 'on_sale' as const }, 'On sale'],
		[{ status: 'sold_out' as const }, 'Sold out'],
		[{ status: 'not_open' as const }, 'Not yet on sale'],
		[{ status: 'closed' as const, reason: 'event_day' as const }, 'Closed'],
	])('labels %j', (state, label) => {
		expect(saleStatusLabel(state)).toBe(label)
	})
})
