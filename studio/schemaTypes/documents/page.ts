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
				{type: 'featuredUpdateBlock'},
				{type: 'blogListBlock'},
				{type: 'talentListBlock'},
				{type: 'partnersBlock'},
				{type: 'eventListBlock'},
				{type: 'richTextBlock'},
				{type: 'teamBlock'},
				{type: 'volunteerBlock'},
				{type: 'contactBlock'},
				{type: 'imageBlock'},
				{type: 'instagramBlock'},
			],
			// A page has one main heading (<h1>) for Google and screen readers.
			// A "Heading 1" in Rich Text becomes it; with none, the site uses
			// the first block's heading. Two or more is the one case the site
			// can't sort out on its own.
			validation: (Rule) =>
				Rule.custom((blocks) => {
					const headingOnes = (blocks ?? []).flatMap((block) => {
						const {_type, body} = block as {_type?: string; body?: Array<{style?: string}>}
						return _type === 'richTextBlock' ? (body ?? []).filter((part) => part.style === 'h1') : []
					})
					return headingOnes.length > 1
						? `This page has ${headingOnes.length} "Heading 1" lines in its Rich Text — use one, and Heading 2 for the rest. A page should have a single main heading.`
						: true
				}).warning(),
		}),
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'slug.current',
		},
	},
})
