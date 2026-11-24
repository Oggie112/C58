import { act, render, screen } from '@testing-library/react'
import TurnstileChallenge from './TurnstileChallenge'

// jsdom never loads external scripts — record next/script's props so tests
// can fire onReady themselves (see TierPicker.test.tsx for the same mock)
interface MockScriptProps {
	src: string
	onReady?: () => void
	onError?: () => void
}
const mockScript = jest.fn<null, [MockScriptProps]>(() => null)
jest.mock('next/script', () => ({
	__esModule: true,
	default: (props: MockScriptProps) => mockScript(props),
}))

type RenderParams = { sitekey: string; callback: (token: string) => void }

describe('TurnstileChallenge', () => {
	const originalSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
	let renderWidget: jest.Mock<string, [HTMLElement, RenderParams]>
	let removeWidget: jest.Mock

	beforeEach(() => {
		mockScript.mockClear()
		process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key'
		renderWidget = jest.fn<string, [HTMLElement, RenderParams]>(() => 'widget-1')
		removeWidget = jest.fn()
		window.turnstile = { render: renderWidget, remove: removeWidget }
	})

	afterEach(() => {
		jest.restoreAllMocks()
		delete window.turnstile
		if (originalSiteKey === undefined) delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
		else process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalSiteKey
	})

	function scriptReady() {
		act(() => mockScript.mock.calls[mockScript.mock.calls.length - 1][0].onReady?.())
	}

	it('renders nothing, and loads nothing, until a challenge is needed', () => {
		const { container } = render(<TurnstileChallenge active={false} onSolved={jest.fn()} />)

		expect(container).toBeEmptyDOMElement()
		expect(mockScript).not.toHaveBeenCalled()
	})

	it('renders the widget with the site key once the script is ready', () => {
		render(<TurnstileChallenge active onSolved={jest.fn()} />)
		expect(renderWidget).not.toHaveBeenCalled()

		scriptReady()

		expect(renderWidget).toHaveBeenCalledTimes(1)
		const [element, params] = renderWidget.mock.calls[0]
		expect(element).toBeInstanceOf(HTMLDivElement)
		expect(params.sitekey).toBe('test-site-key')
	})

	it("passes the token to the latest onSolved — the form's current values, not those when the widget mounted", () => {
		const firstOnSolved = jest.fn()
		const latestOnSolved = jest.fn()
		const { rerender } = render(<TurnstileChallenge active onSolved={firstOnSolved} />)
		scriptReady()

		// The form re-renders (e.g. the buyer edits their email) while the
		// challenge is showing — the widget must not be rebuilt for it
		rerender(<TurnstileChallenge active onSolved={latestOnSolved} />)
		expect(renderWidget).toHaveBeenCalledTimes(1)

		act(() => renderWidget.mock.calls[0][1].callback('solved-token'))

		expect(latestOnSolved).toHaveBeenCalledWith('solved-token')
		expect(firstOnSolved).not.toHaveBeenCalled()
	})

	it('removes the widget once the challenge is over', () => {
		const { rerender } = render(<TurnstileChallenge active onSolved={jest.fn()} />)
		scriptReady()

		rerender(<TurnstileChallenge active={false} onSolved={jest.fn()} />)

		expect(removeWidget).toHaveBeenCalledWith('widget-1')
	})

	it('explains, rather than showing an empty space, when there is no site key', () => {
		jest.spyOn(console, 'error').mockImplementation(() => {})
		delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

		render(<TurnstileChallenge active onSolved={jest.fn()} />)

		expect(screen.getByRole('alert')).toHaveTextContent("couldn't load a quick security check")
		expect(screen.queryByText('Running a quick security check…')).not.toBeInTheDocument()
	})
})
