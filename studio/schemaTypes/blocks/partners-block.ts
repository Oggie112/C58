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
	],
	preview: {
		select: {heading: 'heading'},
		prepare: ({heading}) => ({
			title: 'Partners',
			subtitle: heading ?? 'All partners',
		}),
	},
})
