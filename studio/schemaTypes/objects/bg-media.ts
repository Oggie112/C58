import {defineField, defineType} from 'sanity'

export const bgMedia = defineType({
	name: 'bgMedia',
	title: 'Background Media',
	type: 'object',
	fields: [
		defineField({
			name: 'mediaType',
			title: 'Type',
			type: 'string',
			options: {
				list: [
					{title: 'Image', value: 'image'},
					{title: 'Video', value: 'video'},
				],
				layout: 'radio',
			},
			initialValue: 'image',
		}),
		defineField({
			name: 'image',
			title: 'Image',
			type: 'image',
			options: {hotspot: true},
			hidden: ({parent}) => parent?.mediaType !== 'image',
		}),
		defineField({
			name: 'video',
			title: 'Video',
			type: 'file',
			options: {accept: 'video/mp4,video/webm'},
			hidden: ({parent}) => parent?.mediaType !== 'video',
		}),
		defineField({
			name: 'poster',
			title: 'Video Poster',
			description:
				'Shown immediately while the video loads (and as a fallback if it fails). Strongly recommended — without it the hero is blank until the video arrives.',
			type: 'image',
			options: {hotspot: true},
			hidden: ({parent}) => parent?.mediaType !== 'video',
			validation: (rule) =>
				rule.warning('Add a poster image so the hero has something to show before the video loads.'),
		}),
	],
})
