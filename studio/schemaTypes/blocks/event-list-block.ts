import {defineField, defineType} from 'sanity'

export const eventListBlock = defineType({
	name: 'eventListBlock',
	title: 'Event List',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			placeholder: 'e.g. EVENTS',
		}),
		defineField({
			name: 'subheading',
			title: 'Subheading',
			description: 'Optional short muted subtext shown under the heading.',
			type: 'text',
			rows: 2,
		}),
		defineField({
			name: 'showPast',
			title: 'Show Past Events',
			type: 'boolean',
			initialValue: false,
			description: 'Toggle to show past events instead of upcoming.',
		}),
	],
	preview: {
		select: {showPast: 'showPast'},
		prepare: ({showPast}) => ({
			title: 'Event List',
			subtitle: showPast ? 'Past events' : 'Upcoming events',
		}),
	},
})
