import { getUpcomingEvents, getPastEvents, getNearestEvent, getAllPageSlugs, getPageBySlug, getSiteSettings } from './fetch'
import { sanityFetch } from './live'

jest.mock('./live', () => ({
	sanityFetch: jest.fn(),
}))

const mockSanityFetch = sanityFetch as jest.Mock

beforeEach(() => {
	mockSanityFetch.mockReset()
})

describe('getUpcomingEvents', () => {
	it('returns an array of events', async () => {
		const mockEvents = [{ _id: '1', title: 'Test Event', date: '2025-06-01' }]
		mockSanityFetch.mockResolvedValue({ data: mockEvents, sourceMap: null, tags: ['sanity'] })

		const result = await getUpcomingEvents()

		expect(result).toEqual(mockEvents)
		expect(mockSanityFetch).toHaveBeenCalledTimes(1)
	})

	it('returns an empty array when no events exist', async () => {
		mockSanityFetch.mockResolvedValue({ data: [], sourceMap: null, tags: ['sanity'] })

		const result = await getUpcomingEvents()

		expect(result).toEqual([])
	})
})

describe('getPastEvents', () => {
	it('returns an array of past events', async () => {
		const mockEvents = [{ _id: '2', title: 'Past Event', date: '2024-01-01' }]
		mockSanityFetch.mockResolvedValue({ data: mockEvents, sourceMap: null, tags: ['sanity'] })

		const result = await getPastEvents()

		expect(result).toEqual(mockEvents)
	})
})

describe('getNearestEvent', () => {
	it('returns a single event when one exists', async () => {
		const mockEvent = { _id: '3', title: 'Next Event', date: '2025-07-01' }
		mockSanityFetch.mockResolvedValue({ data: mockEvent, sourceMap: null, tags: ['sanity'] })

		const result = await getNearestEvent()

		expect(result).toEqual(mockEvent)
	})

	it('returns null when no upcoming event exists', async () => {
		mockSanityFetch.mockResolvedValue({ data: null, sourceMap: null, tags: ['sanity'] })

		const result = await getNearestEvent()

		expect(result).toBeNull()
	})
})

describe('getAllPageSlugs', () => {
	it('returns an array of slug objects', async () => {
		const mockSlugs = [{ slug: 'home' }, { slug: 'about' }]
		mockSanityFetch.mockResolvedValue({ data: mockSlugs, sourceMap: null, tags: ['sanity'] })

		const result = await getAllPageSlugs()

		expect(result).toEqual(mockSlugs)
	})
})

describe('getPageBySlug', () => {
	it('returns a page when the slug matches', async () => {
		const mockPage = { _id: '4', title: 'About', slug: { current: 'about' } }
		mockSanityFetch.mockResolvedValue({ data: mockPage, sourceMap: null, tags: ['sanity'] })

		const result = await getPageBySlug('about')

		expect(result).toEqual(mockPage)
		expect(mockSanityFetch).toHaveBeenCalledWith(
			expect.objectContaining({ params: { slug: 'about' } }),
		)
	})

	it('returns null when no page matches the slug', async () => {
		mockSanityFetch.mockResolvedValue({ data: null, sourceMap: null, tags: ['sanity'] })

		const result = await getPageBySlug('nonexistent')

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

		const result = await getSiteSettings()

		expect(result).toEqual(mockSettings)
	})

	it('returns null when no settings document exists', async () => {
		mockSanityFetch.mockResolvedValue({ data: null, sourceMap: null, tags: ['sanity'] })

		const result = await getSiteSettings()

		expect(result).toBeNull()
	})
})
