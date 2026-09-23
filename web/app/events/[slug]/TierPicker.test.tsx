import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TierPicker from './TierPicker'
import type { SanityTier } from '@/types/sanity'

jest.mock('./actions', () => ({
	createOrder: jest.fn(),
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

function mockFetchOnce(body: unknown, ok = true) {
	global.fetch = jest.fn().mockResolvedValue({
		ok,
		status: ok ? 200 : 500,
		json: async () => body,
	}) as jest.Mock
}

// All-zero counts == every tier fully available, matching the fixtures'
// Sanity capacities — used by every test that isn't specifically about
// live-stock capping itself.
const openStock = { [tiers[0]._key]: { sold: 0, pending: 0 }, [tiers[1]._key]: { sold: 0, pending: 0 } }

async function renderAndWaitForStock(props: { eventDetailsId?: string; tiers?: SanityTier[] } = {}) {
	const result = render(
		<TierPicker eventDetailsId={props.eventDetailsId ?? 'details-1'} tiers={props.tiers ?? tiers} />,
	)
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
		mockFetchOnce(openStock)
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		expect(screen.getByText('Checking availability…')).toBeInTheDocument()
	})

	it('disables quantity buttons while stock is still loading', () => {
		mockFetchOnce(openStock)
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
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
			[tiers[0]._key]: { sold: 2, pending: 0 }, // capacity 3, 1 remaining
			[tiers[1]._key]: { sold: 0, pending: 0 },
		})
		await renderAndWaitForStock()
		const increment = screen.getByLabelText('Increase quantity for General Admission')
		fireEvent.click(increment)
		expect(screen.getAllByText('1')[0]).toBeInTheDocument()
		expect(increment).toBeDisabled()
	})

	it('disables a previousSoldOut tier and explains why, while the previous tier still has stock', async () => {
		const gated: SanityTier[] = [
			tiers[0],
			{ _key: 'tier-3', name: 'Final Release', price: 40, capacity: 5, releaseTrigger: 'previousSoldOut' },
		]
		mockFetchOnce({ [tiers[0]._key]: { sold: 0, pending: 0 } })
		await renderAndWaitForStock({ tiers: gated })
		expect(screen.getByText('Opens once the previous tier sells out')).toBeInTheDocument()
		expect(screen.getByLabelText('Increase quantity for Final Release')).toBeDisabled()
	})

	it('opens a previousSoldOut tier once the previous tier is sold out', async () => {
		const gated: SanityTier[] = [
			tiers[0],
			{ _key: 'tier-3', name: 'Final Release', price: 40, capacity: 5, releaseTrigger: 'previousSoldOut' },
		]
		mockFetchOnce({ [tiers[0]._key]: { sold: 3, pending: 0 } }) // GA fully sold
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

	it('defaults the marketing opt-in checkbox to unchecked', async () => {
		mockFetchOnce(openStock)
		await renderAndWaitForStock()
		expect(screen.getByRole('checkbox')).not.toBeChecked()
	})
})
