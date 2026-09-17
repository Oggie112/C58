import {defineField, defineType} from 'sanity'

export const eventDetails = defineType({
	name: 'eventDetails',
	title: 'Event Details',
	type: 'document',
	fields: [
		defineField({
			name: 'event',
			title: 'Event',
			type: 'reference',
			to: [{type: 'event'}],
			validation: (Rule) =>
				Rule.required().custom(async (value, context) => {
					if (!value?._ref) return true

					const {getClient, document} = context
					const client = getClient({apiVersion: '2025-02-26'})

					const draftId = document?._id?.startsWith('drafts.')
						? document._id
						: `drafts.${document?._id}`
					const publishedId = document?._id?.replace('drafts.', '') ?? ''

					const otherEventDetailsId = await client.fetch(
						`*[_type == "eventDetails" && event._ref == $eventId && !(_id in [$draftId, $publishedId])][0]._id`,
						{eventId: value._ref, draftId, publishedId},
					)

					return otherEventDetailsId
						? 'This event already has an Event Details document — each event can only have one.'
						: true
				}),
		}),
		defineField({
			name: 'ticketingStatus',
			title: 'Ticketing Status',
			type: 'string',
			description:
				'Manual override, independent of tier dates/capacity — e.g. force "Sold out" for a door-only overflow night even if a tier isn\'t technically exhausted.',
			options: {
				list: [
					{title: 'Not open', value: 'not_open'},
					{title: 'On sale', value: 'on_sale'},
					{title: 'Sold out', value: 'sold_out'},
					{title: 'Closed', value: 'closed'},
				],
				layout: 'radio',
			},
			initialValue: 'not_open',
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: 'tiers',
			title: 'Ticket Tiers',
			type: 'array',
			validation: (Rule) =>
				Rule.custom((tiers: {releaseTrigger?: string}[] | undefined) =>
					tiers?.[0]?.releaseTrigger === 'previousSoldOut'
						? "The first tier can't wait for a previous one to sell out — it has nothing before it."
						: true,
				),
			of: [
				{
					type: 'object',
					name: 'tier',
					fields: [
						defineField({
							name: 'name',
							title: 'Name',
							type: 'string',
							description: 'e.g. "First release", "VIP"',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'price',
							title: 'Price (£)',
							type: 'number',
							description: 'In pounds, e.g. 15.00. Use 0 for a free tier.',
							validation: (Rule) => Rule.required().min(0).precision(2),
						}),
						defineField({
							name: 'capacity',
							title: 'Capacity',
							type: 'number',
							description: 'Total number of this tier available',
							validation: (Rule) => Rule.required().integer().positive(),
						}),
						defineField({
							name: 'releaseTrigger',
							title: 'Opens',
							type: 'string',
							options: {
								list: [
									{title: 'On a scheduled date', value: 'scheduled'},
									{title: 'When the previous tier sells out', value: 'previousSoldOut'},
								],
								layout: 'radio',
							},
							initialValue: 'scheduled',
						}),
						defineField({
							name: 'saleStart',
							title: 'Sale Start',
							type: 'datetime',
							hidden: ({parent}) =>
								(parent as {releaseTrigger?: string})?.releaseTrigger === 'previousSoldOut',
						}),
						defineField({
							name: 'saleEnd',
							title: 'Sale End',
							type: 'datetime',
							validation: (Rule) =>
								Rule.custom((saleEnd, context) => {
									const saleStart = (context.parent as {saleStart?: string})?.saleStart
									if (!saleEnd || !saleStart) return true
									return new Date(saleEnd) > new Date(saleStart)
										? true
										: 'Sale end must be after sale start'
								}),
						}),
						defineField({
							name: 'description',
							title: 'Description',
							type: 'text',
							rows: 3,
						}),
					],
					preview: {
						select: {title: 'name', subtitle: 'price'},
						prepare: ({title, subtitle}) => ({
							title,
							subtitle: typeof subtitle === 'number' ? `£${subtitle.toFixed(2)}` : undefined,
						}),
					},
				},
			],
		}),
		defineField({
			name: 'lineup',
			title: 'Line-up',
			type: 'array',
			of: [
				{
					type: 'object',
					name: 'lineupEntry',
					fields: [
						defineField({
							name: 'entryType',
							title: 'Entry Type',
							type: 'string',
							options: {
								list: [
									{title: 'Roster talent', value: 'talent'},
									{title: 'Guest (one-off)', value: 'guest'},
								],
								layout: 'radio',
							},
							initialValue: 'talent',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'talent',
							title: 'Talent',
							type: 'reference',
							to: [{type: 'talent'}],
							hidden: ({parent}) => (parent as {entryType?: string})?.entryType !== 'talent',
							validation: (Rule) =>
								Rule.custom((value, context) => {
									const parent = context.parent as {entryType?: string}
									if (parent?.entryType === 'talent' && !value) {
										return 'Select a talent, or switch to "Guest" for a one-off name'
									}
									return true
								}),
						}),
						defineField({
							name: 'guestName',
							title: 'Name',
							type: 'string',
							hidden: ({parent}) => (parent as {entryType?: string})?.entryType !== 'guest',
							validation: (Rule) =>
								Rule.custom((value, context) => {
									const parent = context.parent as {entryType?: string}
									if (parent?.entryType === 'guest' && !value) {
										return 'Enter a name, or switch to "Roster talent" to reference an existing profile'
									}
									return true
								}),
						}),
						defineField({
							name: 'guestRole',
							title: 'Role',
							type: 'string',
							description: "e.g. DJ, Live Act — free text since guests aren't on the talent roster",
							hidden: ({parent}) => (parent as {entryType?: string})?.entryType !== 'guest',
						}),
						defineField({
							name: 'setTime',
							title: 'Set Time',
							type: 'string',
							description: 'e.g. "10pm – 11:30pm" — optional, can stay vague or unset',
						}),
					],
					preview: {
						select: {
							entryType: 'entryType',
							talentName: 'talent.name',
							talentPhoto: 'talent.photo',
							guestName: 'guestName',
							setTime: 'setTime',
						},
						prepare: ({entryType, talentName, talentPhoto, guestName, setTime}) => ({
							title: (entryType === 'talent' ? talentName : guestName) ?? 'Untitled',
							subtitle: setTime,
							media: talentPhoto,
						}),
					},
				},
			],
		}),
	],
	preview: {
		select: {title: 'event.title', media: 'event.image', tiers: 'tiers', status: 'ticketingStatus'},
		prepare: ({title, media, tiers, status}) => ({
			title: title ?? 'Untitled event',
			subtitle: `${tiers?.length ?? 0} tier${tiers?.length === 1 ? '' : 's'} · ${status ?? 'not open'}`,
			media,
		}),
	},
})
