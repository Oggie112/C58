import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import { getAllEventSlugs, getEventBySlug } from '@/sanity/fetch'
import { urlFor } from '@/sanity/image'
import { formatEventDate } from '@/lib/dateFormat'
import portableTextComponents from '@/lib/portableTextComponents'
import type { SanityTier, SanityLineupEntry, SanityFaqEntry, TicketingStatus } from '@/types/sanity'

const TICKETING_STATUS_LABEL: Record<TicketingStatus, string> = {
	not_open: 'Not yet on sale',
	on_sale: 'On sale',
	sold_out: 'Sold out',
	closed: 'Closed',
}

export async function generateStaticParams() {
	return await getAllEventSlugs({ perspective: 'published', stega: false })
}

export async function generateMetadata(
	{ params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
	const { slug } = await params
	const event = await getEventBySlug(slug)
	if (!event) return {}

	const ogImage = event.image
		? urlFor(event.image).width(1200).height(630).url()
		: undefined

	return {
		title: event.title,
		openGraph: {
			title: event.title,
			...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
		},
	}
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const event = await getEventBySlug(slug)

	if (!event) notFound()

	const imageUrl = event.image
		? urlFor(event.image).width(1200).height(675).url()
		: null

	const details = event.eventDetails
	const tiers = details?.tiers ?? []
	const lineup = details?.lineup ?? []
	const faq = details?.faq ?? []

	return (
		<article className="pt-24 pb-32 px-4 md:px-6">
			<div className="max-w-[760px] mx-auto">
				<div className="mb-10">
					<div className="w-15 h-px bg-c58-ice mb-6" />
					<div className="flex items-center gap-4 mb-4">
						<span className="font-body text-label text-c58-ice uppercase tracking-[0.15em]">
							{formatEventDate(event.date)}
						</span>
						{event.location && (
							<span className="font-body text-label text-c58-muted uppercase tracking-[0.15em]">
								{event.location}
							</span>
						)}
						{event.time && (
							<span className="font-body text-label text-c58-muted uppercase tracking-[0.15em]">
								DOORS {event.time}
							</span>
						)}
					</div>
					<h1 className="font-display font-bold text-display uppercase leading-[0.9] tracking-[0.04em] text-c58-white">
						{event.title}
					</h1>
				</div>

				{imageUrl && (
					<div className="relative w-full aspect-video mb-12 overflow-hidden">
						<Image
							src={imageUrl}
							alt={`Event image for ${event.title}`}
							fill
							priority
							className="object-cover"
						/>
					</div>
				)}

				{/* Ticketing */}
				<section className="mb-12">
					{tiers.length > 0 ? (
						<>
							<div className="flex items-center justify-between mb-6">
								<h2 className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-white">
									Tickets
								</h2>
								{details && (
									<span className="font-body text-label uppercase tracking-[0.15em] text-c58-ice">
										{TICKETING_STATUS_LABEL[details.ticketingStatus]}
									</span>
								)}
							</div>
							<ul className="space-y-4">
								{tiers.map((tier: SanityTier) => (
									<li
										key={tier._key}
										className="flex items-start justify-between gap-6 border border-c58-border p-4 md:p-6"
									>
										<div>
											<p className="font-display font-bold uppercase tracking-[0.04em] text-c58-white mb-1">
												{tier.name}
											</p>
											{tier.description && (
												<p className="font-body text-body text-c58-muted">{tier.description}</p>
											)}
										</div>
										<p className="font-display font-bold text-c58-ice whitespace-nowrap">
											£{tier.price.toFixed(2)}
										</p>
									</li>
								))}
							</ul>
						</>
					) : event.ticketUrl ? (
						<Link
							href={event.ticketUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 inline-block hover:bg-white active:scale-[0.97] active:duration-150 active:[transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] transition-[background-color,transform] duration-200"
						>
							TICKETS →
						</Link>
					) : null}
				</section>

				{event.description && (
					<section className="mb-12">
						<PortableText value={event.description} components={portableTextComponents} />
					</section>
				)}

				{lineup.length > 0 && (
					<section className="mb-12">
						<h2 className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-white mb-6">
							Line-up
						</h2>
						<ul className="space-y-4">
							{lineup.map((entry: SanityLineupEntry) => {
								const name = entry.entryType === 'talent' ? entry.talent?.name : entry.guestName
								const role = entry.entryType === 'talent' ? entry.talent?.role : entry.guestRole
								const photoUrl = entry.talent?.photo
									? urlFor(entry.talent.photo).width(120).height(120).url()
									: null

								return (
									<li key={entry._key} className="flex items-center gap-4">
										{photoUrl && (
											<div className="relative w-12 h-12 shrink-0 overflow-hidden">
												<Image src={photoUrl} alt={name ?? ''} fill className="object-cover" />
											</div>
										)}
										<div className="flex-1">
											<p className="font-display font-bold uppercase tracking-[0.04em] text-c58-white">
												{name ?? 'TBA'}
											</p>
											{role && (
												<p className="font-body text-label text-c58-muted uppercase tracking-[0.15em]">
													{role}
												</p>
											)}
										</div>
										{entry.setTime && (
											<span className="font-body text-label text-c58-muted uppercase tracking-[0.15em] whitespace-nowrap">
												{entry.setTime}
											</span>
										)}
									</li>
								)
							})}
						</ul>
					</section>
				)}

				{faq.length > 0 && (
					<section>
						<h2 className="font-display font-bold text-headline uppercase tracking-[0.04em] text-c58-white mb-6">
							FAQ
						</h2>
						<dl className="space-y-6">
							{faq.map((entry: SanityFaqEntry) => (
								<div key={entry._key}>
									<dt className="font-display font-bold uppercase tracking-[0.04em] text-c58-white mb-2">
										{entry.question}
									</dt>
									<dd>
										<PortableText value={entry.answer} components={portableTextComponents} />
									</dd>
								</div>
							))}
						</dl>
					</section>
				)}
			</div>
		</article>
	)
}
