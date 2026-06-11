import {defineField, defineType} from 'sanity'

export const instagramBlock = defineType({
	name: 'instagramBlock',
	title: 'Instagram Feed',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
		}),
	],
	preview: {
		prepare: () => ({title: 'Instagram Feed'}),
	},
})
