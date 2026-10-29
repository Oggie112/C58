import { cookies, draftMode } from 'next/headers'
import { resolvePerspectiveFromCookies } from 'next-sanity/live'
import { getDynamicFetchOptions, getMetadataFetchOptions } from './fetchOptions'

jest.mock('next/headers', () => ({
	cookies: jest.fn(),
	draftMode: jest.fn(),
}))

jest.mock('next-sanity/live', () => ({
	resolvePerspectiveFromCookies: jest.fn(),
}))

const mockDraftMode = draftMode as jest.Mock
const mockCookies = cookies as jest.Mock
const mockResolvePerspective = resolvePerspectiveFromCookies as jest.Mock

beforeEach(() => {
	jest.resetAllMocks()
	mockCookies.mockResolvedValue({})
})

describe('getDynamicFetchOptions', () => {
	it('returns published without stega outside draft mode', async () => {
		mockDraftMode.mockResolvedValue({ isEnabled: false })

		expect(await getDynamicFetchOptions()).toEqual({ perspective: 'published', stega: false })
	})

	it('never reads cookies outside draft mode, so public pages stay prerenderable', async () => {
		mockDraftMode.mockResolvedValue({ isEnabled: false })

		await getDynamicFetchOptions()

		expect(mockCookies).not.toHaveBeenCalled()
		expect(mockResolvePerspective).not.toHaveBeenCalled()
	})

	it('uses the perspective from the cookie, with stega, in draft mode', async () => {
		mockDraftMode.mockResolvedValue({ isEnabled: true })
		mockResolvePerspective.mockResolvedValue(['rSpringSale', 'drafts'])

		expect(await getDynamicFetchOptions()).toEqual({ perspective: ['rSpringSale', 'drafts'], stega: true })
	})
})

describe('getMetadataFetchOptions', () => {
	it('keeps the draft perspective but drops stega', async () => {
		mockDraftMode.mockResolvedValue({ isEnabled: true })
		mockResolvePerspective.mockResolvedValue('drafts')

		expect(await getMetadataFetchOptions()).toEqual({ perspective: 'drafts', stega: false })
	})
})
