import {defineField, defineType, defineArrayMember} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

const ROLES = [
	{title: 'DJ', value: 'DJ'},
	{title: 'Live Act', value: 'Live Act'},
	{title: 'Producer', value: 'Producer'},
	{title: 'Visual Artist', value: 'Visual Artist'},
	{title: 'Photographer', value: 'Photographer'},
	{title: 'Promoter', value: 'Promoter'},
]

export const talent = defineType({
	name: 'talent',
	title: 'Talent',
	type: 'document',
	fields: [
		orderRankField({type: 'talent'}),
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: {source: 'name'},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'role',
			title: 'Role',
			type: 'string',
			options: {list: ROLES},
		}),
		defineField({
			name: 'bio',
			title: 'Bio',
			type: 'text',
			rows: 6,
		}),
		defineField({
			name: 'photo',
			title: 'Photo',
			type: 'image',
			options: {hotspot: true},
		}),
		defineField({
			name: 'socialLinks',
			title: 'Social Links',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'object',
					name: 'socialLink',
					fields: [
						defineField({
							name: 'platform',
							title: 'Platform',
							type: 'string',
							description: 'e.g. Instagram, SoundCloud, Spotify',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'url',
							title: 'URL',
							type: 'url',
							validation: (Rule) => Rule.required(),
						}),
					],
					preview: {
						select: {platform: 'platform', url: 'url'},
						prepare: ({platform, url}: {platform: string; url?: string}) => ({
							title: platform,
							subtitle: url,
						}),
					},
				}),
			],
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
