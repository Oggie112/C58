import QRCode from 'qrcode'
import { ticketQrSvgDataUri } from './ticketQrCode'

describe('ticketQrSvgDataUri', () => {
	const code = 'C58-9F2E61D0A7B3C415'

	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('encodes the bare ticket code and nothing else', async () => {
		const toString = jest.spyOn(QRCode, 'toString')

		await ticketQrSvgDataUri(code)

		// The door scanner validates server-side against tickets.ticket_code —
		// a URL or any order data in the QR would leak more than it needs to.
		expect(toString).toHaveBeenCalledTimes(1)
		expect(toString.mock.calls[0][0]).toBe(code)
	})

	it('uses error correction M and a dark-on-light code with a quiet zone', async () => {
		const toString = jest.spyOn(QRCode, 'toString')

		await ticketQrSvgDataUri(code)

		expect(toString.mock.calls[0][1]).toMatchObject({
			type: 'svg',
			errorCorrectionLevel: 'M',
			margin: 2,
			color: { dark: '#000000', light: '#ffffff' },
		})
	})

	it('returns a self-contained SVG data URI', async () => {
		const uri = await ticketQrSvgDataUri(code)

		expect(uri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
		const svg = decodeURIComponent(uri.slice(uri.indexOf(',') + 1))
		expect(svg).toMatch(/^<svg[\s\S]*<\/svg>\s*$/)
	})

	it('produces a different code for a different ticket', async () => {
		expect(await ticketQrSvgDataUri(code)).not.toBe(await ticketQrSvgDataUri('C58-03BC7E1F88A24D6E'))
	})
})
