import {defineType} from 'sanity'

export const nextEventBlock = defineType({
	name: 'nextEventBlock',
	title: 'Next Event',
	type: 'object',
	fields: [],
	preview: {
		prepare: () => ({title: 'Next Event', subtitle: 'Auto-queries nearest upcoming event'}),
	},
})
