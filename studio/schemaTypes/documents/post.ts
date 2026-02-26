import {defineField, defineType} from 'sanity'

export const post = defineType({
	name: 'post',
	title: 'Post',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {source: 'title'},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'date',
			title: 'Date',
			type: 'date',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'image',
			title: 'Image',
			type: 'image',
			options: {hotspot: true},
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'array',
			of: [{type: 'block'}],
		}),
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'date',
			media: 'image',
		},
	},
})
