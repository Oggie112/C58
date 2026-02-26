import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
	name: 'siteSettings',
	title: 'Site Settings',
	type: 'document',
	fields: [
		defineField({
			name: 'phone',
			title: 'Phone',
			type: 'string',
		}),
		defineField({
			name: 'email',
			title: 'Email',
			type: 'string',
		}),
		defineField({
			name: 'address',
			title: 'Address',
			type: 'text',
			rows: 3,
		}),
	],
	preview: {
		prepare: () => ({title: 'Site Settings'}),
	},
})
