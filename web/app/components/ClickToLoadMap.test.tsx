import { fireEvent, render, screen } from '@testing-library/react'
import ClickToLoadMap from './ClickToLoadMap'

const address = '12 High Street\nSt Neots PE19 1AA'

describe('ClickToLoadMap (compliance C1)', () => {
	it('loads nothing from Google until the visitor asks — no iframe on first render', () => {
		const { container } = render(<ClickToLoadMap address={address} />)
		expect(container.querySelector('iframe')).toBeNull()
		expect(screen.getByText('Loads from Google Maps, which may set cookies.')).toBeInTheDocument()
	})

	it('embeds the map for the address once "Show map" is clicked', () => {
		render(<ClickToLoadMap address={address} />)
		fireEvent.click(screen.getByRole('button', { name: 'Show map' }))

		const map = screen.getByTitle('Map showing 12 High Street, St Neots PE19 1AA')
		expect(map).toHaveAttribute('src', `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`)
		expect(screen.queryByRole('button', { name: 'Show map' })).not.toBeInTheDocument()
	})

	it('offers a plain link to Google Maps in a new tab, without loading the embed', () => {
		render(<ClickToLoadMap address={address} />)
		const link = screen.getByRole('link', { name: /Open in Google Maps/ })

		expect(link).toHaveAttribute(
			'href',
			`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
		)
		expect(link).toHaveAttribute('target', '_blank')
		expect(link).toHaveAttribute('rel', 'noopener noreferrer')
	})
})
