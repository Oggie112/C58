import { FeaturedUpdateBlock as FeaturedUpdateBlockType } from '@/types/sanity'
import { SanityPost } from '@/types/sanity'
import EventCard from './EventCard'
import PostCard from './PostCard'

interface Props {
	block: FeaturedUpdateBlockType
}

export default function FeaturedUpdateBlock({ block }: Props) {
	const { heading, contentType, post, nextEvent } = block

	let card: React.ReactNode
	let defaultHeading: string

	if (contentType === 'nextEvent') {
		if (!nextEvent) return null
		card = <EventCard event={nextEvent} featured />
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
