import { defineQuery } from 'next-sanity'

// Fetch all partners, ordered by orderRank.
export const ALL_PARTNERS_QUERY = defineQuery(/* groq */ `
	*[_type == "partner"] | order(orderRank) {
		_id,
		_type,
		name,
		logo,
		website,
		description
	}
`)
