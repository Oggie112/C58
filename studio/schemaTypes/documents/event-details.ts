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
	],
	preview: {
		select: {title: 'event.title', media: 'event.image', tiers: 'tiers'},
		prepare: ({title, media, tiers}) => ({
			title: title ?? 'Untitled event',
			subtitle: `${tiers?.length ?? 0} tier${tiers?.length === 1 ? '' : 's'}`,
			media,
		}),
	},
})
