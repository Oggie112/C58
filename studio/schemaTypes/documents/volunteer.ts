import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export const volunteer = defineType({
	name: 'volunteer',
	title: 'Volunteer',
	type: 'document',
	fields: [
		orderRankField({type: 'volunteer'}),
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'bio',
			title: 'Bio',
			type: 'text',
			rows: 4,
		}),
		defineField({
			name: 'photo',
			title: 'Photo',
			type: 'image',
			options: {hotspot: true},
		}),
	],
	preview: {
		select: {
			title: 'name',
			media: 'photo',
		},
	},
})
