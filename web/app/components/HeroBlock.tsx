import { HeroBlock as HeroBlockType } from '@/types/sanity'
import { getNearestEvent } from '@/sanity/fetch'
import HeroClient from './HeroClient'

export default async function HeroBlock({ block }: { block: HeroBlockType }) {
	let nextEvent = null
	try {
		nextEvent = await getNearestEvent()
	} catch (error) {
		console.error('Failed to fetch nearest event for hero:', error)
	}

	return <HeroClient block={block} nextEvent={nextEvent} />
}
