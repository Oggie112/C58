import {defineField, defineType} from 'sanity'

export const event = defineType({
	name: 'event',
	title: 'Event',
	type: 'document',
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {source: 'title'},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'date',
			title: 'Date',
			type: 'date',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'time',
			title: 'Time',
			type: 'string',
			description: 'e.g. 9pm – late',
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'string',
		}),
		defineField({
			name: 'cost',
			title: 'Cost',
			type: 'string',
			description: 'e.g. £10 advance / £15 on the door',
		}),
		defineField({
			name: 'image',
			title: 'Image',
			type: 'image',
			options: {hotspot: true},
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'array',
			of: [{type: 'block'}],
		}),
	],
	preview: {
		select: {
			title: 'title',
			subtitle: 'date',
			media: 'image',
		},
	},
})
