import {defineField, defineType} from 'sanity'

export const featuredPostBlock = defineType({
	name: 'featuredPostBlock',
	title: 'Featured Post',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			placeholder: 'e.g. FEATURED POST',
		}),
		defineField({
			name: 'post',
			title: 'Post',
			type: 'reference',
			to: [{type: 'post'}],
			validation: (Rule) => Rule.required(),
		}),
	],
	preview: {
		select: {title: 'post.title'},
		prepare: ({title}) => ({title: 'Featured Post', subtitle: title}),
	},
})
