import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export const partner = defineType({
	name: 'partner',
	title: 'Partner',
	type: 'document',
	fields: [
		orderRankField({type: 'partner'}),
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'logo',
			title: 'Logo',
			type: 'image',
			options: {hotspot: true},
		}),
		defineField({
			name: 'website',
			title: 'Website',
			type: 'url',
		}),
		defineField({
			name: 'description',
			title: 'Description',
			type: 'text',
			rows: 3,
		}),
	],
	preview: {
		select: {
			title: 'name',
			subtitle: 'website',
			media: 'logo',
		},
	},
})
