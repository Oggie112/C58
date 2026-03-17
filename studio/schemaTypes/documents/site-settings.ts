import {defineField, defineType, defineArrayMember} from 'sanity'

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
							validation: (rule) => rule.required(),
						}),
						defineField({
							name: 'url',
							title: 'URL',
							type: 'url',
							validation: (rule) => rule.required(),
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
		defineField({
			name: 'privacyPolicyPage',
			title: 'Privacy Policy Page',
			type: 'reference',
			to: [{type: 'page'}],
		}),
		defineField({
			name: 'navLinks',
			title: 'Navigation Links',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'object',
					name: 'navLink',
					fields: [
						defineField({
							name: 'label',
							title: 'Label',
							type: 'string',
							validation: (rule) => rule.required(),
						}),
						defineField({
							name: 'page',
							title: 'Page',
							type: 'reference',
							to: [{type: 'page'}],
							validation: (rule) => rule.required(),
						}),
					],
					preview: {
						select: {label: 'label', slug: 'page.slug.current'},
						prepare: ({label, slug}: {label: string; slug?: string}) => ({
							title: label,
							subtitle: slug ? `/${slug}` : 'No page selected',
						}),
					},
				}),
			],
		}),
	],
	preview: {
		prepare: () => ({title: 'Site Settings'}),
	},
})
