import { getNearestEvent } from '@/sanity/fetch'
import EventCard from './EventCard'

export default async function NextEventBlock() {
	let event
	try {
		event = await getNearestEvent()
	} catch (error) {
		console.error('Failed to fetch nearest event:', error)
		return null
	}

	if (!event) return null

	return (
		<section className="py-16 md:py-32 px-4 md:px-6">
			<div className="max-w-[1200px] mx-auto">
				<div className="w-15 h-px bg-c58-ice mb-6" />
				<h2 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-10">
					NEXT EVENT
				</h2>
				<EventCard event={event} featured />
			</div>
		</section>
	)
}
