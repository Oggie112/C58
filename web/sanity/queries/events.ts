import { defineQuery } from 'next-sanity'

// Fields every event card/teaser renders. Interpolated into PAGE_BY_SLUG_QUERY,
// which resolves events in four places (event list ×2, hero, featured update).
export const EVENT_CARD_FIELDS = /* groq */ `
	_id,
	_type,
	title,
	slug,
	date,
	time,
	location,
	cost,
	ticketUrl,
	image,
	description
`

// Fetch all upcoming events, ordered by date ascending.
export const UPCOMING_EVENTS_QUERY = defineQuery(/* groq */ `
    *[_type == "event" && date >= $today] | order(date asc) {
        _id,
        _type,
        title,
        slug,
        date,
        time,
        location,
        cost,
        ticketUrl,
        image,
        description
    }
    `)

// Fetch all past events, ordered by date descending.

export const PAST_EVENTS_QUERY = defineQuery(/* groq */ `
    *[_type == "event" && date < $today] | order(date desc) {
        _id,
        _type,
        title,
        slug,
        date,
        time,
        location,
        cost,
        ticketUrl,
        image,
        description
    }
    `)

// Fetch the single nearest upcoming event (for nextEventBlock).
export const NEAREST_EVENT_QUERY = defineQuery(/* groq */ `
    *[_type == "event" && date >= $today] | order(date asc)[0] {
        _id,
        _type,
        title,
        slug,
        date,
        time,
        location,
        cost,
        ticketUrl,
        image,
        description
    }`)