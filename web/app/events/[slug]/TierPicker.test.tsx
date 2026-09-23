import { render, screen, fireEvent } from '@testing-library/react'
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

describe('TierPicker', () => {
	it('renders every tier name and price', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		expect(screen.getByText('General Admission')).toBeInTheDocument()
		expect(screen.getByText('£15.00')).toBeInTheDocument()
		expect(screen.getByText('VIP')).toBeInTheDocument()
		expect(screen.getByText('£30.00')).toBeInTheDocument()
	})

	it('starts every tier at quantity 0', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		const quantities = screen.getAllByText('0')
		expect(quantities).toHaveLength(2)
	})

	it('increments quantity and updates the running total', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		expect(screen.getByTestId('order-total')).toHaveTextContent('£0.00')
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		expect(screen.getByTestId('order-total')).toHaveTextContent('£30.00')
	})

	it('sums quantities across multiple tiers in the running total', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission')) // +£15
		fireEvent.click(screen.getByLabelText('Increase quantity for VIP')) // +£30
		expect(screen.getByTestId('order-total')).toHaveTextContent('£45.00')
	})

	it('caps quantity at min(capacity, 10) — General Admission capacity is 3', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		const increment = screen.getByLabelText('Increase quantity for General Admission')
		fireEvent.click(increment)
		fireEvent.click(increment)
		fireEvent.click(increment)
		fireEvent.click(increment) // 4th click should be a no-op, button disables at capacity
		expect(increment).toBeDisabled()
	})

	it('caps quantity at the per-order max of 10 even when capacity is higher', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		const increment = screen.getByLabelText('Increase quantity for VIP')
		for (let i = 0; i < 11; i++) fireEvent.click(increment)
		expect(increment).toBeDisabled()
	})

	it('keeps submit disabled with zero quantity, even with a valid email', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.com' } })
		expect(screen.getByRole('button', { name: /Get Tickets/ })).toBeDisabled()
	})

	it('keeps submit disabled with an invalid email, even with a quantity selected', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-email' } })
		expect(screen.getByRole('button', { name: /Get Tickets/ })).toBeDisabled()
	})

	it('enables submit once a quantity is selected and the email is valid', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		fireEvent.click(screen.getByLabelText('Increase quantity for General Admission'))
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'buyer@example.com' } })
		expect(screen.getByRole('button', { name: /Get Tickets/ })).not.toBeDisabled()
	})

	it('defaults the marketing opt-in checkbox to unchecked', () => {
		render(<TierPicker eventDetailsId="details-1" tiers={tiers} />)
		expect(screen.getByRole('checkbox')).not.toBeChecked()
	})
})
