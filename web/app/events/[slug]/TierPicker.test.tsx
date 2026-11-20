import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import TierPicker from './TierPicker'
import type { SanityTier, TicketingStatus } from '@/types/sanity'
import { londonDate } from '@/lib/dateFormat'

jest.mock('./actions', () => ({
	createOrder: jest.fn(),
}))
// jsdom never loads external scripts, and next/script caches what it has
// loaded across tests — so record its props instead, and let tests fire
// onReady/onError themselves
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

const tiers: SanityTier[] = [
	{
		_key: 'tier-1',
		name: 'General Admission',
		price: 15,
		capacity: 3,
		releaseTrigger: 'scheduled',
	},
	{
		_key: 'tier-2',
		name: 'VIP',
		price: 30,
		capacity: 100,
		releaseTrigger: 'scheduled',
	},
]

// Stock that never arrives — for tests of the loading state. A request that
// resolved after the test had finished would update state outside act().
function mockFetchPending() {
	global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock
}

function mockFetchOnce(body: unknown, ok = true) {
	global.fetch = jest.fn().mockResolvedValue({
		ok,
		status: ok ? 200 : 500,
		json: async () => body,
	}) as jest.Mock
}

// A tier's own capacity, unreserved — every mocked tier needs a real entry
// now: a missing one means "no synced row" (unavailable), not "assume
// Sanity's capacity" (see stock.ts).
const openStock = {
	[tiers[0]._key]: { capacity: tiers[0].capacity, reserved: 0 },
	[tiers[1]._key]: { capacity: tiers[1].capacity, reserved: 0 },
}

interface PickerProps {
	eventDetailsId?: string
	tiers?: SanityTier[]
	marketingOptInEnabled?: boolean
	ticketingStatus?: TicketingStatus
	eventDate?: string | null
}

// Defaults to an event comfortably on sale; tests override what they need
function renderPicker(props: PickerProps = {}) {
	return render(
		<TierPicker
			eventDetailsId={props.eventDetailsId ?? 'details-1'}
			tiers={props.tiers ?? tiers}
			marketingOptInEnabled={props.marketingOptInEnabled ?? false}
			ticketingStatus={props.ticketingStatus ?? 'on_sale'}
			eventDate={props.eventDate === undefined ? '2099-12-31' : props.eventDate}
		/>,
	)
}

async function renderAndWaitForStock(props: PickerProps = {}) {
	const result = renderPicker(props)
	await waitFor(() =>
		expect(screen.queryByText('Checking availability…')).not.toBeInTheDocument(),
	)
	return result
}

