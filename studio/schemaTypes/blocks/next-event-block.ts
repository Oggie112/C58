import {defineType, defineField} from 'sanity'

export const nextEventBlock = defineType({
	name: 'nextEventBlock',
	title: 'Next Event',
	type: 'object',
	fields: [
		defineField({
              name: 'info',
              title: 'Info',
              type: 'string',
              readOnly: true,
              initialValue: 'Automatically displays the nearest upcoming event.',
        }),
	],
	preview: {
		prepare: () => ({title: 'Next Event', subtitle: 'Auto-queries nearest upcoming event'}),
	},
})
