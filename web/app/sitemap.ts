import type { MetadataRoute } from 'next'
import { getSitemapDocuments, type SitemapDocument } from '@/sanity/fetch'
import { PUBLISHED_FETCH_OPTIONS } from '@/sanity/fetchOptions'

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
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
	const documents = await getSitemapDocuments(PUBLISHED_FETCH_OPTIONS)

	return documents.map((document) => ({
		url: `${siteUrl}${pathFor(document)}`,
		lastModified: document._updatedAt,
	}))
}
