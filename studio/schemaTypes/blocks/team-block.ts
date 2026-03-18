import {defineType} from 'sanity'

export const teamBlock = defineType({
	name: 'teamBlock',
	title: 'Team',
	type: 'object',
	fields: [],
	preview: {
		prepare: () => ({title: 'Team'}),
	},
})
