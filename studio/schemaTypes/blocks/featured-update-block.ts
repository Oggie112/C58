import {defineField, defineType} from 'sanity'

export const featuredUpdateBlock = defineType({
	name: 'featuredUpdateBlock',
	title: 'Featured Update',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			placeholder: 'e.g. NEXT EVENT, LATEST NEWS',
		}),
		defineField({
			name: 'contentType',
			title: 'Content Type',
			type: 'string',
			options: {
				list: [
					{title: 'Next Event', value: 'nextEvent'},
					{title: 'Featured Post', value: 'featuredPost'},
				],
				layout: 'radio',
			},
			initialValue: 'nextEvent',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'post',
			title: 'Post',
			type: 'reference',
			to: [{type: 'post'}],
			hidden: ({parent}) => parent?.contentType !== 'featuredPost',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const parent = context.parent as {contentType?: string}
					if (parent?.contentType === 'featuredPost' && !value) {
						return 'A post is required when Content Type is set to Featured Post'
					}
					return true
				}),
		}),
	],
	preview: {
		select: {
			contentType: 'contentType',
			postTitle: 'post.title',
			heading: 'heading',
		},
		prepare: ({contentType, postTitle, heading}) => ({
			title: 'Featured Update',
			subtitle: heading
				? heading
				: contentType === 'nextEvent'
					? 'Next Event'
					: postTitle ?? 'Featured Post',
		}),
	},
})
