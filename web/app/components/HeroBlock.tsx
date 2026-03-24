import { HeroBlock as HeroBlockType, SanityEvent, SanityPost } from '@/types/sanity'
import { getNearestEvent } from '@/sanity/fetch'
import HeroClient from './HeroClient'

export default async function HeroBlock({ block }: { block: HeroBlockType }) {
	let update: SanityEvent | SanityPost | null = null

	if (block.contentType === 'featuredPost') {
		update = block.post ?? null
	} else if (block.contentType === 'nextEvent') {
		try {
			update = await getNearestEvent()
		} catch (error) {
			console.error('Failed to fetch nearest event for hero:', error)
		}
	}

	return <HeroClient block={block} update={update} />
}
