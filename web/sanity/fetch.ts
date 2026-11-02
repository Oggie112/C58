import { cacheLife } from "next/cache"
import { sanityFetch } from "./live"
import type { FetchOptions } from "./fetchOptions"
import { SanityEvent, SanityEventWithDetails, SanityEventDetails, SanityPage, SanityPost, SanitySiteSettings, SanityTalent } from "../types/sanity"
import { ALL_EVENT_SLUGS_QUERY, EVENT_BY_DETAILS_ID_QUERY, EVENT_BY_SLUG_QUERY, EVENT_DETAILS_BY_ID_QUERY } from "./queries/event-details"
import { ALL_PAGE_SLUGS_QUERY, PAGE_BY_SLUG_QUERY } from "./queries/page-builder"
import { GET_SITE_SETTINGS } from "./queries/singleton"
import { ALL_POST_SLUGS_QUERY, POST_BY_SLUG_QUERY } from "./queries/posts"
import { ALL_TALENT_SLUGS_QUERY, TALENT_BY_SLUG_QUERY } from "./queries/talents"

// Every wrapper takes FetchOptions explicitly — see sanity/fetchOptions.ts —
// and is a 'use cache' scope: sanityFetch tags and times the entry, and the
// arguments (slug, perspective, stega) form its cache key. Draft-mode
// requests bypass these caches entirely.

export async function getAllEventSlugs(options: FetchOptions): Promise<Array<{ slug: string }>> {
	'use cache'
	const { data } = await sanityFetch({ query: ALL_EVENT_SLUGS_QUERY, ...options })
	return data as Array<{ slug: string }>
}

export async function getEventBySlug(slug: string, options: FetchOptions): Promise<SanityEventWithDetails | null> {
	'use cache'
	const { data } = await sanityFetch({ query: EVENT_BY_SLUG_QUERY, params: { slug }, ...options })
	return data as SanityEventWithDetails | null
}

export async function getEventDetailsById(
	id: string,
	options: FetchOptions,
): Promise<Pick<SanityEventDetails, '_id' | 'tiers'> | null> {
	'use cache'
	const { data } = await sanityFetch({ query: EVENT_DETAILS_BY_ID_QUERY, params: { id }, ...options })
	return data as Pick<SanityEventDetails, '_id' | 'tiers'> | null
}

export async function getEventByDetailsId(
	eventDetailsId: string,
	options: FetchOptions,
): Promise<Pick<SanityEvent, 'title' | 'slug' | 'date' | 'time' | 'location'> | null> {
	'use cache'
	const { data } = await sanityFetch({ query: EVENT_BY_DETAILS_ID_QUERY, params: { id: eventDetailsId }, ...options })
	return data as Pick<SanityEvent, 'title' | 'slug' | 'date' | 'time' | 'location'> | null
}

export async function getAllPageSlugs(options: FetchOptions): Promise<Array<{ slug: string }>> {
	'use cache'
	const { data } = await sanityFetch({ query: ALL_PAGE_SLUGS_QUERY, ...options })
	return data as Array<{ slug: string }>
}

export async function getPageBySlug(slug: string, options: FetchOptions): Promise<SanityPage | null> {
	'use cache'
	// Upcoming/past event lists compare against today, so the entry must roll
	// over — shorter than sanityFetch's own long lifetime (the shortest wins).
	cacheLife('hours')
	const today = new Date().toISOString().slice(0, 10)
	const { data } = await sanityFetch({ query: PAGE_BY_SLUG_QUERY, params: { slug, today }, ...options })
	return data as SanityPage | null
}

export async function getSiteSettings(options: FetchOptions): Promise<SanitySiteSettings | null> {
	'use cache'
	const { data } = await sanityFetch({ query: GET_SITE_SETTINGS, ...options })
	return data as SanitySiteSettings | null
}

export async function getAllPostSlugs(options: FetchOptions): Promise<Array<{ slug: string }>> {
	'use cache'
	const { data } = await sanityFetch({ query: ALL_POST_SLUGS_QUERY, ...options })
	return data as Array<{ slug: string }>
}

export async function getPostBySlug(slug: string, options: FetchOptions): Promise<SanityPost | null> {
	'use cache'
	const { data } = await sanityFetch({ query: POST_BY_SLUG_QUERY, params: { slug }, ...options })
	return data as SanityPost | null
}

export async function getAllTalentSlugs(options: FetchOptions): Promise<Array<{ slug: string }>> {
	'use cache'
	const { data } = await sanityFetch({ query: ALL_TALENT_SLUGS_QUERY, ...options })
	return data as Array<{ slug: string }>
}

export async function getTalentBySlug(slug: string, options: FetchOptions): Promise<SanityTalent | null> {
	'use cache'
	const { data } = await sanityFetch({ query: TALENT_BY_SLUG_QUERY, params: { slug }, ...options })
	return data as SanityTalent | null
}
