import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { verifySanityWebhook } from '@/lib/verifySanityWebhook'

// Server-driven cache invalidation on publish. Configure in Sanity's project
// settings: trigger on create/update/delete of published documents (drafts
// excluded), signed with SANITY_REVALIDATE_SECRET. The payload is ignored —
// any published change revalidates the whole site.
//
// Why this exists: next-sanity v13's <SanityLive> no longer guarantees the
// public cache is refreshed on publish. In draft mode (Presentation) it only
// refreshes the editor's own preview, and outside it only browsers that
// happen to be connected mark tags stale. With nobody connected, published
// edits would never reach the cached site. This makes freshness independent
// of who's online. See docs/next-sanity-v13-migration.md.
//
// revalidatePath('/', 'layout') rather than per-document tags: at C58's size
// (~a dozen routes) one publish costing a re-render of each page on its next
// visit is negligible. From a Route Handler it only marks paths — rendering
// happens lazily per path on its next request, not as a burst here. If the
// site grows, swap in tag-precise invalidation (Sanity Function sync tags)
// without changing this endpoint's contract.
export async function POST(request: Request) {
	const verification = await verifySanityWebhook(request, 'SANITY_REVALIDATE_SECRET')
	if (!verification.ok) return verification.response

	revalidatePath('/', 'layout')

	// The document id is optional context for logs only — never trusted for
	// anything, and absent on some operations.
	console.log(
		`Sanity revalidate webhook: ${request.headers.get('sanity-operation') ?? 'change'} ` +
			`${request.headers.get('sanity-document-id') ?? '(unknown document)'} — revalidated all paths`,
	)

	return NextResponse.json({ revalidated: true })
}
