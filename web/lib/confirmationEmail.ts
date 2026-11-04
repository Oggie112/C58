import { formatEventDate } from './dateFormat'
import { formatPence } from './formatPence'
import type { OrderSummary } from './getOrderByToken'

export interface ConfirmationEvent {
	title: string
	date: string // YYYY-MM-DD
	time?: string
	location?: string
}

export interface ConfirmationEmailInput {
	order: Pick<OrderSummary, 'lines' | 'tickets' | 'amountTotal'>
	// null if the event has since been removed from Sanity — the email still
	// carries the tickets, just without event details.
	event: ConfirmationEvent | null
	orderUrl: string
}

export interface RenderedEmail {
	subject: string
	html: string
	text: string
}

// The attachment filename for a ticket's QR code — shared with the sender so
// the email body can tell buyers what to look for.
export function ticketAttachmentName(ticketCode: string): string {
	return `${ticketCode}.png`
}

// Everything interpolated into the HTML passes through here: event titles,
// locations and tier names come from Sanity, which isn't trusted markup.
function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function eventDetailsLine(event: ConfirmationEvent): string {
	return [formatEventDate(event.date), event.time && `Doors ${event.time}`, event.location].filter(Boolean).join(' · ')
}

// Plain HTML with inline styles and table layout — what email clients
// reliably render. Dark text on white: no dark-mode theming to go wrong.
export function renderConfirmationEmail({ order, event, orderUrl }: ConfirmationEmailInput): RenderedEmail {
	// Collapsed to one line: a line break in a Sanity title must not reach
	// the Subject header.
	const subject = event ? `Your tickets for ${event.title.replace(/\s+/g, ' ').trim()}` : 'Your C58 tickets'
	const ticketCount = order.tickets.length
	const ticketNoun = ticketCount === 1 ? 'ticket' : 'tickets'

	const ticketRowsHtml = order.tickets
		.map(
			(ticket, index) => `
				<tr>
					<td style="padding:8px 0;border-bottom:1px solid #e5e5e5;">
						<strong>${escapeHtml(ticket.tierName)}</strong> &middot; ${index + 1} of ${ticketCount}<br>
						<span style="font-family:monospace;font-size:15px;letter-spacing:1px;">${escapeHtml(ticket.code)}</span>
					</td>
				</tr>`,
		)
		.join('')

	const lineRowsHtml = order.lines
		.map(
			(line) => `
				<tr>
					<td style="padding:4px 0;">${line.quantity} &times; ${escapeHtml(line.tierName)}</td>
					<td style="padding:4px 0;text-align:right;">${formatPence(line.unitPrice * line.quantity)}</td>
				</tr>`,
		)
		.join('')

	const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
		<tr>
			<td align="center" style="padding:24px 16px;">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
					<tr><td style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#555555;">C58 &middot; Courtyard 58</td></tr>
					<tr><td style="padding-top:8px;font-size:26px;font-weight:bold;">You&#39;re going</td></tr>
					${
						event
							? `<tr><td style="padding-top:8px;font-size:18px;font-weight:bold;">${escapeHtml(event.title)}</td></tr>
					<tr><td style="color:#555555;">${escapeHtml(eventDetailsLine(event))}</td></tr>`
							: ''
					}
					<tr>
						<td style="padding-top:24px;">
							Your ${ticketNoun} ${ticketCount === 1 ? 'is' : 'are'} below. <strong>Each QR code is attached to this email as an image</strong>, named after its ticket code &mdash; show it at the door on your phone or printed. The code underneath works if a scan fails.
						</td>
					</tr>
					<tr>
						<td style="padding-top:16px;">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${ticketRowsHtml}
							</table>
						</td>
					</tr>
					<tr>
						<td style="padding-top:24px;">
							<a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:bold;">View your tickets online</a>
						</td>
					</tr>
					<tr>
						<td style="padding-top:32px;">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
								<tr><td colspan="2" style="padding-bottom:4px;font-weight:bold;">Order summary</td></tr>${lineRowsHtml}
								<tr>
									<td style="padding-top:8px;border-top:1px solid #e5e5e5;font-weight:bold;">Total</td>
									<td style="padding-top:8px;border-top:1px solid #e5e5e5;text-align:right;font-weight:bold;">${formatPence(order.amountTotal)}</td>
								</tr>
							</table>
						</td>
					</tr>
					<tr>
						<td style="padding-top:32px;font-size:13px;color:#555555;">
							Keep this email to yourself &mdash; anyone with these codes or the link above can use your tickets. Questions? Reply to this email.
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`

	const text = [
		"YOU'RE GOING",
		...(event ? ['', event.title, eventDetailsLine(event)] : []),
		'',
		`Your ${ticketNoun} (each QR code is attached to this email as an image, named after its ticket code):`,
		...order.tickets.map((ticket, index) => `  ${ticket.tierName} · ${index + 1} of ${ticketCount}: ${ticket.code}`),
		'',
		`View your tickets online: ${orderUrl}`,
		'',
		'Order summary',
		...order.lines.map((line) => `  ${line.quantity} × ${line.tierName}: ${formatPence(line.unitPrice * line.quantity)}`),
		`  Total: ${formatPence(order.amountTotal)}`,
		'',
		'Keep this email to yourself — anyone with these codes or the link above can use your tickets. Questions? Reply to this email.',
	].join('\n')

	return { subject, html, text }
}
