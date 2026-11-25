// Sanity addresses are multi-line text; these turn one into a single line
// ("Ground Floor, 58, Market Square, St. Neots PE19 2TE") and a Google Maps
// search link. A plain link sends Google nothing until it's followed.

export function singleLineAddress(address: string): string {
	return address
		.split(/\s*\n\s*/)
		.filter(Boolean)
		.join(', ')
}

export function googleMapsSearchUrl(address: string): string {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
