import { toPlainText } from 'next-sanity'
import type { SanityEventWithDetails, SanitySiteSettings, TicketingStatus } from '@/types/sanity'
import { singleLineAddress } from './address'

// schema.org JSON-LD (structured data) for search engines — invisible to
// visitors, and it must describe only what the page itself shows. Rendered by
// app/components/JsonLd.tsx. Check pages with Google's Rich Results Test.

export const ORGANIZATION_NAME = 'Courtyard 58'
export const ORGANIZATION_ALTERNATE_NAME = 'C58'

type JsonLdObject = Record<string, unknown>

// A UK wall-clock time on a date as an ISO 8601 instant with its offset —
// "+01:00" in summer (BST), "+00:00" in winter (GMT) — as Google wants.
// The offset is looked up for that day; an event starting inside the 1am
// clock-change hour itself could be an hour out, which is accepted.
export function londonDateTime(date: string, time: string): string {
	const roughInstant = new Date(`${date}T${time}:00Z`)
	const zoneName = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' })
		.formatToParts(roughInstant)
		.find((part) => part.type === 'timeZoneName')?.value
	// "GMT+01:00" in summer; plain "GMT" in winter
	const offset = zoneName && zoneName !== 'GMT' ? zoneName.replace('GMT', '') : '+00:00'
	return `${date}T${time}:00${offset}`
}

const AVAILABILITY: Record<Exclude<TicketingStatus, 'closed'>, string> = {
	on_sale: 'https://schema.org/InStock',
	sold_out: 'https://schema.org/SoldOut',
	not_open: 'https://schema.org/PreSale',
}

// Offers mirror what the page shows: our own tiers (prices in pounds, as in
// Sanity), or a link to an outside ticket seller. The page is cached, so
// availability follows the editor's status, not live stock — Google
// re-crawls, and checkout enforces the real rules. A closed sale offers nothing.
function offersFor(event: SanityEventWithDetails, eventUrl: string): JsonLdObject[] | undefined {
	const details = event.eventDetails
	if (details?.tiers?.length) {
		const status = details.ticketingStatus
		if (status === 'closed') return undefined
		return details.tiers.map((tier) => ({
			'@type': 'Offer',
			name: tier.name,
			price: tier.price,
			priceCurrency: 'GBP',
			url: eventUrl,
			availability: AVAILABILITY[status],
			...(tier.saleStart && { validFrom: tier.saleStart }),
		}))
	}
	if (event.ticketUrl) return [{ '@type': 'Offer', url: event.ticketUrl }]
	return undefined
}

export function organizationJsonLd(siteUrl: string, settings: SanitySiteSettings | null): JsonLdObject {
	const sameAs = (settings?.socialLinks ?? []).map((link) => link.url).filter(Boolean)
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: ORGANIZATION_NAME,
		alternateName: ORGANIZATION_ALTERNATE_NAME,
		url: siteUrl,
		logo: `${siteUrl}/icon.png`,
		...(settings?.email && { email: settings.email }),
		// Where the business is based — not necessarily where its events are
		...(settings?.address && { address: singleLineAddress(settings.address) }),
		...(sameAs.length > 0 && { sameAs }),
	}
}

export function eventJsonLd(event: SanityEventWithDetails, siteUrl: string, imageUrl: string | null): JsonLdObject {
	const eventUrl = `${siteUrl}/events/${event.slug.current}`
	const description = event.description ? toPlainText(event.description).trim() : ''
	const offers = offersFor(event, eventUrl)

	return {
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: event.title,
		// A full start when the doors time is set; otherwise just the date
		startDate: event.doorsTime ? londonDateTime(event.date, event.doorsTime) : event.date,
		eventStatus: 'https://schema.org/EventScheduled',
		eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
		location: {
			'@type': 'Place',
			name: event.location ?? ORGANIZATION_ALTERNATE_NAME,
			// The venue's own address — never assumed from the business's
			...(event.venueAddress && { address: singleLineAddress(event.venueAddress) }),
		},
		url: eventUrl,
		...(imageUrl && { image: imageUrl }),
		...(description && { description }),
		...(offers && { offers }),
		organizer: {
			'@type': 'Organization',
			name: ORGANIZATION_NAME,
			alternateName: ORGANIZATION_ALTERNATE_NAME,
			url: siteUrl,
		},
	}
}
