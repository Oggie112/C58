import {defineField, defineType} from 'sanity'

export const page = defineType({
	name: 'page',
	title: 'Page',
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
			name: 'pageBuilder',
			title: 'Page Builder',
			type: 'array',
			of: [
				{type: 'heroBlock'},
				{type: 'nextEventBlock'},
				{type: 'featuredPostBlock'},
				{type: 'eventListBlock'},
				{type: 'richTextBlock'},
				{type: 'teamBlock'},
				{type: 'contactBlock'},
				{type: 'imageBlock'},
			],
		}),
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'slug.current',
		},
	},
})
