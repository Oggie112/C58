import { render, screen } from '@testing-library/react'
import EventCard from './EventCard'
import { SanityEvent } from '@/types/sanity'

jest.mock('@/lib/dateFormat', () => ({
	formatEventDate: (date: string) => `Formatted: ${date}`,
}))

const baseEvent: SanityEvent = {
	_id: 'event-1',
	_type: 'event',
	title: 'Test Event',
	slug: { current: 'test-event' },
	date: '2025-09-01',
}

describe('EventCard', () => {
    	it('renders the event title', () => {
		render(<EventCard event={baseEvent} />)
		expect(screen.getByRole('heading', { name: 'Test Event' })).toBeInTheDocument()
	})

	it('renders the formatted date', () => {
		render(<EventCard event={baseEvent} />)
		expect(screen.getByText('Formatted: 2025-09-01')).toBeInTheDocument()
	})

	it('renders location when provided', () => {
		render(<EventCard event={{ ...baseEvent, location: 'Manchester' }} />)
		expect(screen.getByText('Manchester')).toBeInTheDocument()
	})

	it('renders cost when provided', () => {
		render(<EventCard event={{ ...baseEvent, cost: '£15' }} />)
		expect(screen.getByText('£15')).toBeInTheDocument()
	})

	it('falls back to TICKETS → when no cost', () => {
		render(<EventCard event={baseEvent} />)
		expect(screen.getByText('TICKETS →')).toBeInTheDocument()
	})

	it('shows PAST label when past=true', () => {
		render(<EventCard event={baseEvent} past />)
		expect(screen.getByText('PAST')).toBeInTheDocument()
	})

	it('hides PAST label by default', () => {
		render(<EventCard event={baseEvent} />)
		expect(screen.queryByText('PAST')).not.toBeInTheDocument()
	})

	it('renders DOORS time when provided', () => {
		render(<EventCard event={{ ...baseEvent, time: '8PM' }} />)
		expect(screen.getByText('DOORS 8PM')).toBeInTheDocument()
	})

	it('applies glow animation when featured and not past', () => {
		const { container } = render(<EventCard event={baseEvent} featured />)
		expect(container.firstChild).toHaveClass('animate-[glowPulse_3s_ease-in-out_infinite]')
	})

	it('does not apply glow animation when featured and past', () => {
		const { container } = render(<EventCard event={baseEvent} featured past />)
		expect(container.firstChild).not.toHaveClass('animate-[glowPulse_3s_ease-in-out_infinite]')
	})

	it('renders image with correct alt text when image provided', () => {
		const image = { _type: 'image' as const, asset: { _ref: 'ref-1', _type: 'reference' as const } }
		render(<EventCard event={{ ...baseEvent, image }} />)
		expect(screen.getByAltText('Event image for Test Event')).toBeInTheDocument()
	})

	it('renders title as placeholder when no image', () => {
		render(<EventCard event={baseEvent} />)
		// Title appears in both the heading and as the image placeholder span
		expect(screen.getAllByText('Test Event')).toHaveLength(2)
	})
})