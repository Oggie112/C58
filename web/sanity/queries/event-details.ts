import { defineQuery } from 'next-sanity'

// Fetch all published event slugs (used for generateStaticParams).
export const ALL_EVENT_SLUGS_QUERY = defineQuery(/* groq */ `
	*[_type == "event" && defined(slug.current)] {
		"slug": slug.current
	}
`)

// Fetch a single event by slug, with its eventDetails (tiers, line-up, FAQ)
// joined via the back-reference — eventDetails.event -> event, not the other
// way round, so this looks it up rather than dereferencing a forward ref.
export const EVENT_BY_SLUG_QUERY = defineQuery(/* groq */ `
	*[_type == "event" && slug.current == $slug][0] {
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
		description,
		"eventDetails": *[_type == "eventDetails" && references(^._id)][0] {
			_id,
			ticketingStatus,
			tiers[] {
				_key,
				name,
				price,
				capacity,
				releaseTrigger,
				saleStart,
				saleEnd,
				description
			},
			lineup[] {
				_key,
				entryType,
				"talent": talent-> {
					_id,
					name,
					slug,
					role,
					photo
				},
				guestName,
				guestRole,
				setTime
			},
			faq[] {
				_key,
				question,
				answer
			}
		}
	}
`)
