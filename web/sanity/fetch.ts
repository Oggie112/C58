import { sanityFetch } from "./live"
import { SanityEvent, SanityPage, SanityPost, SanitySiteSettings, SanityTalent, SanityPartner } from "../types/sanity"
import { UPCOMING_EVENTS_QUERY, PAST_EVENTS_QUERY, NEAREST_EVENT_QUERY } from "./queries/events"
import { ALL_PAGE_SLUGS_QUERY, PAGE_BY_SLUG_QUERY } from "./queries/page-builder"
import { GET_SITE_SETTINGS } from "./queries/singleton"
import { ALL_POST_SLUGS_QUERY, ALL_POSTS_QUERY, POST_BY_SLUG_QUERY } from "./queries/posts"
import { ALL_TALENT_SLUGS_QUERY, ALL_TALENTS_QUERY, TALENT_BY_SLUG_QUERY } from "./queries/talents"
import { ALL_PARTNERS_QUERY } from "./queries/partners"

export async function getUpcomingEvents(): Promise<SanityEvent[]> {
	const today = new Date().toISOString().slice(0, 10)
	const { data } = await sanityFetch({ query: UPCOMING_EVENTS_QUERY, params: { today } })
	return data as SanityEvent[]
}

export async function getPastEvents(): Promise<SanityEvent[]> {
	const today = new Date().toISOString().slice(0, 10)
	const { data } = await sanityFetch({ query: PAST_EVENTS_QUERY, params: { today } })
	return data as SanityEvent[]
}

export async function getNearestEvent(): Promise<SanityEvent | null> {
	const today = new Date().toISOString().slice(0, 10)
	const { data } = await sanityFetch({ query: NEAREST_EVENT_QUERY, params: { today } })
	return data as SanityEvent | null
}

export async function getAllPageSlugs(options?: { perspective?: 'published' | 'drafts', stega?: boolean }): Promise<Array<{ slug: string }>> {
	const { data } = await sanityFetch({ query: ALL_PAGE_SLUGS_QUERY, perspective: options?.perspective, stega: options?.stega })
	return data as Array<{ slug: string }>
}

export async function getPageBySlug(slug: string, options?: { stega?: boolean }): Promise<SanityPage | null> {
	const { data } = await sanityFetch({ query: PAGE_BY_SLUG_QUERY, params: { slug }, stega: options?.stega })
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

export async function getAllPosts(): Promise<SanityPost[]> {
	const { data } = await sanityFetch({ query: ALL_POSTS_QUERY })
	return data as SanityPost[]
}

export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
	const { data } = await sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug } })
	return data as SanityPost | null
}

export async function getAllTalentSlugs(options?: { perspective?: 'published' | 'drafts', stega?: boolean }): Promise<Array<{ slug: string }>> {
	const { data } = await sanityFetch({ query: ALL_TALENT_SLUGS_QUERY, perspective: options?.perspective, stega: options?.stega })
	return data as Array<{ slug: string }>
}

export async function getAllTalents(): Promise<SanityTalent[]> {
	const { data } = await sanityFetch({ query: ALL_TALENTS_QUERY })
	return data as SanityTalent[]
}

export async function getTalentBySlug(slug: string): Promise<SanityTalent | null> {
	const { data } = await sanityFetch({ query: TALENT_BY_SLUG_QUERY, params: { slug } })
	return data as SanityTalent | null
}

export async function getAllPartners(): Promise<SanityPartner[]> {
	const { data } = await sanityFetch({ query: ALL_PARTNERS_QUERY })
	return data as SanityPartner[]
}
