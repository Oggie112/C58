import { getAllPageSlugs, getPageBySlug, getSiteSettings, getPostBySlug } from './fetch'
import { cacheLife } from 'next/cache'
import { sanityFetch } from './live'

jest.mock('./live', () => ({
	sanityFetch: jest.fn(),
}))

// Outside a Next build 'use cache' is an inert string, but cacheLife() throws
// without the cacheComponents config — mock it (and assert on it below).
jest.mock('next/cache', () => ({
	cacheLife: jest.fn(),
}))

const mockSanityFetch = sanityFetch as jest.Mock

const PUBLISHED = { perspective: 'published', stega: false } as const
const DRAFTS = { perspective: 'drafts', stega: true } as const

beforeEach(() => {
	mockSanityFetch.mockReset()
})

describe('getAllPageSlugs', () => {
	it('returns an array of slug objects', async () => {
		const mockSlugs = [{ slug: 'home' }, { slug: 'about' }]
		mockSanityFetch.mockResolvedValue({ data: mockSlugs, sourceMap: null, tags: ['sanity'] })

		const result = await getAllPageSlugs(PUBLISHED)

		expect(result).toEqual(mockSlugs)
	})
})

describe('getPageBySlug', () => {
	it('returns a page when the slug matches', async () => {
		const mockPage = { _id: '4', title: 'About', slug: { current: 'about' } }
		mockSanityFetch.mockResolvedValue({ data: mockPage, sourceMap: null, tags: ['sanity'] })

		const result = await getPageBySlug('about', PUBLISHED)

		expect(result).toEqual(mockPage)
		expect(mockSanityFetch).toHaveBeenCalledWith(
			expect.objectContaining({ params: { slug: 'about', today: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) } }),
		)
	})

	it('caches for hours so the date-based event lists roll over', async () => {
		mockSanityFetch.mockResolvedValue({ data: null, sourceMap: null, tags: ['sanity'] })

		await getPageBySlug('events', PUBLISHED)

		expect(cacheLife).toHaveBeenCalledWith('hours')
	})

	it('passes the fetch options through to sanityFetch', async () => {
		mockSanityFetch.mockResolvedValue({ data: null, sourceMap: null, tags: ['sanity'] })

		await getPageBySlug('about', DRAFTS)

		expect(mockSanityFetch).toHaveBeenCalledWith(
			expect.objectContaining({ perspective: 'drafts', stega: true }),
		)
	})

	it('returns null when no page matches the slug', async () => {
		mockSanityFetch.mockResolvedValue({ data: null, sourceMap: null, tags: ['sanity'] })

		const result = await getPageBySlug('nonexistent', PUBLISHED)

		expect(result).toBeNull()
	})
})

describe('getPostBySlug', () => {
	it('returns a post when the slug matches', async () => {
		const mockPost = { _id: '2', title: 'Test Post', slug: { current: 'test-post' }, date: '2025-06-01' }
		mockSanityFetch.mockResolvedValue({ data: mockPost, sourceMap: null, tags: ['sanity'] })

		const result = await getPostBySlug('test-post', PUBLISHED)

		expect(result).toEqual(mockPost)
		expect(mockSanityFetch).toHaveBeenCalledWith(
			expect.objectContaining({ params: { slug: 'test-post' } }),
		)
	})

	it('returns null when no post matches the slug', async () => {
		mockSanityFetch.mockResolvedValue({ data: null, sourceMap: null, tags: ['sanity'] })

		const result = await getPostBySlug('nonexistent', PUBLISHED)

		expect(result).toBeNull()
	})
})

describe('getSiteSettings', () => {
	it('returns site settings when the document exists', async () => {
		const mockSettings = {
			_id: 'siteSettings',
			_type: 'siteSettings',
			phone: '01234 567890',
			email: 'hello@c58.co.uk',
		}
		mockSanityFetch.mockResolvedValue({ data: mockSettings, sourceMap: null, tags: ['sanity'] })

		const result = await getSiteSettings(PUBLISHED)

		expect(result).toEqual(mockSettings)
	})

	it('returns null when no settings document exists', async () => {
		mockSanityFetch.mockResolvedValue({ data: null, sourceMap: null, tags: ['sanity'] })

		const result = await getSiteSettings(PUBLISHED)

		expect(result).toBeNull()
	})
})
