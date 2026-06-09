import {defineField, defineType} from 'sanity'

export const talentListBlock = defineType({
	name: 'talentListBlock',
	title: 'Talent List',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			placeholder: 'e.g. OUR TALENT',
		}),
	],
	preview: {
		select: {heading: 'heading'},
		prepare: ({heading}) => ({
			title: 'Talent List',
			subtitle: heading ?? 'All talent',
		}),
	},
})
