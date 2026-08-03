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
		defineField({
			name: 'alignment',
			title: 'Alignment',
			type: 'string',
			options: {
				list: [
					{title: 'Left', value: 'left'},
					{title: 'Center', value: 'center'},
					{title: 'Right', value: 'right'},
				],
				layout: 'radio',
			},
			initialValue: 'left',
		}),
	],
	preview: {
		prepare: () => ({title: 'Rich Text'}),
	},
})
