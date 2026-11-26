import type { Metadata } from 'next'

// Link previews (WhatsApp, Instagram DMs, Facebook, iMessage…) come from
// Open Graph tags. A page's `openGraph` replaces the layout's entirely —
// Next merges metadata shallowly — so every page builds its own here, and
// none loses the site name, locale or the default image.

export const SITE_NAME = 'C58 — Courtyard 58'

// The C58 roundel on black, 1200×630 with padding, so platforms that crop
// to a square or a narrower strip keep the whole logo
const DEFAULT_SHARE_IMAGE = { url: '/share-image.png', width: 1200, height: 630, alt: 'C58' }

interface ShareMetadataInput {
	// Shown as the preview's headline. The browser tab title gets "| C58"
	// from the layout's template; Open Graph titles don't, hence `brand`.
	// Omitted by the layout: platforms then use the page's <title>.
	title?: string
	brand?: boolean
	description?: string
	// The page's own image (already sized 1200×630); otherwise the C58 logo
	imageUrl?: string
}

export function shareMetadata({ title, brand = true, description, imageUrl }: ShareMetadataInput = {}): Metadata['openGraph'] {
	return {
		type: 'website',
		locale: 'en_GB',
		siteName: SITE_NAME,
		...(title && { title: brand ? `${title} | C58` : title }),
		...(description && { description }),
		images: [imageUrl ? { url: imageUrl, width: 1200, height: 630 } : DEFAULT_SHARE_IMAGE],
	}
}
