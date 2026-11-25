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
			description: 'What visitors see, e.g. 9pm – late',
		}),
		defineField({
			name: 'doorsTime',
			title: 'Doors open (24-hour)',
			type: 'string',
			description:
				'e.g. 21:00 — the start time Google shows in its events listings. The Time above is still what visitors see.',
			validation: (Rule) =>
				Rule.regex(/^([01]\d|2[0-3]):[0-5]\d$/, {name: '24-hour time'}).error('Use a 24-hour time, e.g. 21:00'),
		}),
		// Stored as `location` (renaming would need a content migration); it's
		// the venue's name, shown on event cards and the event page
		defineField({
			name: 'location',
			title: 'Venue name',
			type: 'string',
			description: 'e.g. Citizen Hub',
		}),
		defineField({
			name: 'venueAddress',
			title: 'Venue address',
			type: 'text',
			rows: 3,
			description:
				'Shown on the event page, and used by Google to list the event. Starts as the address in Site Settings — change it if the event is somewhere else.',
			// Where C58 is based is usually, not always, where the event is —
			// so it's a starting value the editor can see and change, never an
			// assumption made by the website
			initialValue: async (_params, {getClient}) => {
				const address = await getClient({apiVersion: '2025-02-26'}).fetch<string | null>(
					`*[_id == "siteSettings"][0].address`,
				)
				// undefined leaves the field empty (Sanity's documented "no initial
				// value") — the type only allows a string, hence the cast
				return (address ?? undefined) as string
			},
			validation: (Rule) =>
				Rule.custom((value) =>
					value ? true : 'Without an address, Google won’t show this event in its events listings',
				).warning(),
		}),
		defineField({
			name: 'cost',
			title: 'Cost',
			type: 'string',
			description: 'e.g. £10 advance / £15 on the door',
		}),
		defineField({
			name: 'ticketUrl',
			title: 'Ticket URL',
			type: 'url',
			description: 'Link to purchase tickets (Skiddle, SumUp, etc.)',
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
