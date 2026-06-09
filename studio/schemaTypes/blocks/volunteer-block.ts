import {defineField, defineType} from 'sanity'

export const volunteerBlock = defineType({
	name: 'volunteerBlock',
	title: 'Volunteers',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
		}),
	],
	preview: {
		prepare: () => ({title: 'Volunteers'}),
	},
})
