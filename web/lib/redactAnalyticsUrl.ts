// /orders/<token> URLs are secrets — the token *is* the buyer's tickets — so
// they must never reach Vercel Analytics / Speed Insights, where anyone with
// project access could read them. Collapses the token to the route pattern,
// keeping page-view counts for the order page. Pure, so it's shared by both
// libraries' beforeSend hooks and testable without either.
const ORDER_TOKEN_PATH = /\/orders\/[^/?#]+/

export function redactAnalyticsUrl(url: string): string {
	return url.replace(ORDER_TOKEN_PATH, '/orders/[token]')
}
