import { render, screen } from '@testing-library/react'
import PostCard from './PostCard'
import { SanityPost } from '@/types/sanity'

jest.mock('@/lib/dateFormat', () => ({
	formatEventDate: (date: string) => `Formatted: ${date}`,
}))

const basePost: SanityPost = {
	_id: 'post-1',
	_type: 'post',
	title: 'Test Post',
	slug: { current: 'test-post' },
	date: '2025-08-15',
}

describe('PostCard', () => {
	it('renders the post title', () => {
		render(<PostCard post={basePost} />)
		expect(screen.getByRole('heading', { name: 'Test Post' })).toBeInTheDocument()
	})

	it('renders the formatted date', () => {
		render(<PostCard post={basePost} />)
		expect(screen.getByText('Formatted: 2025-08-15')).toBeInTheDocument()
	})

	it('links to the correct post slug', () => {
		render(<PostCard post={basePost} />)
		expect(screen.getByRole('link')).toHaveAttribute('href', '/posts/test-post')
	})

	it('applies larger title class when featured', () => {
		const { container } = render(<PostCard post={basePost} featured />)
		expect(container.querySelector('h3')?.className).toContain('clamp(2.25rem')
	})

	it('applies smaller title class when not featured', () => {
		const { container } = render(<PostCard post={basePost} />)
		expect(container.querySelector('h3')?.className).toContain('clamp(1.5rem')
	})

	it('renders image with correct alt text when image provided', () => {
		const image = { _type: 'image' as const, asset: { _ref: 'ref-1', _type: 'reference' as const } }
		render(<PostCard post={{ ...basePost, image }} />)
		expect(screen.getByAltText('Image for Test Post')).toBeInTheDocument()
	})

	it('renders title as placeholder when no image', () => {
		render(<PostCard post={basePost} />)
		// Title appears in both the heading and the image placeholder span
		expect(screen.getAllByText('Test Post')).toHaveLength(2)
	})
})
