import type {StructureBuilder} from 'sanity/structure'

// Custom "Events" list item so each event's eventDetails (tiers, line-up, FAQ)
// is reachable right alongside it, instead of eventDetails sitting as its own
// disconnected flat list — see ADR 004 consequences.
export const eventListItem = (S: StructureBuilder) =>
	S.documentTypeListItem('event')
		.title('Events')
		.child(
			S.documentTypeList('event')
				.title('Events')
				.child((eventId) =>
					S.list()
						.title('Event')
						.items([
							S.listItem()
								.title('Event')
								.child(S.document().schemaType('event').documentId(eventId)),
							S.listItem()
								.title('Event Details')
								.child(
									// Filtered to this one event — at most one match, since the
									// eventDetails schema enforces uniqueness per event. Empty
									// state falls back to Sanity's default "create new" flow,
									// which does NOT pre-fill the event reference — deferred;
									// would need a registered initial-value template.
									S.documentList()
										.title('Event Details')
										.schemaType('eventDetails')
										.filter('_type == "eventDetails" && event._ref == $eventId')
										.params({eventId}),
								),
						]),
				),
		)
