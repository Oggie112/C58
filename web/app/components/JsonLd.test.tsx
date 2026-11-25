import { render } from '@testing-library/react'
import JsonLd from './JsonLd'

describe('JsonLd', () => {
	it("can't be broken out of by content from Sanity — no '<' survives, and the JSON reads back the same", () => {
		const hostile = { '@type': 'Event', name: 'Party</script><script>alert(1)</script>' }
		const { container } = render(<JsonLd data={hostile} />)

		const script = container.querySelector('script[type="application/ld+json"]')!
		expect(script.innerHTML).not.toContain('<')
		expect(JSON.parse(script.innerHTML)).toEqual(hostile)
	})
})
