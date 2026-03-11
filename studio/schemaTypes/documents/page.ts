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
			name: 'seo',
			title: 'SEO',
			type: 'object',
			fields: [
				defineField({
					name: 'title',
					title: 'Meta Title',
					type: 'string',
					description: 'Overrides the page title in search results. 50–60 characters ideal.',
				}),
				defineField({
					name: 'description',
					title: 'Meta Description',
					type: 'text',
					rows: 3,
					description: 'Shown under the link in Google. 150–160 characters ideal.',
				}),
				defineField({
					name: 'image',
					title: 'Social Share Image',
					type: 'image',
					description: 'Shown when the page is shared on social media. 1200×630px recommended.',
				}),
			],
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
