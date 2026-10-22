import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import Link from 'next/link'
import { getOrderByToken, type OrderSummary } from '@/lib/getOrderByToken'
import { confirmOrder } from '@/lib/confirmOrder'
import { getEventByDetailsId } from '@/sanity/fetch'
import { formatEventDate } from '@/lib/dateFormat'
import { ticketQrSvgDataUri } from '@/lib/ticketQrCode'
import PendingRefresh from './PendingRefresh'

// The URL is the order's secret (see lib/generateAccessToken.ts): keep it
// out of search indexes and out of the Referer header on outgoing links.
export const metadata: Metadata = {
	title: 'Your order',
	robots: { index: false, follow: false },
	referrer: 'no-referrer',
}

const formatPence = (pence: number) => `£${(pence / 100).toFixed(2)}`

// Buyers land here from SumUp's "Back to merchant website" button, often
// before the webhook has arrived — so a still-pending order is confirmed
// against SumUp right here (option (b) in the 8UI.2 plan), not just read.
// confirmOrder is idempotent and safe to race with the webhook.
async function loadOrder(token: string): Promise<OrderSummary | null> {
	const order = await getOrderByToken(token)
	if (!order || order.status !== 'pending' || !order.providerSessionId) return order

	try {
		await confirmOrder({ id: order.id, providerSessionId: order.providerSessionId })
	} catch (error) {
		// SumUp unreachable: still render the order as pending — the webhook
		// (or the next refresh) will resolve it.
		console.error('Order page failed to confirm pending order:', error)
		return order
	}
	return getOrderByToken(token)
}

export default async function OrderPage({ params }: PageProps<'/orders/[token]'>) {
	await connection() // per-request: reads and may write live order state
	const { token } = await params

	const order = await loadOrder(token)
	if (!order) notFound()

	const event = await getEventByDetailsId(order.eventId)
	const eventHref = event?.slug?.current ? `/events/${event.slug.current}` : '/'

	// Pending but never linked to a SumUp checkout: createOrder failed between
	// creating the checkout and recording it, so the buyer was never sent to
	// pay. There's nothing to confirm against SumUp — polling would never
	// resolve it — and the sweep will fail it once the hold expires.
	const paymentNeverStarted = order.status === 'pending' && !order.providerSessionId
	const notCompleted = order.status === 'failed' || order.status === 'refunded' || paymentNeverStarted

	// Only a paid order's tickets are admissions; a refunded order's are
	// voided and must not be shown as scannable.
	const tickets = order.status === 'paid' ? order.tickets : []
	const qrCodes = await Promise.all(tickets.map((ticket) => ticketQrSvgDataUri(ticket.code)))

	return (
		<article className="pt-24 pb-32 px-4 md:px-6">
			<div className="max-w-[760px] mx-auto">
				<div className="mb-10">
					<div className="w-15 h-px bg-c58-ice mb-6" />
					{event && (
						<p className="font-body text-label text-c58-ice uppercase tracking-[0.15em] mb-4">
							{event.title} · {formatEventDate(event.date)}
							{event.time && ` · DOORS ${event.time}`}
						</p>
					)}
					<h1 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white">
						{order.status === 'paid' && "You're going"}
						{order.status === 'pending' && !paymentNeverStarted && 'Confirming payment'}
						{notCompleted && 'Order not completed'}
					</h1>
				</div>

				<section className="mb-12">
					{order.status === 'paid' && (
						<p className="font-body text-c58-white">
							Payment confirmed. Your tickets are below — one code per person, scanned at the door. A screenshot
							works fine. A confirmation is also on its way to <span className="text-c58-ice">{order.email}</span>{' '}
							— it can take a little while to arrive.
						</p>
					)}
					{order.status === 'pending' && !paymentNeverStarted && <PendingRefresh />}
					{paymentNeverStarted && (
						<p className="font-body text-c58-white">
							Payment for this order was never started, so you haven&apos;t been charged. Please try again.
						</p>
					)}
					{order.status === 'failed' && (
						<p className="font-body text-c58-white">
							This order wasn&apos;t completed and you haven&apos;t been charged. Any tickets it held have been
							released.
						</p>
					)}
					{order.status === 'refunded' && (
						<p className="font-body text-c58-white">This order has been refunded and its tickets cancelled.</p>
					)}
				</section>

				{tickets.length > 0 && (
					<section className="mb-12">
						<h2 className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-white mb-6">
							Tickets
						</h2>
						<ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
							{tickets.map((ticket, index) => {
								const unusable = ticket.status !== 'valid'
								return (
									<li key={ticket.code} className="relative bg-white p-4">
										{/* A data URI gains nothing from next/image's optimisation pipeline. */}
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={qrCodes[index]}
											alt={`Ticket QR code for ${ticket.tierName}, ticket ${index + 1} of ${tickets.length}`}
											className={`block w-full aspect-square ${unusable ? 'opacity-20' : ''}`}
										/>
										<div className="mt-3 flex items-baseline justify-between gap-4 text-c58-black">
											<span className="font-display font-bold uppercase tracking-[0.04em]">{ticket.tierName}</span>
											<span className="font-body text-label uppercase tracking-[0.15em]">
												{index + 1} of {tickets.length}
											</span>
										</div>
										{/* Human-readable fallback if a scan fails at the door. */}
										<p className="mt-1 font-body text-label tracking-[0.1em] text-c58-black">{ticket.code}</p>
										{unusable && (
											<span className="absolute inset-x-4 top-1/3 text-center font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-black">
												{ticket.status === 'used' ? 'Scanned' : 'Cancelled'}
											</span>
										)}
									</li>
								)
							})}
						</ul>
					</section>
				)}

				<section className="mb-12">
					<h2 className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-white mb-6">
						Order
					</h2>
					<ul className="space-y-4">
						{order.lines.map((line) => (
							<li key={`${line.tierName}-${line.unitPrice}`} className="flex items-center justify-between gap-4">
								<span className="font-display font-bold uppercase tracking-[0.04em] text-c58-white">
									{line.quantity} × {line.tierName}
								</span>
								<span className="font-body text-c58-muted">{formatPence(line.unitPrice * line.quantity)}</span>
							</li>
						))}
					</ul>
					<div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-c58-border">
						<span className="font-body text-label uppercase tracking-[0.15em] text-c58-muted">Total</span>
						<span className="font-display font-bold text-c58-ice">{formatPence(order.amountTotal)}</span>
					</div>
				</section>

				<Link
					href={eventHref}
					className="font-body text-label uppercase tracking-[0.15em] text-c58-ice hover:text-c58-white transition-colors duration-200"
				>
					{order.status === 'failed' || paymentNeverStarted ? '← Try again' : '← Back to event'}
				</Link>
			</div>
		</article>
	)
}
