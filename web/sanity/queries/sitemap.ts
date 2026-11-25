import { defineQuery } from 'next-sanity'

// Every routable document for app/sitemap.ts: type, slug and last edit
// (Google uses lastmod). Separate from the slug queries, which feed
// generateStaticParams and must return params only. The home page is the
// page with slug "home", served at "/".
export const SITEMAP_QUERY = defineQuery(/* groq */ `
	*[_type in ["page", "event", "post", "talent"] && defined(slug.current)] {
		_type,
		"slug": slug.current,
		_updatedAt
	}
`)
