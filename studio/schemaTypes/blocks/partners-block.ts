import {defineField, defineType} from 'sanity'

export const partnersBlock = defineType({
	name: 'partnersBlock',
	title: 'Partners',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			placeholder: 'e.g. OUR PARTNERS',
		}),
		defineField({
			name: 'subheading',
			title: 'Subheading',
			description: 'Optional short muted subtext shown under the heading.',
			type: 'text',
			rows: 2,
		}),
	],
	preview: {
		select: {heading: 'heading'},
		prepare: ({heading}) => ({
			title: 'Partners',
			subtitle: heading ?? 'All partners',
		}),
	},
})
