import type { PageBuilderBlock } from '@/types/sanity'
import { pageHeadingBlockKey } from './pageHeading'

// Only the fields the rule reads; cast because full Sanity blocks carry far more
const hero = { _type: 'heroBlock', _key: 'hero' } as PageBuilderBlock
const image = { _type: 'imageBlock', _key: 'image' } as PageBuilderBlock
const eventList = { _type: 'eventListBlock', _key: 'events' } as PageBuilderBlock
const instagram = { _type: 'instagramBlock', _key: 'instagram' } as PageBuilderBlock
const contact = { _type: 'contactBlock', _key: 'contact', settings: { email: 'hi@c58.uk' } } as PageBuilderBlock

function richText(key: string, styles: string[]) {
	return {
		_type: 'richTextBlock',
		_key: key,
		body: styles.map((style, i) => ({ _type: 'block', _key: `${key}-${i}`, style, children: [] })),
	} as unknown as PageBuilderBlock
}

describe('pageHeadingBlockKey', () => {
	it("gives the first heading block the page's <h1>", () => {
		expect(pageHeadingBlockKey([eventList, instagram])).toBe('events')
	})

	it("skips blocks with no heading — the home page's hero, an image", () => {
		expect(pageHeadingBlockKey([hero, image, instagram])).toBe('instagram')
	})

	it("leaves the <h1> to an editor's Heading 1 in Rich Text — e.g. the home page intro", () => {
		expect(pageHeadingBlockKey([hero, richText('intro', ['h1', 'normal']), instagram])).toBeUndefined()
	})

	it("doesn't treat a Rich Text block's smaller headings as the page's <h1>", () => {
		expect(pageHeadingBlockKey([richText('about', ['h2', 'normal']), contact])).toBe('contact')
	})

	it.each([
		['a featured next event with no event to show', { _type: 'featuredUpdateBlock', _key: 'f', contentType: 'nextEvent', nextEvent: null }],
		['a featured post with no post', { _type: 'featuredUpdateBlock', _key: 'f', contentType: 'featuredPost' }],
		['a team with no members', { _type: 'teamBlock', _key: 'f', members: [] }],
		['volunteers with no one listed', { _type: 'volunteerBlock', _key: 'f' }],
		['a contact block with no settings', { _type: 'contactBlock', _key: 'f', settings: null }],
	])('passes over %s — it renders nothing, so its heading would be missing', (_case, emptyBlock) => {
		expect(pageHeadingBlockKey([emptyBlock as PageBuilderBlock, instagram])).toBe('instagram')
	})

	it("counts a featured block that has something to show", () => {
		const featured = { _type: 'featuredUpdateBlock', _key: 'next', contentType: 'nextEvent', nextEvent: { _id: 'e' } }
		expect(pageHeadingBlockKey([hero, featured as PageBuilderBlock, instagram])).toBe('next')
	})

	it('has no <h1> block for a page with no headings at all', () => {
		expect(pageHeadingBlockKey([hero, image])).toBeUndefined()
	})
})
