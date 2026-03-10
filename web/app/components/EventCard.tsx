import { SanityEvent } from '@/types/sanity'
import { urlFor } from '@/sanity/image'
import { formatEventDate } from '@/lib/dateFormat'
import Image from 'next/image'

interface EventCardProps {
	event: SanityEvent
	featured?: boolean
	past?: boolean
}

// NOTE: Design specifies a TICKETS → CTA linking to a ticket URL.
// SanityEvent has no ticketUrl field — only cost (string).
// The button is rendered as a visual placeholder until ticketUrl is added to the schema.

export default function EventCard({ event, featured = false, past = false }: EventCardProps) {
	const imageUrl = event.image
		? urlFor(event.image).width(featured ? 1200 : 800).height(featured ? 675 : 450).url()
		: null

	return (
		<div
			className={`group relative bg-c58-void border border-c58-border hover:border-c58-ice-border hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(125,212,252,0.08)] transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.25,0.46,0.45,0.94)] ${
				featured && !past ? 'animate-[glowPulse_3s_ease-in-out_infinite]' : ''
			}`}
		>
			{/* Image */}
			<div className="relative w-full aspect-video overflow-hidden">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={`Event image for ${event.title}`}
						fill
						className={`object-cover transition-[filter] duration-300 ${
							past
								? 'grayscale-[60%] brightness-[60%]'
								: 'grayscale-[30%] brightness-[85%] group-hover:grayscale-0 group-hover:brightness-100'
						}`}
					/>
				) : (
					<div className="w-full h-full bg-c58-void flex items-center justify-center">
						<span className="font-display font-bold uppercase tracking-[0.04em] text-c58-ghost text-[clamp(1.5rem,4vw,3rem)]">
							{event.title}
						</span>
					</div>
				)}
			</div>

			{/* Card body */}
			<div className="p-4 md:p-6">

				{/* Date + location */}
				<div className="flex items-center justify-between mb-4">
					<span className="font-body text-label text-c58-ice uppercase tracking-[0.15em]">
						{formatEventDate(event.date)}
					</span>
					{event.location && (
						<span className="font-body text-label text-c58-muted uppercase tracking-[0.15em]">
							{event.location}
						</span>
					)}
				</div>

				{/* Event name */}
				<h3
					className={`font-display font-bold uppercase leading-[0.9] tracking-[0.04em] text-c58-white mb-6 ${
						featured ? 'text-[clamp(2.25rem,5vw,4rem)]' : 'text-[clamp(1.5rem,3vw,2.5rem)]'
					}`}
				>
					{event.title}
				</h3>

				{/* CTA + doors */}
				<div className="flex items-center justify-between">
					{past ? (
						<span className="font-body text-label text-c58-muted uppercase tracking-[0.15em]">
							PAST
						</span>
					) : (
						<span className="font-body text-label uppercase tracking-[0.15em] bg-c58-ice text-c58-black px-8 py-3.5 inline-block">
							{event.cost ? event.cost : 'TICKETS →'}
						</span>
					)}
					{event.time && (
						<span className="font-body text-label text-c58-muted uppercase tracking-[0.15em]">
							DOORS {event.time}
						</span>
					)}
				</div>
			</div>
		</div>
	)
}
