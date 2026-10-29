import { EventListBlock as EventListBlockType } from '@/types/sanity'
import EventListClient from './EventListClient'

export default function EventListBlock({ block }: { block: EventListBlockType }) {
	return (
		<EventListClient
			upcoming={block.upcomingEvents}
			past={block.pastEvents}
			defaultTab={block.showPast ? 'past' : 'upcoming'}
			heading={block.heading ?? 'EVENTS'}
			subheading={block.subheading}
		/>
	)
}
