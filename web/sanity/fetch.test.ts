import { getUpcomingEvents, getPastEvents, getNearestEvent, getAllPageSlugs, getPageBySlug, getSiteSettings } from './fetch'
import { client } from './client'

jest.mock('./client', () => ({
	client: { fetch: jest.fn() },
}))

const mockFetch = client.fetch as jest.Mock

beforeEach(() => {
	mockFetch.mockReset()
})

describe('getUpcomingEvents', () => {
	it('returns an array of events', async () => {
		const mockEvents = [{ _id: '1', title: 'Test Event', date: '2025-06-01' }]
		mockFetch.mockResolvedValue(mockEvents)

		const result = await getUpcomingEvents()

		expect(result).toEqual(mockEvents)
		expect(mockFetch).toHaveBeenCalledTimes(1)
	})

	it('returns an empty array when no events exist', async () => {
		mockFetch.mockResolvedValue([])

		const result = await getUpcomingEvents()

		expect(result).toEqual([])
	})
})

describe('getPastEvents', () => {
	it('returns an array of past events', async () => {
		const mockEvents = [{ _id: '2', title: 'Past Event', date: '2024-01-01' }]
		mockFetch.mockResolvedValue(mockEvents)

		const result = await getPastEvents()

		expect(result).toEqual(mockEvents)
	})
})

describe('getNearestEvent', () => {
	it('returns a single event when one exists', async () => {
		const mockEvent = { _id: '3', title: 'Next Event', date: '2025-07-01' }
		mockFetch.mockResolvedValue(mockEvent)

		const result = await getNearestEvent()

		expect(result).toEqual(mockEvent)
	})

	it('returns null when no upcoming event exists', async () => {
		mockFetch.mockResolvedValue(null)

		const result = await getNearestEvent()

		expect(result).toBeNull()
	})
})

describe('getAllPageSlugs', () => {
	it('returns an array of slug objects', async () => {
		const mockSlugs = [{ slug: 'home' }, { slug: 'about' }]
		mockFetch.mockResolvedValue(mockSlugs)

		const result = await getAllPageSlugs()

		expect(result).toEqual(mockSlugs)
	})
})

describe('getPageBySlug', () => {
	it('returns a page when the slug matches', async () => {
		const mockPage = { _id: '4', title: 'About', slug: { current: 'about' } }
		mockFetch.mockResolvedValue(mockPage)

		const result = await getPageBySlug('about')

		expect(result).toEqual(mockPage)
		expect(mockFetch).toHaveBeenCalledWith(
			expect.anything(),
			{ slug: 'about' },
		)
	})

	it('returns null when no page matches the slug', async () => {
		mockFetch.mockResolvedValue(null)

		const result = await getPageBySlug('nonexistent')

		expect(result).toBeNull()
	})
})

describe('getSiteSettings', () => {
	it('returns site settings when the document exists', async () => {
		const mockSettings = {
			_id: 'singleton-siteSettings',
			_type: 'siteSettings',
			phone: '01234 567890',
			email: 'hello@c58.co.uk',
		}
		mockFetch.mockResolvedValue(mockSettings)

		const result = await getSiteSettings()

		expect(result).toEqual(mockSettings)
	})

	it('returns null when no settings document exists', async () => {
		mockFetch.mockResolvedValue(null)

		const result = await getSiteSettings()

		expect(result).toBeNull()
	})
})
