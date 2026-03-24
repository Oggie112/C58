import { defineQuery } from 'next-sanity'

// Fetch all published post slugs (used for generateStaticParams).
export const ALL_POST_SLUGS_QUERY = defineQuery(/* groq */ `
	*[_type == "post" && defined(slug.current)] {
		"slug": slug.current
	}
`)

// Fetch all posts, ordered by date descending.
export const ALL_POSTS_QUERY = defineQuery(/* groq */ `
	*[_type == "post"] | order(date desc) {
		_id,
		_type,
		title,
		slug,
		date,
		image,
		body
	}
`)

// Fetch a single post by slug.
export const POST_BY_SLUG_QUERY = defineQuery(/* groq */ `
	*[_type == "post" && slug.current == $slug][0] {
		_id,
		_type,
		title,
		slug,
		date,
		image,
		body
	}
`)
