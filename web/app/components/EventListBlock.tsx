import { EventListBlock as EventListBlockType } from '@/types/sanity'
import type { HeadingLevel } from '@/lib/pageHeading'
import EventListClient from './EventListClient'

export default function EventListBlock({ block, headingLevel }: { block: EventListBlockType; headingLevel?: HeadingLevel }) {
	return (
		<EventListClient
			upcoming={block.upcomingEvents}
			past={block.pastEvents}
			defaultTab={block.showPast ? 'past' : 'upcoming'}
			heading={block.heading ?? 'EVENTS'}
			subheading={block.subheading}
			headingLevel={headingLevel}
		/>
	)
}
