import {defineField, defineType} from 'sanity'

export const blogListBlock = defineType({
	name: 'blogListBlock',
	title: 'Blog List',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			placeholder: 'e.g. LATEST POSTS',
		}),
	],
	preview: {
		select: {heading: 'heading'},
		prepare: ({heading}) => ({
			title: 'Blog List',
			subtitle: heading ?? 'All posts',
		}),
	},
})
