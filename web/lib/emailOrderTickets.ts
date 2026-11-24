import { getOrderById } from './getOrderByToken'
import { renderConfirmationEmail, ticketAttachmentName, type ConfirmationEvent } from './confirmationEmail'
import { sendTransactionalEmail, type SendResult } from './brevo'
import { ticketQrPng } from './ticketQrCode'
import { getEventByDetailsId } from '@/sanity/fetch'
import { PUBLISHED_FETCH_OPTIONS } from '@/sanity/fetchOptions'

// Loads a paid order, renders its confirmation and sends it via Brevo — the
// part shared by the first confirmation (sendOrderConfirmation) and resends
// (8UI.3). No claims here: each caller decides whether it may send, and
// what to do if this throws (any failure: order gone, Sanity, Brevo).
export async function emailOrderTickets(
	orderId: string,
	accessToken: string,
	idempotencyKey: string,
): Promise<SendResult> {
	const order = await getOrderById(orderId)
	if (!order) throw new Error('order not found')

	const event = await getEventByDetailsId(order.eventId, PUBLISHED_FETCH_OPTIONS)
	const confirmationEvent: ConfirmationEvent | null = event
		? { title: event.title, date: event.date, time: event.time, location: event.location }
		: null

	// A fresh confirmation's tickets are all valid; filtering keeps a voided
	// ticket out if this ever runs for a part-refunded order.
	const tickets = order.tickets.filter((ticket) => ticket.status === 'valid')

	const email = renderConfirmationEmail({
		order: { ...order, tickets },
		event: confirmationEvent,
		orderUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/orders/${accessToken}`,
	})
	const attachments = await Promise.all(
		tickets.map(async (ticket) => ({ name: ticketAttachmentName(ticket.code), content: await ticketQrPng(ticket.code) })),
	)

	return sendTransactionalEmail({
		to: order.email,
		...email,
		attachments,
		idempotencyKey,
		tags: ['order-confirmation'],
	})
}
