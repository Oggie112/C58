import {defineField, defineType} from 'sanity'

export const imageBlock = defineType({
	name: 'imageBlock',
	title: 'Image',
	type: 'object',
	fields: [
		defineField({
			name: 'image',
			title: 'Image',
			type: 'image',
			options: {hotspot: true},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'caption',
			title: 'Caption',
			type: 'string',
		}),
	],
	preview: {
		select: {media: 'image', subtitle: 'caption'},
		prepare: ({media, subtitle}) => ({title: 'Image', media, subtitle}),
	},
})
