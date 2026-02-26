import {defineField, defineType} from 'sanity'

export const contactBlock = defineType({
	name: 'contactBlock',
	title: 'Contact',
	type: 'object',
	description: 'Displays contact details from Site Settings.',
	fields: [
		defineField({
			name: 'showMap',
			title: 'Show Map Embed',
			type: 'boolean',
			initialValue: false,
		}),
	],
	preview: {
		select: {showMap: 'showMap'},
		prepare: ({showMap}) => ({
			title: 'Contact',
			subtitle: showMap ? 'With map embed' : 'Without map',
		}),
	},
})
