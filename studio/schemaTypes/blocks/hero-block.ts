import {defineField, defineType} from 'sanity'

export const heroBlock = defineType({
	name: 'heroBlock',
	title: 'Hero',
	type: 'object',
	fields: [
		defineField({
			name: 'bgMedia',
			title: 'Background Media',
			type: 'bgMedia',
		}),
		defineField({
			name: 'overlayText',
			title: 'Overlay Text',
			type: 'string',
		}),
	],
	preview: {
		select: {title: 'overlayText'},
		prepare: ({title}) => ({title: 'Hero', subtitle: title}),
	},
})
