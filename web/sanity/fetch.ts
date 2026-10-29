import { sanityFetch } from "./live"
import { SanityEvent, SanityEventWithDetails, SanityEventDetails, SanityPage, SanityPost, SanitySiteSettings, SanityTalent } from "../types/sanity"
import { ALL_EVENT_SLUGS_QUERY, EVENT_BY_DETAILS_ID_QUERY, EVENT_BY_SLUG_QUERY, EVENT_DETAILS_BY_ID_QUERY } from "./queries/event-details"
import { ALL_PAGE_SLUGS_QUERY, PAGE_BY_SLUG_QUERY } from "./queries/page-builder"
import { GET_SITE_SETTINGS } from "./queries/singleton"
import { ALL_POST_SLUGS_QUERY, POST_BY_SLUG_QUERY } from "./queries/posts"
import { ALL_TALENT_SLUGS_QUERY, TALENT_BY_SLUG_QUERY } from "./queries/talents"

export async function getAllEventSlugs(options?: { perspective?: 'published' | 'drafts', stega?: boolean }): Promise<Array<{ slug: string }>> {
	const { data } = await sanityFetch({ query: ALL_EVENT_SLUGS_QUERY, perspective: options?.perspective, stega: options?.stega })
	return data as Array<{ slug: string }>
}

export async function getEventBySlug(slug: string): Promise<SanityEventWithDetails | null> {
	const { data } = await sanityFetch({ query: EVENT_BY_SLUG_QUERY, params: { slug } })
	return data as SanityEventWithDetails | null
}

export async function getEventDetailsById(
	id: string,
): Promise<Pick<SanityEventDetails, '_id' | 'tiers'> | null> {
	const { data } = await sanityFetch({ query: EVENT_DETAILS_BY_ID_QUERY, params: { id } })
	return data as Pick<SanityEventDetails, '_id' | 'tiers'> | null
}

export async function getEventByDetailsId(
	eventDetailsId: string,
): Promise<Pick<SanityEvent, 'title' | 'slug' | 'date' | 'time' | 'location'> | null> {
	const { data } = await sanityFetch({ query: EVENT_BY_DETAILS_ID_QUERY, params: { id: eventDetailsId } })
	return data as Pick<SanityEvent, 'title' | 'slug' | 'date' | 'time' | 'location'> | null
}

export async function getAllPageSlugs(options?: { perspective?: 'published' | 'drafts', stega?: boolean }): Promise<Array<{ slug: string }>> {
	const { data } = await sanityFetch({ query: ALL_PAGE_SLUGS_QUERY, perspective: options?.perspective, stega: options?.stega })
	return data as Array<{ slug: string }>
}

export async function getPageBySlug(slug: string, options?: { stega?: boolean }): Promise<SanityPage | null> {
	const today = new Date().toISOString().slice(0, 10)
	const { data } = await sanityFetch({ query: PAGE_BY_SLUG_QUERY, params: { slug, today }, stega: options?.stega })
	return data as SanityPage | null
}

export async function getSiteSettings(): Promise<SanitySiteSettings | null> {
	const { data } = await sanityFetch({ query: GET_SITE_SETTINGS })
	return data as SanitySiteSettings | null
}

export async function getAllPostSlugs(options?: { perspective?: 'published' | 'drafts', stega?: boolean }): Promise<Array<{ slug: string }>> {
	const { data } = await sanityFetch({ query: ALL_POST_SLUGS_QUERY, perspective: options?.perspective, stega: options?.stega })
	return data as Array<{ slug: string }>
}

export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
	const { data } = await sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug } })
	return data as SanityPost | null
}

export async function getAllTalentSlugs(options?: { perspective?: 'published' | 'drafts', stega?: boolean }): Promise<Array<{ slug: string }>> {
	const { data } = await sanityFetch({ query: ALL_TALENT_SLUGS_QUERY, perspective: options?.perspective, stega: options?.stega })
	return data as Array<{ slug: string }>
}

export async function getTalentBySlug(slug: string): Promise<SanityTalent | null> {
	const { data } = await sanityFetch({ query: TALENT_BY_SLUG_QUERY, params: { slug } })
	return data as SanityTalent | null
}