describe('TierPicker', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('shows a checking-availability state before stock has loaded', () => {
		mockFetchPending()
		renderPicker()
		expect(screen.getByText('Checking availability…')).toBeInTheDocument()
	})

	it('disables quantity buttons while stock is still loading', () => {
		mockFetchPending()
		renderPicker()
		expect(screen.getByLabelText('Increase quantity for General Admission')).toBeDisabled()
	})

	it('renders every tier name and price once stock has loaded', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		expect(screen.getByText('General Admission')).toBeInTheDocument()
		expect(screen.getByText('£15.00')).toBeInTheDocument()
		expect(screen.getByText('VIP')).toBeInTheDocument()
		expect(screen.getByText('£30.00')).toBeInTheDocument()
	})

	it('starts every tier at quantity 0', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		expect(screen.getAllByText('0')).toHaveLength(2)
	})

	it('increments quantity and updates the running total', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		expect(screen.getByTestId('order-total')).toHaveTextContent('£0.00')
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		expect(screen.getByTestId('order-total')).toHaveTextContent('£30.00')
	})

	it('sums quantities across multiple tiers in the running total', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission')) // +£15
		fireEvent.click(screen.getByLabelText('Increase quantity for VIP')) // +£30
		expect(screen.getByTestId('order-total')).toHaveTextContent('£45.00')
	})

	it('caps quantity at min(capacity, 10) — General Admission capacity is 3', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		const increment = screen.getByLabelText('Increase quantity for General Admission')
		fireEvent.click(increment)
		fireEvent.click(increment)
		fireEvent.click(increment)
		fireEvent.click(increment) // 4th click is a no-op, button disables at capacity
		expect(increment).toBeDisabled()
	})

	it('caps quantity at the per-order max of 10 even when capacity is higher', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		const increment = screen.getByLabelText('Increase quantity for VIP')
		for (let i = 0; i < 11; i++) fireEvent.click(increment)
		expect(increment).toBeDisabled()
	})

	it('caps quantity at live remaining stock even when capacity/order-max allow more', async () => {
		mockFetchOnce({
			[tiers[0]._key]: { capacity: 3, reserved: 2 }, // 1 remaining
			[tiers[1]._key]: { capacity: 100, reserved: 0 },
		})
		await renderAndWaitForStock()
		const increment = screen.getByLabelText('Increase quantity for General Admission')
		fireEvent.click(increment)
		expect(screen.getAllByText('1')[0]).toBeInTheDocument()
		expect(increment).toBeDisabled()
	})

	it('treats a tier with no synced availability row as unavailable, not fully open', async () => {
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({}), // no entry for tier-1 at all
		}) as jest.Mock
		await renderAndWaitForStock()
		expect(screen.getByLabelText('Increase quantity for General Admission')).toBeDisabled()
	})

	it('disables a previousSoldOut tier and explains why, while the previous tier still has stock', async () => {
		const gated: SanityTier[] = [
			tiers[0],
			{ _key: 'tier-3', name: 'Final Release', price: 40, capacity: 5, releaseTrigger: 'previousSoldOut' },
		]
		mockFetchOnce({
			[tiers[0]._key]: { capacity: 3, reserved: 0 },
			'tier-3': { capacity: 5, reserved: 0 },
		})
		await renderAndWaitForStock({ tiers: gated })
		expect(screen.getByText('Opens once the previous tier sells out')).toBeInTheDocument()
		expect(screen.getByLabelText('Increase quantity for Final Release')).toBeDisabled()
	})

	it('opens a previousSoldOut tier once the previous tier is sold out', async () => {
		const gated: SanityTier[] = [
			tiers[0],
			{ _key: 'tier-3', name: 'Final Release', price: 40, capacity: 5, releaseTrigger: 'previousSoldOut' },
		]
		mockFetchOnce({
			[tiers[0]._key]: { capacity: 3, reserved: 3 }, // GA fully reserved
			'tier-3': { capacity: 5, reserved: 0 },
		})
		await renderAndWaitForStock({ tiers: gated })
		expect(screen.queryByText('Opens once the previous tier sells out')).not.toBeInTheDocument()
		expect(screen.getByLabelText('Increase quantity for Final Release')).not.toBeDisabled()
	})

	it('falls back to the capacity/order-max cap if the stock fetch fails', async () => {
		global.fetch = jest.fn().mockRejectedValue(new Error('network error'))
		await renderAndWaitForStock()
		const increment = screen.getByLabelText('Increase quantity for General Admission')
		expect(increment).not.toBeDisabled()
		fireEvent.click(increment)
		fireEvent.click(increment)
		fireEvent.click(increment)
		expect(increment).toBeDisabled() // still capped at Sanity capacity (3)
	})

	it('keeps submit disabled with zero quantity, even with a valid email', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.com' } })
		expect(screen.getByRole('button', { name: /Get Tickets/ })).toBeDisabled()
	})

	it('keeps submit disabled with an invalid email, even with a quantity selected', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
		expect(screen.getByRole('button', { name: /Get Tickets/ })).toBeDisabled()
	})

	it('enables submit once a quantity is selected and the email is valid', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.com' } })
		expect(screen.getByRole('button', { name: /Get Tickets/ })).not.toBeDisabled()
	})

	it('hides the marketing opt-in checkbox while marketing is switched off', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock({ marketingOptInEnabled: false })
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
	})

	it('shows the opt-in checkbox, unticked, once marketing is switched on', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock({ marketingOptInEnabled: true })
		expect(screen.getByRole('checkbox')).not.toBeChecked()
	})

	it('explains when the security check cannot load, instead of leaving an empty space', async () => {
		// No NEXT_PUBLIC_TURNSTILE_SITE_KEY in the test environment — the
		// production misconfiguration this guards against
		const { createOrder } = await import('./actions')
		jest.mocked(createOrder).mockResolvedValue({ status: 'challenge_required' })
		mockFetchOnce(openStock)
		await renderAndWaitForStock()

		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.com' } })
		fireEvent.click(screen.getByRole('button', { name: /Get Tickets/ }))

		expect(await screen.findByRole('alert')).toHaveTextContent("couldn't load a quick security check")
	})
})

describe('TierPicker — Turnstile only when challenged (compliance C3)', () => {
	const originalSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

	beforeEach(() => {
		mockScript.mockClear()
		process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'test-site-key'
	})

	afterEach(() => {
		jest.restoreAllMocks()
		if (originalSiteKey === undefined) delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
		else process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = originalSiteKey
	})

	async function submitAndGetChallenged() {
		const { createOrder } = await import('./actions')
		jest.mocked(createOrder).mockResolvedValue({ status: 'challenge_required' })
		mockFetchOnce(openStock)
		await renderAndWaitForStock()

		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.com' } })
		fireEvent.click(screen.getByRole('button', { name: /Get Tickets/ }))
		await screen.findByText('Running a quick security check…')
	}

	function lastScriptProps(): MockScriptProps {
		return mockScript.mock.calls[mockScript.mock.calls.length - 1][0]
	}

	it("doesn't load Cloudflare's script for a visitor who's never challenged", async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		expect(mockScript).not.toHaveBeenCalled()
	})

	it('loads the script once a challenge is needed, with a holding line until it is ready', async () => {
		await submitAndGetChallenged()
		expect(lastScriptProps().src).toContain('challenges.cloudflare.com/turnstile')

		act(() => lastScriptProps().onReady?.())

		expect(screen.queryByText('Running a quick security check…')).not.toBeInTheDocument()
	})

	it('explains when the script itself fails to download', async () => {
		jest.spyOn(console, 'error').mockImplementation(() => {})
		await submitAndGetChallenged()

		act(() => lastScriptProps().onError?.())

		expect(screen.queryByText('Running a quick security check…')).not.toBeInTheDocument()
		expect(screen.getByRole('alert')).toHaveTextContent("couldn't load a quick security check")
	})
})

