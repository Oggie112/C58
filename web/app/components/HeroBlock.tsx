import { HeroBlock as HeroBlockType, SanityEvent, SanityPost } from '@/types/sanity'
import HeroClient from './HeroClient'

export default function HeroBlock({ block }: { block: HeroBlockType }) {
	let update: SanityEvent | SanityPost | null = null

	if (block.contentType === 'featuredPost') {
		update = block.post ?? null
	} else if (block.contentType === 'nextEvent') {
		update = block.nextEvent ?? null
	}

	return <HeroClient block={block} update={update} />
}
