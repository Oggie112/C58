import type { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { getSitemapDocuments, type SitemapDocument } from '@/sanity/fetch'
import { PUBLISHED_FETCH_OPTIONS } from '@/sanity/fetchOptions'
import { siteUrl } from '@/lib/siteUrl'

// Where each Sanity type is served. The "home" page is the site root.
function pathFor(document: SitemapDocument): string {
	switch (document._type) {
		case 'page':
			return document.slug === 'home' ? '' : `/${document.slug}`
		case 'event':
			return `/events/${document.slug}`
		case 'post':
			return `/posts/${document.slug}`
		case 'talent':
			return `/talents/${document.slug}`
	}
}

// Every published page, event, post and talent — so Google finds pages
// nothing links to yet (e.g. past events), and sees when each last changed.
// Published only: drafts and unpublished documents are never listed.
//
// Rendered per request. Cached, it never refreshed in production: neither
// publish-time revalidatePath (#66) nor a one-hour cacheLife (#67) replaced
// the copy built at deploy. Crawlers fetch it a few times a day, and the
// Sanity data inside is still cached for at most an hour.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	await connection()
	const origin = siteUrl()
	const documents = await getSitemapDocuments(PUBLISHED_FETCH_OPTIONS)

	return documents.map((document) => ({
		url: `${origin}${pathFor(document)}`,
		lastModified: document._updatedAt,
	}))
}
