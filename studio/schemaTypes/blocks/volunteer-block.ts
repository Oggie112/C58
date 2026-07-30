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
		defineField({
			name: 'intro',
			title: 'Intro',
			description: 'Short intro copy shown above the volunteers grid.',
			type: 'array',
			of: [{type: 'block', styles: [{title: 'Normal', value: 'normal'}], lists: []}],
		}),
	],
	preview: {
		prepare: () => ({title: 'Volunteers'}),
	},
})
