import {defineField, defineType} from 'sanity'

export const teamBlock = defineType({
	name: 'teamBlock',
	title: 'Team',
	type: 'object',
	fields: [
		defineField({
			name: 'members',
			title: 'Members',
			type: 'array',
			of: [{type: 'reference', to: [{type: 'teamMember'}]}],
		}),
	],
	preview: {
		prepare: () => ({title: 'Team'}),
	},
})
