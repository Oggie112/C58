import {defineField, defineType} from 'sanity'

export const eventListBlock = defineType({
	name: 'eventListBlock',
	title: 'Event List',
	type: 'object',
	fields: [
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
