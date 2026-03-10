import { EventListBlock as EventListBlockType } from '@/types/sanity'
import { getUpcomingEvents, getPastEvents } from '@/sanity/fetch'
import EventListClient from './EventListClient'

export default async function EventListBlock({ block }: { block: EventListBlockType }) {
	let upcoming = []
	let past = []

	try {
		[upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()])
	} catch (error) {
		console.error('Failed to fetch events:', error)
		return null
	}

	return <EventListClient upcoming={upcoming} past={past} defaultTab={block.showPast ? 'past' : 'upcoming'} />
}
