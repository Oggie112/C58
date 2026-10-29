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
