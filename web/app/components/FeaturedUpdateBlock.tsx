import { FeaturedUpdateBlock as FeaturedUpdateBlockType } from '@/types/sanity'
import { getNearestEvent } from '@/sanity/fetch'
import { SanityEvent, SanityPost } from '@/types/sanity'
import EventCard from './EventCard'
import PostCard from './PostCard'

interface Props {
	block: FeaturedUpdateBlockType
}

export default async function FeaturedUpdateBlock({ block }: Props) {
	const { heading, contentType, post } = block

	let card: React.ReactNode
	let defaultHeading: string

	if (contentType === 'nextEvent') {
		let event: SanityEvent | null = null
		try {
			event = await getNearestEvent()
		} catch (error) {
			console.error('FeaturedUpdateBlock: failed to fetch nearest event:', error)
			return null
		}
		if (!event) return null
		card = <EventCard event={event} featured />
		defaultHeading = 'NEXT EVENT'
	} else {
		if (!post) return null
		card = <PostCard post={post as SanityPost} featured />
		defaultHeading = 'FEATURED POST'
	}

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					{heading ?? defaultHeading}
				</h2>
				{card}
			</div>
		</section>
	)
}
