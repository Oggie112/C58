import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export const teamMember = defineType({
	name: 'teamMember',
	title: 'Team Member',
	type: 'document',
	fields: [
		orderRankField({type: 'teamMember'}),
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'role',
			title: 'Role',
			type: 'string',
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
			subtitle: 'role',
			media: 'photo',
		},
	},
})