describe('TierPicker — sale state (8API.5)', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('labels an event on sale once stock has loaded', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		expect(screen.getByTestId('sale-status')).toHaveTextContent('On sale')
	})

	it("shows the editor's status before stock loads — what the server rendered", () => {
		mockFetchPending()
		renderPicker({ ticketingStatus: 'closed' })
		expect(screen.getByTestId('sale-status')).toHaveTextContent('Closed')
		expect(screen.getByText('Tickets for this event are no longer on sale.')).toBeInTheDocument()
	})

	it('switches to sold out once every tier reaches capacity, and hides the purchase form', async () => {
		mockFetchOnce({
			[tiers[0]._key]: { capacity: 3, reserved: 3 },
			[tiers[1]._key]: { capacity: 100, reserved: 100 },
		})
		await renderAndWaitForStock()

		expect(screen.getByTestId('sale-status')).toHaveTextContent('Sold out')
		expect(screen.getByText('This event has sold out.')).toBeInTheDocument()
		expect(screen.getAllByText('Sold out', { selector: 'li p' })).toHaveLength(2)
		expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /Get Tickets/ })).not.toBeInTheDocument()
	})

	it.each([
		['an editor closed it', { ticketingStatus: 'closed' as const }, 'Closed', 'Tickets for this event are no longer on sale.'],
		["it isn't on sale yet", { ticketingStatus: 'not_open' as const }, 'Not yet on sale', "Tickets for this event aren't on sale yet."],
		// Today, in UK time — online sales stop at 00:00 on the event date
		['it is the event day', { eventDate: londonDate(new Date()) }, 'Closed', 'Online sales have closed — tickets are available on the door.'],
		['the event has passed', { eventDate: '2020-01-01' }, 'Closed', 'Online sales have closed — tickets are available on the door.'],
	])('explains why and disables every tier when %s, despite open stock', async (_case, override, label, message) => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock(override)

		expect(screen.getByTestId('sale-status')).toHaveTextContent(label)
		expect(screen.getByText(message)).toBeInTheDocument()
		expect(screen.getByLabelText('Increase quantity for General Admission')).toBeDisabled()
		expect(screen.getByLabelText('Increase quantity for VIP')).toBeDisabled()
		expect(screen.queryByRole('button', { name: /Get Tickets/ })).not.toBeInTheDocument()
	})

	it("shows when a scheduled tier goes on sale, in UK time, and keeps it shut until then", async () => {
		const withFutureTier: SanityTier[] = [tiers[0], { ...tiers[1], saleStart: '2099-11-21T19:00:00Z' }]
		mockFetchOnce(openStock)
		await renderAndWaitForStock({ tiers: withFutureTier })

		expect(screen.getByText('On sale from 21 Nov, 7:00 pm')).toBeInTheDocument()
		expect(screen.getByLabelText('Increase quantity for VIP')).toBeDisabled()
		// The other tier is unaffected — the event as a whole is still on sale
		expect(screen.getByLabelText('Increase quantity for General Admission')).not.toBeDisabled()
		expect(screen.getByTestId('sale-status')).toHaveTextContent('On sale')
	})

	it('marks a tier past its sale end as ended', async () => {
		const withEndedTier: SanityTier[] = [tiers[0], { ...tiers[1], saleEnd: '2020-01-01T00:00:00Z' }]
		mockFetchOnce(openStock)
		await renderAndWaitForStock({ tiers: withEndedTier })

		expect(screen.getByText('Sale ended')).toBeInTheDocument()
		expect(screen.getByLabelText('Increase quantity for VIP')).toBeDisabled()
		expect(screen.getByTestId('sale-status')).toHaveTextContent('On sale')
	})

	it('closes the event once every tier is sold out or past its window', async () => {
		const allDone: SanityTier[] = [tiers[0], { ...tiers[1], saleEnd: '2020-01-01T00:00:00Z' }]
		mockFetchOnce({
			[tiers[0]._key]: { capacity: 3, reserved: 3 },
			[tiers[1]._key]: { capacity: 100, reserved: 0 },
		})
		await renderAndWaitForStock({ tiers: allDone })

		expect(screen.getByTestId('sale-status')).toHaveTextContent('Closed')
		expect(screen.getByText('Tickets for this event are no longer on sale.')).toBeInTheDocument()
	})
})
