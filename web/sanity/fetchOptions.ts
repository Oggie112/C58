import { cookies, draftMode } from 'next/headers'
import { resolvePerspectiveFromCookies, type LivePerspective } from 'next-sanity/live'

// What every sanityFetch call needs to know about the request: which content
// to read (published, drafts, or a release) and whether to embed stega
// markup for Presentation's click-to-edit overlays. Passed explicitly rather
// than resolved inside sanityFetch, because cached code can't read cookies.
export interface FetchOptions {
	perspective: LivePerspective
	stega: boolean
}

// For anything that must never show unpublished content regardless of who's
// asking: static params, server actions, buyer-facing order pages.
export const PUBLISHED_FETCH_OPTIONS: FetchOptions = { perspective: 'published', stega: false }

// Resolves the options for the current request. Outside draft mode it never
// touches cookies, so public pages stay prerenderable.
export async function getDynamicFetchOptions(): Promise<FetchOptions> {
	const { isEnabled: isDraftMode } = await draftMode()
	if (!isDraftMode) return PUBLISHED_FETCH_OPTIONS

	const perspective = await resolvePerspectiveFromCookies({ cookies: await cookies() })
	return { perspective, stega: true }
}

// Metadata follows the previewed perspective but never carries stega — its
// invisible characters would end up in <title> and social share cards.
export async function getMetadataFetchOptions(): Promise<FetchOptions> {
	return { ...(await getDynamicFetchOptions()), stega: false }
}
