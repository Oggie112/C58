import type { PageBuilderBlock } from '@/types/sanity'

export type HeadingLevel = 'h1' | 'h2'

// Whether a block actually renders its heading. Every heading block falls
// back to a default heading, but these render nothing at all when empty —
// the page's <h1> mustn't land on a block that isn't there.
function rendersHeading(block: PageBuilderBlock): boolean {
	switch (block._type) {
		case 'eventListBlock':
		case 'partnersBlock':
		case 'talentListBlock':
		case 'blogListBlock':
		case 'instagramBlock':
			return true
		case 'featuredUpdateBlock':
			return block.contentType === 'nextEvent' ? Boolean(block.nextEvent) : Boolean(block.post)
		case 'teamBlock':
			return Boolean(block.members?.length)
		case 'volunteerBlock':
			return Boolean(block.volunteers?.length)
		case 'contactBlock':
			return Boolean(block.settings)
		default:
			// heroBlock, imageBlock: no heading. richTextBlock: headings are
			// the editor's own choice of style (see below).
			return false
	}
}

function hasRichTextH1(block: PageBuilderBlock): boolean {
	return block._type === 'richTextBlock' && Boolean(block.body?.some((part) => part.style === 'h1'))
}

// Which block's heading is the page's one <h1> — for search engines and
// screen readers alike. An editor's Heading 1 in a Rich Text block wins
// (e.g. the home page's intro); otherwise the first block that renders a
// heading. Undefined means the page's <h1> comes from Rich Text, or there's
// no heading at all; every other block heading is an <h2>.
export function pageHeadingBlockKey(blocks: PageBuilderBlock[]): string | undefined {
	if (blocks.some(hasRichTextH1)) return undefined
	return blocks.find(rendersHeading)?._key
}
