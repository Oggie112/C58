import {defineField, defineType} from 'sanity'

export const teamBlock = defineType({
	name: 'teamBlock',
	title: 'Team',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
		}),
	],
	preview: {
		prepare: () => ({title: 'Team'}),
	},
})
