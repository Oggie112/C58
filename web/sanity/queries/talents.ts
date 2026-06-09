import { defineQuery } from 'next-sanity'

// Fetch all published talent slugs (used for generateStaticParams).
export const ALL_TALENT_SLUGS_QUERY = defineQuery(/* groq */ `
	*[_type == "talent" && defined(slug.current)] {
		"slug": slug.current
	}
`)

// Fetch all talents, ordered by orderRank.
export const ALL_TALENTS_QUERY = defineQuery(/* groq */ `
	*[_type == "talent"] | order(orderRank) {
		_id,
		_type,
		name,
		slug,
		role,
		bio,
		photo,
		socialLinks[] { platform, url }
	}
`)

// Fetch a single talent by slug.
export const TALENT_BY_SLUG_QUERY = defineQuery(/* groq */ `
	*[_type == "talent" && slug.current == $slug][0] {
		_id,
		_type,
		name,
		slug,
		role,
		bio,
		photo,
		socialLinks[] { platform, url }
	}
`)
