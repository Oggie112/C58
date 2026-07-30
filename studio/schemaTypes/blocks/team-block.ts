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
		defineField({
			name: 'intro',
			title: 'Intro',
			description: 'Short intro copy shown above the team grid.',
			type: 'array',
			of: [{type: 'block', styles: [{title: 'Normal', value: 'normal'}], lists: []}],
		}),
	],
	preview: {
		prepare: () => ({title: 'Team'}),
	},
})
