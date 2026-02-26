import {defineField, defineType} from 'sanity'

export const featuredPostBlock = defineType({
	name: 'featuredPostBlock',
	title: 'Featured Post',
	type: 'object',
	fields: [
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
