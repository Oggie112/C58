// The site's own origin for absolute URLs (sitemap, structured data). Must be
// https://www.c58.uk in production — the apex redirects (see README).
export function siteUrl(): string {
	return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}
