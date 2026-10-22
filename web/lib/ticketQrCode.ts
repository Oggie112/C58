import QRCode from 'qrcode'

// Shared by the order page (SVG) and, from 8UI.1, the confirmation email
// (PNG). The QR encodes the bare ticket_code and nothing else — no URL, no
// order data — so it means nothing without the door scanner checking it
// against the tickets table, and validity is never decided client-side.
const QR_OPTIONS = {
	// M (~15% recoverable) tolerates a cracked screen or glare at the door
	// without making a 20-character code's QR dense.
	errorCorrectionLevel: 'M',
	// Quiet zone (in modules) — scanners need a light border around the code.
	margin: 2,
	// Always dark-on-light, whatever the page theme: plenty of scanners can't
	// read inverted codes.
	color: { dark: '#000000', light: '#ffffff' },
} as const

// An <img src> data URI rather than inline <svg>: no dangerouslySetInnerHTML,
// and on mobile the buyer can long-press to save the image.
export async function ticketQrSvgDataUri(ticketCode: string): Promise<string> {
	const svg = await QRCode.toString(ticketCode, { ...QR_OPTIONS, type: 'svg' })
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
