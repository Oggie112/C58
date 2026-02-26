import {defineField, defineType} from 'sanity'

export const richTextBlock = defineType({
	name: 'richTextBlock',
	title: 'Rich Text',
	type: 'object',
	fields: [
		defineField({
			name: 'body',
			title: 'Body',
			type: 'array',
			of: [{type: 'block'}],
		}),
	],
	preview: {
		prepare: () => ({title: 'Rich Text'}),
	},
})
