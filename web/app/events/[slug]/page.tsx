import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PortableText } from 'next-sanity'
import { getAllEventSlugs, getEventBySlug } from '@/sanity/fetch'
import { getDynamicFetchOptions, getMetadataFetchOptions, PUBLISHED_FETCH_OPTIONS } from '@/sanity/fetchOptions'
import { urlFor } from '@/sanity/image'
import { formatEventDate } from '@/lib/dateFormat'
import { googleMapsSearchUrl, singleLineAddress } from '@/lib/address'
import { eventJsonLd } from '@/lib/structuredData'
import { siteUrl } from '@/lib/siteUrl'
import { shareMetadata } from '@/lib/shareMetadata'
import JsonLd from '@/app/components/JsonLd'
import { isMarketingOptInEnabled } from '@/lib/marketingOptIn'
import portableTextComponents from '@/lib/portableTextComponents'
import type { SanityLineupEntry, SanityFaqEntry } from '@/types/sanity'
import TierPicker from './TierPicker'

export async function generateStaticParams() {
	return await getAllEventSlugs(PUBLISHED_FETCH_OPTIONS)
}

export async function generateMetadata(
	{ params }: PageProps<'/events/[slug]'>
): Promise<Metadata> {
	const { slug } = await params
	const event = await getEventBySlug(slug, await getMetadataFetchOptions())
	if (!event) return {}

	const ogImage = event.image
		? urlFor(event.image).width(1200).height(630).url()
		: undefined

	return {
		title: event.title,
		openGraph: shareMetadata({ title: event.title, imageUrl: ogImage }),
	}
}

export default async function EventPage({ params }: PageProps<'/events/[slug]'>) {
	const { slug } = await params
	const event = await getEventBySlug(slug, await getDynamicFetchOptions())

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
			<JsonLd data={eventJsonLd(event, siteUrl(), imageUrl)} />
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
					{/* Also what Google's event listing uses — the structured data
					    below must match what the page shows */}
					{event.venueAddress && (
						<p className="font-body text-body text-c58-muted mt-6">
							{singleLineAddress(event.venueAddress)}
							{' · '}
							<a
								href={googleMapsSearchUrl(event.venueAddress)}
								target="_blank"
								rel="noopener noreferrer"
								className="text-c58-ice hover:text-c58-white transition-colors duration-200"
							>
								Open in Google Maps →
							</a>
						</p>
					)}
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
					{details && tiers.length > 0 ? (
						<>
							<TierPicker
								eventDetailsId={details._id}
								tiers={tiers}
								marketingOptInEnabled={isMarketingOptInEnabled()}
								ticketingStatus={details.ticketingStatus}
								eventDate={event.date}
							/>
							{/* Whatever the sale state — a sold-out or event-day page is
							    where a buyer who's lost their email lands (8UI.3). Our own
							    ticketing only: Skiddle sends its own tickets. */}
							<p className="font-body text-body text-c58-muted mt-6">
								Already bought?{' '}
								<Link href="/orders" className="text-c58-ice hover:text-c58-white transition-colors duration-200">
									Resend your tickets →
								</Link>
							</p>
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
