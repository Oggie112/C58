import { shareMetadata } from './shareMetadata'

const LOGO = { url: '/share-image.png', width: 1200, height: 630, alt: 'C58' }

describe('shareMetadata', () => {
	it('keeps the site name and locale on every page — a page openGraph replaces the layout one', () => {
		expect(shareMetadata({ title: 'About' })).toMatchObject({
			type: 'website',
			locale: 'en_GB',
			siteName: 'C58 — Courtyard 58',
		})
	})

	it('brands the preview title, as the tab title is', () => {
		expect(shareMetadata({ title: 'About' })?.title).toBe('About | C58')
	})

	it("leaves a title that already names C58 alone — the home page's", () => {
		expect(shareMetadata({ title: 'C58 - St Neots Events', brand: false })?.title).toBe('C58 - St Neots Events')
	})

	it("uses the page's own image, otherwise the C58 logo", () => {
		expect(shareMetadata({ title: 'Beach Party', imageUrl: 'https://cdn.sanity.io/x.jpg' })?.images).toEqual([
			{ url: 'https://cdn.sanity.io/x.jpg', width: 1200, height: 630 },
		])
		expect(shareMetadata({ title: 'About' })?.images).toEqual([LOGO])
	})

	it('gives the layout its defaults without a title — platforms then use the <title>', () => {
		const defaults = shareMetadata()
		expect(defaults).not.toHaveProperty('title')
		expect(defaults?.images).toEqual([LOGO])
	})
})
