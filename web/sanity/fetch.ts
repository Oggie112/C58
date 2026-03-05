import { client } from "./client"
import { SanityEvent, SanityPage,  SanitySiteSettings} from "../types/sanity"
import { QueryParams } from "next-sanity"
import { UPCOMING_EVENTS_QUERY, PAST_EVENTS_QUERY, NEAREST_EVENT_QUERY} from "./queries/events"
import { ALL_PAGE_SLUGS_QUERY, PAGE_BY_SLUG_QUERY } from "./queries/page-builder"
import { GET_SITE_SETTINGS } from "./queries/singleton"

export async function getUpcomingEvents(): Promise<SanityEvent[]> {
    const events = await client.fetch<SanityEvent[]>(UPCOMING_EVENTS_QUERY)
    return events
}

export async function getPastEvents(): Promise<SanityEvent[]> {
    const events = await client.fetch<SanityEvent[]>(PAST_EVENTS_QUERY) 
    return events
}

export async function getNearestEvent(): Promise<SanityEvent | null> {
    const event = await client.fetch<SanityEvent | null>(NEAREST_EVENT_QUERY)
    return event 
}

export async function getAllPageSlugs(): Promise<Array<{ slug: string }>> {
    const slugs = await client.fetch<Array<{ slug: string}>>(ALL_PAGE_SLUGS_QUERY)
    return slugs
}

export async function getPageBySlug(slug: string): Promise<SanityPage | null> {
    const params: QueryParams = { slug}
    const page = await client.fetch<SanityPage | null>(PAGE_BY_SLUG_QUERY, params)
    return page
}

export async function getSiteSettings(): Promise<SanitySiteSettings | null> {
    const settings = await client.fetch<SanitySiteSettings | null>(GET_SITE_SETTINGS)
    return settings
}